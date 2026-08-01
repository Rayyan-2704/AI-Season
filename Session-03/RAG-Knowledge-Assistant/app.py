"""
AI Season Knowledge Assistant — Streamlit UI
==============================================

Thin UI layer. Only imports `run_all_combinations()` from backend.py.
This file never reaches into backend internals directly (per PRD Section 10) —
all chunking, embedding, retrieval, and Groq logic lives in backend.py.

Layout follows PRD Section 8: a simple, sequential, native-Streamlit layout
(NOT a custom-CSS card grid) — title -> input -> Vector Retrieval section
(3 chunking blocks) -> BM25 Keyword Retrieval section (3 chunking blocks).

Run with:
    streamlit run app.py
"""

import streamlit as st
from backend import run_all_combinations, IS_MOCK_MODE, GROQ_API_KEY, LLM_PROVIDER


# =========================================================
# PAGE CONFIG
# =========================================================
st.set_page_config(page_title="AI Season RAG Assistant", layout="wide")


# =========================================================
# LIGHT OPTIONAL CSS POLISH (accent color only — no card grid, per Section 8)
# =========================================================
st.markdown("""
<style>
h1, h2 {
    color: #4F46E5;
}
.main-title {
    text-align: center;
}
</style>
""", unsafe_allow_html=True)


# =========================================================
# STARTUP GUARD — fail fast and visibly if misconfigured
# =========================================================
if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
    st.error(
        "GROQ_API_KEY is missing from your .env file, but LLM_PROVIDER is set to "
        "'groq'. Add your key to .env, or set LLM_PROVIDER=mock for local dev."
    )
    st.stop()


# =========================================================
# HEADER
# =========================================================
st.markdown("<h1 class='main-title'>AI Season Knowledge Assistant</h1>", unsafe_allow_html=True)
st.caption("Compare 3 chunking methods x 2 retrieval strategies, side by side")

if IS_MOCK_MODE:
    st.caption("⚠️ Running in mock mode — no Groq API key detected")


# =========================================================
# QUERY INPUT — single text_input, reruns automatically when truthy
# (matches PRD Section 8's reference pattern; no separate submit button)
# =========================================================
question = st.text_input("Ask a question about AI Season")


# =========================================================
# EXPERIMENT LIST — exact order from PRD Section 8: Fixed, Recursive, Paragraph
# =========================================================
EXPERIMENTS = [
    ("Fixed Chunking", "fixed"),
    ("Recursive Chunking", "recursive"),
    ("Paragraph Chunking", "paragraph"),
]


def render_section(section_title: str, retrieval_method: str, results: dict):
    st.title(section_title)
    for chunking_name, chunking_key in EXPERIMENTS:
        st.header(chunking_name)
        leaf = results[retrieval_method][chunking_key]

        st.write(leaf["answer"])
        st.caption(f"🧮 Total tokens used: {leaf['token_usage']['total_tokens']}")

        with st.expander("Show retrieved chunks"):
            for i, chunk in enumerate(leaf["chunks"], 1):
                st.write(f"Chunk {i}")
                st.write(chunk["text"])

        st.divider()


# =========================================================
# RESULTS — only rendered once a question is entered
# =========================================================
if question:
    with st.spinner("Running all 6 pipelines..."):
        results = run_all_combinations(question)

    st.divider()
    render_section("Vector Retrieval", "vector", results)
    render_section("BM25 Keyword Retrieval", "bm25", results)