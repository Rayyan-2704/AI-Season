# AI Season Knowledge Assistant

A Retrieval-Augmented Generation (RAG) chatbot that answers questions about
the AI Season Bootcamp document. Instead of producing a single answer, it
runs the **same query through 6 pipelines simultaneously** — 3 chunking
methods x 2 retrieval strategies — and displays all 6 answers side by side,
so the real-world impact of chunking/retrieval choices is directly visible
and comparable.

---

## Overview

| | |
|---|---|
| **Goal** | Compare how chunking strategy and retrieval strategy each independently affect RAG answer quality |
| **Chunking methods** | Fixed-size, Paragraph-based, Recursive |
| **Retrieval methods** | Vector search (dense, semantic) with MMR, BM25 (sparse, keyword) |
| **Combinations tested per query** | 3 x 2 = 6, run in parallel |
| **LLM** | Groq (`llama-3.1-8b-instant` by default) |
| **UI** | Streamlit, sequential native layout |
| **Backend** | Fully standalone — runnable and testable with zero UI dependency |

---

## Tech stack & libraries

| Layer | Library | What it's used for |
|---|---|---|
| Orchestration | `langchain-core` | `Document` objects, `SystemMessage`/`HumanMessage` for prompt construction |
| Chunking (fixed) | `langchain-text-splitters` → `CharacterTextSplitter` | Naive, separator-based splitting (`\n`) — the deliberately "dumb" baseline method |
| Chunking (recursive) | `langchain-text-splitters` → `RecursiveCharacterTextSplitter` | Tries paragraph → line → sentence → word → character splits in order, falling back gracefully |
| Chunking (paragraph) | Python stdlib `re` | Custom blank-line-delimited paragraph splitting, with merge/hard-split logic for size consistency |
| Vector database | `chromadb` via `langchain-chroma` | Persisted vector store, one collection per chunking method |
| Embeddings | `langchain-huggingface` → `HuggingFaceEmbeddings` | Wraps `sentence-transformers/all-MiniLM-L6-v2` for turning text into vectors |
| Keyword retrieval | `rank_bm25` via `langchain-community` → `BM25Retriever` | In-memory sparse/term-frequency retrieval, built directly from chunk lists (not from Chroma) |
| LLM calls | `langchain-groq` → `ChatGroq` | Wraps the Groq API; extracts `response_metadata["token_usage"]` for real token counts |
| Parallelism | `concurrent.futures.ThreadPoolExecutor` | Runs all 6 retrieval+generation pipelines concurrently instead of sequentially |
| Env management | `python-dotenv` | Loads `GROQ_API_KEY`, `LLM_PROVIDER`, `GROQ_MODEL` from `.env` |
| UI | `streamlit` | Sequential dashboard: input -> Vector Retrieval section -> BM25 Keyword Retrieval section |

Full pinned list in `requirements.txt`.

---

## Architecture

### Ingestion (runs once per chunking method, then persisted)
```
docs/aiseason-document.txt
   |
   +--> Fixed-size chunking     --> embed (MiniLM) --> Chroma collection "fixed"
   +--> Paragraph chunking      --> embed (MiniLM) --> Chroma collection "paragraph"
   +--> Recursive chunking      --> embed (MiniLM) --> Chroma collection "recursive"
```
Each chunking method gets its own persisted Chroma collection under
`db/chroma_db/<method>/`, since chunk boundaries differ between methods.
BM25 retrievers are built in-memory from the *same* chunk lists (via a
shared, cached `get_chunks()` helper) — not from Chroma — so vector and BM25
retrieval are compared on identical chunk boundaries per method.

### Retrieval + generation (runs per query, x6)
```
User question
   |
   +-- for each chunking_method in [fixed, paragraph, recursive]:
         +-- Vector search (MMR) --> top-3 chunks (w/ similarity scores) --> Groq --> answer + tokens
         +-- BM25 keyword search --> top-3 chunks (w/ BM25 scores)       --> Groq --> answer + tokens
   |
   +--> all 6 results assembled into one nested dict, rendered in the dashboard
```
All 6 combinations run concurrently via `ThreadPoolExecutor`, not one at a time.

---

## Chunking methods (as implemented)

| Method | Implementation | Behavior |
|---|---|---|
| **Fixed** | `CharacterTextSplitter(separator="\n", chunk_size=500, chunk_overlap=50)` | Naive — splits on line breaks and merges up to the size limit, ignoring sentence/paragraph structure. Doesn't force-split lines longer than 500 chars (a known LangChain behavior, intentionally left as-is since this is meant to be the "dumb" baseline) |
| **Paragraph** | Custom, blank-line (`\n\n`) delimited split, with small-paragraph merging and oversized-paragraph hard-splitting | Structure-aware — respects the document's actual paragraph boundaries. Tends to run somewhat smaller on average than the 500-char target, since paragraph boundaries don't align perfectly with a fixed size |
| **Recursive** | `RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50, separators=["\n\n", "\n", ". ", " ", ""])` | Tries paragraph breaks first, then lines, then sentences, then words, then raw characters as a last resort — generally the best-behaved and most balanced of the three |

All chunks are tagged with metadata (`chunk_id`, `chunking_method`, `source`)
for traceability back to the original document.

---

## Retrieval methods (as implemented)

| Method | Implementation | Score type |
|---|---|---|
| **Vector search (MMR)** | `Chroma.max_marginal_relevance_search(k=3, fetch_k=10, lambda_mult=0.5)` | Cosine similarity, ~0.0-1.0. Scores are looked up separately (via `similarity_search_with_relevance_scores`) since MMR's own selection also weighs result diversity, not just raw similarity |
| **BM25** | `BM25Retriever.from_documents(chunks)`, scores pulled directly from the underlying `rank_bm25` vectorizer | Unbounded term-frequency score, typically 0-20+, not comparable 1:1 with vector scores |

