# AI Real-Time News Synthesis Engine

**Frontend Repository:** [news_summariser_frontend](https://github.com/Divyam2368/news_summariser_frontend)

## The Problem
The daily news cycle is highly fragmented and redundant. Users suffer from information overload, scrolling through dozens of articles across different platforms that ultimately report the exact same event.

## The Solution
A real-time, topic-clustered news synthesis pipeline that autonomously cuts through the noise. It scrapes high-volume live feeds, generates semantic embeddings, detects near-duplicate news events via vector similarity, and uses an LLM to generate balanced, deduplicated executive summaries.

## Core Architecture
* **Backend:** Node.js, TypeScript, REST APIs
* **Database & ORM:** PostgreSQL, Prisma
* **Vector Search:** `pgvector` (HNSW indexing)
* **AI Pipeline:** LangChain, LLM for semantic synthesis

## Key Architectural Decisions & Trade-offs

### Unified Database over Dedicated Vector Store
Rather than introducing a dedicated vector database (like Pinecone or Milvus), this system uses PostgreSQL with the `pgvector` extension.

* **Trade-off:** Dedicated stores offer optimized out-of-the-box ANN (Approximate Nearest Neighbor) indexing, but they introduce a severe dual-write problem. Reconciling relational metadata in SQL with vector IDs in a separate system risks distributed consistency failures.
* **Outcome:** By tuning HNSW indexing directly inside PostgreSQL, the architecture remains strictly ACID compliant, eliminates network latency between two databases, and executes complex metadata filtering and cosine distance ranking in a single query.
