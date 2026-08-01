"""
AI Season Knowledge Assistant — RAG Backend
=============================================

Single-file backend for the RAG chunking & retrieval comparison dashboard.

This file is the graded deliverable: it contains ALL pipeline logic
(ingestion, chunking, retrieval, prompting, Groq calls, orchestration).
`app.py` is a thin Streamlit UI layer that only imports `run_all_combinations()`
from here — it never reaches into internals directly.

Runnable standalone:
    python backend.py
"""

# =========================================================
# 1. CONFIG & CONSTANTS
# =========================================================
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 3
MMR_FETCH_K = 10
MMR_LAMBDA = 0.5

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
GROQ_MODEL_DEFAULT = "llama-3.1-8b-instant"  # fallback if env var not set

DOCS_PATH = "docs/aiseason-document.txt"
PERSIST_DIR = "db/chroma_db"

CHUNKING_METHODS = ["fixed", "paragraph", "recursive"]
RETRIEVAL_METHODS = ["vector", "bm25"]


# =========================================================
# 2. IMPORTS & ENV SETUP
# =========================================================
import os
import re
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter, CharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever

load_dotenv()  # reads .env in the project root into os.environ

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock").strip().lower()
GROQ_MODEL = os.getenv("GROQ_MODEL", GROQ_MODEL_DEFAULT).strip()

# Mock mode is active if the user explicitly set LLM_PROVIDER=mock,
# OR if they said "groq" but forgot to supply a real key.
IS_MOCK_MODE = (LLM_PROVIDER == "mock") or (LLM_PROVIDER == "groq" and not GROQ_API_KEY)

if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
    print("[WARN] LLM_PROVIDER=groq but GROQ_API_KEY is missing/empty — falling back to MOCK MODE.")


def print_config_summary() -> None:
    """Quick human-readable dump of the active config. Used by the CLI test block."""
    print("=" * 55)
    print("AI Season Knowledge Assistant — Config Summary")
    print("=" * 55)
    print(f"CHUNK_SIZE        : {CHUNK_SIZE}")
    print(f"CHUNK_OVERLAP     : {CHUNK_OVERLAP}")
    print(f"TOP_K             : {TOP_K}")
    print(f"MMR_FETCH_K       : {MMR_FETCH_K}")
    print(f"MMR_LAMBDA        : {MMR_LAMBDA}")
    print(f"EMBEDDING_MODEL   : {EMBEDDING_MODEL}")
    print(f"GROQ_MODEL        : {GROQ_MODEL}")
    print(f"DOCS_PATH         : {DOCS_PATH}")
    print(f"PERSIST_DIR       : {PERSIST_DIR}")
    print(f"CHUNKING_METHODS  : {CHUNKING_METHODS}")
    print(f"RETRIEVAL_METHODS : {RETRIEVAL_METHODS}")
    print("-" * 55)
    print(f"LLM_PROVIDER (env): {LLM_PROVIDER}")
    print(f"GROQ_API_KEY set  : {'yes' if GROQ_API_KEY else 'no'}")
    print(f"MODE              : {'MOCK' if IS_MOCK_MODE else 'LIVE (Groq)'}")
    print("=" * 55)


# =========================================================
# 3. CHUNKING METHODS
# =========================================================

def load_document(path: str = DOCS_PATH) -> str:
    """Read the knowledge-base .txt file as a single string."""
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Knowledge base file not found at '{path}'. "
            f"Place your AI Season Bootcamp .txt file there before running chunking."
        )
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def fixed_chunk(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[Document]:
    """
    Naive fixed-size chunking via LangChain's CharacterTextSplitter.
    Splits on the given separator ("\\n"), falling back to raw character
    slicing when a segment is still too long. Intentionally the least
    structure-aware of the three methods — the PRD's baseline comparison point.
    """
    splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=chunk_size,
        chunk_overlap=overlap,
    )
    raw_chunks = splitter.split_text(text)

    chunks = [
        Document(
            page_content=t.strip(),
            metadata={
                "chunk_id": f"fixed_{i}",
                "chunking_method": "fixed",
                "source": DOCS_PATH,
            },
        )
        for i, t in enumerate(raw_chunks)
        if t.strip()
    ]
    return chunks