Both retrievers return the top `TOP_K = 3` chunks per query. Tuning constants
(`CHUNK_SIZE`, `CHUNK_OVERLAP`, `TOP_K`, `MMR_FETCH_K`, `MMR_LAMBDA`) all live
at the top of `backend.py` (Section 1: Config & Constants).

---

## Prompting & guardrails

A strict system prompt instructs the model to:
1. Answer only from the provided context, never outside knowledge
2. Return an exact refusal string if the context doesn't cover the question:
   *"I don't have enough information in the AI Season document to answer that question."*
3. Stay concise and direct
4. For partially-relevant context, answer what it can rather than refusing entirely
5. Never mention "context" or "chunks" explicitly in the answer

This is enforced identically across all 6 pipelines, so out-of-scope
questions reliably produce the same refusal regardless of which
chunking/retrieval combination is used.

---

## Token usage tracking

Real token counts come from Groq's own response metadata
(`response_metadata["token_usage"]`) via `ChatGroq` — not re-estimated with
`tiktoken`. Mock mode (see below) falls back to a rough character-based
estimate instead, since no real API call is made.

---

## Project structure

```
RAG-Knowledge-Assistant/
├── .env                  # your local config (gitignored — see below)
├── .env.example          # template for .env
├── requirements.txt
├── docs/
│   ├── aiseason-document.txt
│   └── Knowledge-Assistant_PRD.md
├── db/chroma_db/         # persisted vector stores, auto-created on first run
├── backend.py            # ALL pipeline logic (chunking, retrieval, prompting, Groq calls, orchestration)
├── app.py                # thin Streamlit UI layer — imports run_all_combinations() from backend.py
├── README.md
└── .gitignore
```

`backend.py` is the graded deliverable and is fully standalone — see
"Running" below. `app.py` never reaches into chunking/retrieval internals
directly; it only calls `run_all_combinations()`.

---

## Setup

### 1. Create and activate a virtual environment
```bash
python -m venv venv
venv\Scripts\activate.bat        # Windows (cmd)
# venv\Scripts\Activate.ps1      # Windows (PowerShell)
# source venv/bin/activate       # macOS/Linux
```

### 2. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure environment variables
Copy the template and fill in your Groq key:
```bash
cp .env.example .env       # macOS/Linux
copy .env.example .env     # Windows
```
Edit `.env`:
```
GROQ_API_KEY=your_groq_key_here
LLM_PROVIDER=groq          # or "mock" to run without a key
GROQ_MODEL=llama-3.1-8b-instant
```
If `LLM_PROVIDER=groq` but no key is set, the app safely falls back to mock
mode with a visible warning rather than crashing.

### 4. Add the knowledge base document
Place your AI Season `.txt` file at:
```
docs/<filename>.txt
```
Update `DOCS_PATH` in `backend.py` (Section 1: Config & Constants) if your
filename differs from the default.

---

## Running

### Streamlit dashboard (the full app)
```bash
streamlit run app.py
```
This automatically triggers ingestion (chunking + embedding + Chroma
persistence) on first run via `backend.py`. Subsequent runs load the
persisted collections instantly instead of re-embedding.

Type a question in the search box — results render automatically as soon as
you type (no submit button needed). You'll see two sections, each with 3
chunking-method blocks: **Vector Retrieval** (MMR) and **BM25 Keyword
Retrieval**. Each block shows the generated answer, a token-usage count, and
a "Show retrieved chunks" expander with each chunk's text, score, and source.

### Backend only (no UI)
`backend.py` is fully self-contained and can be run/tested independently:
```bash
python backend.py
```
This builds/loads all 3 Chroma collections and runs one sample question
through all 6 pipelines, printing every answer, token count, and retrieved
chunk. Add `--verbose` for the full stage-by-stage diagnostics used during
development (chunking stats, per-collection counts, individual MMR/BM25
previews):
```bash
python backend.py --verbose
```

---

## Configuration reference

All tunable constants live at the top of `backend.py`:

| Constant | Default | Purpose |
|---|---|---|
| `CHUNK_SIZE` | 500 | Target chunk size in characters |
| `CHUNK_OVERLAP` | 50 | Overlap between consecutive chunks (fixed/recursive) |
| `TOP_K` | 3 | Chunks retrieved per query, per pipeline |
| `MMR_FETCH_K` | 10 | Candidate pool size MMR selects its diverse top-k from |
| `MMR_LAMBDA` | 0.5 | MMR relevance/diversity balance (0 = max diversity, 1 = max relevance) |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace embedding model |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Overridable via `.env` |
| `DOCS_PATH` | `docs/aiseason-document.txt` | Knowledge base file location |
| `PERSIST_DIR` | `db/chroma_db` | Chroma persistence root |

---

## Notes

- **Mock mode:** set `LLM_PROVIDER=mock` in `.env` to test the pipeline
  without making real Groq API calls (useful for local dev / avoiding rate
  limits). A visible mock-mode indicator appears in the UI when active.
- **Out-of-scope questions:** verified to consistently trigger the exact
  refusal string across all 6 pipelines, not just some of them.
- **A harmless `torchvision`-related warning** may appear in the terminal
  when running `streamlit run app.py` — this comes from Streamlit's file
  watcher probing optional vision-model submodules inside `transformers`
  that this project doesn't use. It doesn't affect functionality. To
  silence it, run:
  ```bash
  streamlit run app.py --server.fileWatcherType none
  ```