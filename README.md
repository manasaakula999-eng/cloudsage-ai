# CloudSage AI — Open-Source Document Intelligence

CloudSage AI is a starter project for asking questions about PDF documentation using retrieval-augmented generation (RAG).

**Stack:** Angular standalone frontend · FastAPI · PyMuPDF · scikit-learn TF-IDF retrieval · Ollama + Gemma

> This is an MVP starter, not a production-ready service. It keeps uploaded documents in server memory and is intended for local development.

## Features
- Upload a PDF
- Extract and split text into chunks
- Retrieve relevant passages using TF-IDF similarity
- Generate an answer with a local Gemma model through Ollama
- Show retrieved source pages and passages
- Basic backend tests and GitHub Actions CI

## Requirements
- Node.js 20.19+ or 22.12+ (recommended for current Angular)
- Python 3.11+
- Ollama (optional, for AI-generated answers)

## 1. Run the backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URL: http://localhost:8000  
API docs: http://localhost:8000/docs

### Enable Gemma answers (optional)
Install Ollama from https://ollama.com, then run:

```bash
ollama pull gemma3:1b
ollama serve
```

If your Ollama installation uses a different model, set `OLLAMA_MODEL` before starting FastAPI. Example:

```bash
# Windows PowerShell
$env:OLLAMA_MODEL="gemma3:1b"
uvicorn app.main:app --reload
```

If Ollama is unavailable, the API returns a clearly labeled extractive fallback based on the retrieved text.

## 2. Run the Angular frontend

Open another terminal:

```bash
cd frontend
npm install
npm start
```

Open http://localhost:4200

This repository includes the Angular application source and configuration. If your local Angular CLI setup differs, install the dependencies with `npm install` and run `npx ng serve`.

## How it works

1. The PDF is extracted page by page.
2. Text is split into overlapping chunks.
3. TF-IDF scores the chunks against the question.
4. The top matching passages are sent to Ollama/Gemma.
5. The response includes the retrieved source passages and page numbers.

## API
- `GET /api/health`
- `POST /api/documents` — multipart PDF upload
- `POST /api/chat` — `{ "question": "..." }`
- `DELETE /api/documents` — clear the in-memory document

## Limitations and next steps
- Documents are stored in memory and are cleared when the backend restarts.
- TF-IDF is a simple lexical retriever, not a semantic vector database.
- Ollama must be running locally for Gemma-generated responses.
- Do not upload confidential or sensitive documents to this demo.
- For production, add authentication, persistent storage, file size limits, malware scanning, rate limiting, robust prompt-injection defenses, and evaluation tests.
- Consider adding semantic embeddings, Firebase Authentication, Cloud Run deployment, and an accessible UI.

## Open-source contribution
See [CONTRIBUTING.md](CONTRIBUTING.md). Before publishing, replace the demo repository URL in `CONTRIBUTING.md` with your GitHub repository URL.

## License
MIT — see [LICENSE](LICENSE).
