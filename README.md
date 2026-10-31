# CS Assistant (Universal Assistant Monorepo)

A powerful, robust AI-powered assistant engineered with cross-platform clients (Web, Desktop, and Mobile) and a FastAPI AI backend with support for local offline LLMs, RAG knowledge retrieval, and study/task planners.

---

## 📁 Repository Structure

```text
cs_assistant/
│
├── backend/                  # FastAPI Python backend (AI, RAG, Planners, Auth)
│   ├── app/                  # Application source code
│   │   ├── core/             # Core engines (RAG, local LLM, vectorstore)
│   │   ├── routes/           # REST endpoints
│   │   ├── models.py         # Pydantic data schemas
│   │   └── main.py           # FastAPI entrypoint
│   ├── tests/                # Automated API & unit tests
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Container deployment configuration
│
├── frontend-web/             # React + Vite Web application & Electron Desktop
│   ├── src/                  # React UI components, pages, context, and state
│   ├── electron/             # Desktop client wrapper (main.cjs, preload.cjs)
│   ├── package.json          # Web dependencies and scripts
│   ├── tailwind.config.js    # UI styling configuration
│   └── vite.config.ts        # Vite build tool configuration
│
├── frontend-mobile/          # React Native & Expo Mobile application (iOS/Android)
│   ├── src/                  # Mobile screens and navigation
│   ├── App.tsx               # Expo root component
│   ├── package.json          # React Native dependencies
│   └── app.json              # Expo configuration
│
├── data/                     # Raw datasets, exam PYQs, and ingestion materials
│   ├── CS/                   # Subject questions and answers
│   └── source_replacements/  # Reference PDFs
│
├── models/                   # Local offline AI model weights (GGUF)
│   └── .gitkeep
│
├── .gitignore                # Global ignore rules
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` (Swagger docs at `/docs`).

---

### 2. Web & Desktop Frontend Setup
```bash
cd frontend-web
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

*To run as a Desktop app:*
```bash
npm run electron:dev
```

---

### 3. Mobile App Setup (Expo)
```bash
cd frontend-mobile
npm install
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone.

---

## 🌿 Git Branching Strategy
* **`main`**: Production-ready, stable releases.
* **`develop`**: Primary development & feature integration branch.
* **`feature/<name>`**: Individual feature branches created from `develop`.

---

## 🔒 Security Note
Never commit `.env` files or model weights (`*.gguf`) into source control. All secrets should be configured locally using `.env.example` as a template.