def paragraph_chunk(text: str, max_size: int = CHUNK_SIZE) -> list[Document]:
    """
    Structure-aware chunking: split on blank-line-delimited paragraphs.
    - Tiny paragraphs get merged with the next one so we don't end up with
      dozens of near-empty chunks.
    - Oversized paragraphs get hard-split at max_size so no chunk wildly
      exceeds the target size (keeps this comparable to fixed/recursive).
    """
    raw_paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    # Merge tiny paragraphs forward into the next one
    MIN_SIZE = max_size // 4  # paragraphs smaller than this get merged
    merged = []
    buffer = ""
    for para in raw_paragraphs:
        if buffer:
            buffer = buffer + "\n\n" + para
        else:
            buffer = para
        if len(buffer) >= MIN_SIZE:
            merged.append(buffer)
            buffer = ""
    if buffer:
        # leftover small buffer — attach to last chunk if possible, else keep standalone
        if merged:
            merged[-1] = merged[-1] + "\n\n" + buffer
        else:
            merged.append(buffer)

    # Hard-split any paragraph still over max_size
    final_texts = []
    for para in merged:
        if len(para) <= max_size:
            final_texts.append(para)
        else:
            for i in range(0, len(para), max_size):
                piece = para[i:i + max_size].strip()
                if piece:
                    final_texts.append(piece)

    chunks = [
        Document(
            page_content=t,
            metadata={
                "chunk_id": f"paragraph_{i}",
                "chunking_method": "paragraph",
                "source": DOCS_PATH,
            },
        )
        for i, t in enumerate(final_texts)
    ]
    return chunks


def recursive_chunk(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[Document]:
    """
    LangChain's RecursiveCharacterTextSplitter — tries paragraph breaks first,
    then line breaks, then sentence breaks, then words, then raw characters
    as a last resort. Generally the best-behaved of the three.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    raw_chunks = splitter.split_text(text)

    chunks = [
        Document(
            page_content=t.strip(),
            metadata={
                "chunk_id": f"recursive_{i}",
                "chunking_method": "recursive",
                "source": DOCS_PATH,
            },
        )
        for i, t in enumerate(raw_chunks)
        if t.strip()
    ]
    return chunks


CHUNKERS = {
    "fixed": fixed_chunk,
    "paragraph": paragraph_chunk,
    "recursive": recursive_chunk,
}

_chunks_cache: dict[str, list[Document]] = {}


def get_chunks(chunking_method: str) -> list[Document]:
    """
    Return the chunk list for a given method, computed once and cached
    in-memory for the lifetime of the process. Both the vector-store
    ingestion (Section 4) and the BM25 retriever (Section 5) call this,
    so they always operate on the exact same chunk boundaries.
    """
    if chunking_method not in CHUNKERS:
        raise ValueError(f"Unknown chunking_method '{chunking_method}'. Must be one of {CHUNKING_METHODS}")

    if chunking_method not in _chunks_cache:
        raw_text = load_document()
        _chunks_cache[chunking_method] = CHUNKERS[chunking_method](raw_text)

    return _chunks_cache[chunking_method]


# =========================================================
# 4. INGESTION / VECTOR STORE BUILDING
# =========================================================

_embedding_model = None


def get_embedding_model() -> HuggingFaceEmbeddings:
    """Lazily load the embedding model once and reuse it (it's ~90MB, don't reload per call)."""
    global _embedding_model
    if _embedding_model is None:
        print(f"[INFO] Loading embedding model '{EMBEDDING_MODEL}' (first call only)...")
        _embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return _embedding_model


def build_or_load_vector_store(chunking_method: str) -> Chroma:
    """
    Build a Chroma collection for the given chunking method, or load it from
    disk if it already exists — so we don't re-embed on every run.
    """
    persist_path = os.path.join(PERSIST_DIR, chunking_method)
    embeddings = get_embedding_model()
    already_exists = os.path.exists(persist_path) and len(os.listdir(persist_path)) > 0

    if already_exists:
        print(f"[INFO] Loading existing Chroma collection '{chunking_method}' from '{persist_path}'")
        vector_store = Chroma(
            collection_name=chunking_method,
            embedding_function=embeddings,
            persist_directory=persist_path,
        )
    else:
        print(f"[INFO] Building NEW Chroma collection '{chunking_method}' at '{persist_path}'")
        os.makedirs(persist_path, exist_ok=True)
        chunks = get_chunks(chunking_method)
        vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            collection_name=chunking_method,
            persist_directory=persist_path,
        )
        print(f"[INFO] Persisted {len(chunks)} chunks for '{chunking_method}'")

    return vector_store


def build_all_vector_stores() -> dict[str, Chroma]:
    """Build/load all 3 Chroma collections (fixed, paragraph, recursive)."""
    return {method: build_or_load_vector_store(method) for method in CHUNKING_METHODS}


# =========================================================
# 5. RETRIEVERS
# =========================================================

def get_mmr_retriever(
    chunking_method: str,
    k: int = TOP_K,
    fetch_k: int = MMR_FETCH_K,
    lambda_mult: float = MMR_LAMBDA,
):
    """
    Dense vector retriever using Maximal Marginal Relevance (MMR) — balances
    relevance to the query against diversity among the returned chunks, so
    we don't get 3 near-duplicate chunks back for a single question.
    """
    vector_store = build_or_load_vector_store(chunking_method)
    retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": k, "fetch_k": fetch_k, "lambda_mult": lambda_mult},
    )
    return retriever


# =========================================================
# (Stage 5) get_bm25_retriever(chunking_method) -> BaseRetriever

def get_bm25_retriever(chunking_method: str, k: int = TOP_K):
    """
    Sparse keyword/term-frequency retriever. Built in-memory directly from
    the same chunk lists used for the vector store (via get_chunks()) —
    NOT from Chroma — so it's a fair, apples-to-apples comparison against
    the vector retriever for each chunking method.
    """
    chunks = get_chunks(chunking_method)
    retriever = BM25Retriever.from_documents(chunks)
    retriever.k = k
    return retriever


# =========================================================
# 6. PROMPTING
# =========================================================
# (Stage 6) SYSTEM_PROMPT, build_user_prompt(context, question)


# =========================================================
# 7. LLM CALL
# =========================================================
# (Stage 6) call_groq(question, context_docs) -> dict (answer + token usage)


# =========================================================
# 8. ORCHESTRATION
# =========================================================
# (Stage 7) run_all_combinations(question) -> nested dict of all 6 results


# =========================================================
# 9. CLI TEST BLOCK
# =========================================================
if __name__ == "__main__":
    print_config_summary()

    print("\nLoading document and testing chunking methods...\n")
    try:
        raw_text = load_document()
        print(f"Loaded '{DOCS_PATH}' — {len(raw_text)} characters total.\n")

        for method_name, chunk_fn in [
            ("fixed", fixed_chunk),
            ("paragraph", paragraph_chunk),
            ("recursive", recursive_chunk),
        ]:
            docs = chunk_fn(raw_text)
            count = len(docs)
            avg_size = sum(len(d.page_content) for d in docs) / count if count else 0
            print(f"[{method_name.upper():9s}] chunks: {count:4d}   avg size: {avg_size:6.1f} chars")

    except FileNotFoundError as e:
        print(f"[SKIPPED] {e}")

    print("\nBuilding/loading vector stores for all chunking methods...\n")
    try:
        stores = build_all_vector_stores()
        for method, store in stores.items():
            count = store._collection.count()
            print(f"[{method.upper():9s}] Chroma collection count: {count}")
    except FileNotFoundError as e:
        print(f"[SKIPPED] {e}")

    print("\nTesting MMR vector retrievers with a sample question...\n")
    SAMPLE_QUESTION = "What is the AI Season Bootcamp about?"
    try:
        for method in CHUNKING_METHODS:
            print(f"--- {method.upper()} (MMR) ---")
            retriever = get_mmr_retriever(method)
            results = retriever.invoke(SAMPLE_QUESTION)
            for i, doc in enumerate(results, 1):
                preview = doc.page_content[:120].replace("\n", " ")
                print(f"  [{i}] {preview}...")
            print()
    except FileNotFoundError as e:
        print(f"[SKIPPED] {e}")

    print("\nTesting BM25 retrievers with the same sample question...\n")
    try:
        for method in CHUNKING_METHODS:
            print(f"--- {method.upper()} (BM25) ---")
            retriever = get_bm25_retriever(method)
            results = retriever.invoke(SAMPLE_QUESTION)
            for i, doc in enumerate(results, 1):
                preview = doc.page_content[:120].replace("\n", " ")
                print(f"  [{i}] {preview}...")
            print()
    except FileNotFoundError as e:
        print(f"[SKIPPED] {e}")