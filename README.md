# RepoPilot 🚀

> **AI Autonomous Developer** — Analyzes your codebase, plans engineering tasks, generates multi-file edits, and reviews its own work.

Built for the **Mistral AI Hackathon** 🏆

![Stack](https://img.shields.io/badge/React-Vite-blue?style=flat&logo=react)
![Backend](https://img.shields.io/badge/Python-FastAPI-green?style=flat&logo=python)
![AI](https://img.shields.io/badge/Powered_by-Mistral_AI-orange?style=flat)

---

## 🎯 What is RepoPilot?

RepoPilot is an **AI-powered** tool that acts as an autonomous developer. Instead of generating isolated code snippets, it performs **structured goal execution** across an entire project:

1. **📂 Import** — Clone any GitHub repository
2. **📋 Plan** — AI analyzes the codebase and creates a structured task plan
3. **⚡ Code** — AI generates multi-file code changes for each task
4. **🔍 Review** — AI self-reviews all changes for quality and correctness
5. **✅ Apply** — Approve and apply changes to the repository

## 🧠 AI Architecture

RepoPilot uses a **multi-agent pipeline** powered by Mistral AI:

| Agent | Model | Role |
|-------|-------|------|
| **Planner** | Mistral Large | Analyzes repo + goal → structured task breakdown |
| **Coder** | Codestral | Generates precise code changes per task |
| **Reviewer** | Mistral Large | Reviews all changes for quality + goal alignment |

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Zustand** — State management
- **Lucide React** — Icons
- **Framer Motion** — Animations
- Custom dark theme with glassmorphism design

### Backend
- **Python 3.11+** + **FastAPI**
- **Mistral AI SDK** — AI model integration
- **GitPython** — Repository operations
- **WebSocket** — Real-time streaming

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Mistral AI API key

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your MISTRAL_API_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

## 📁 Project Structure

```
RepoPilot/
├── frontend/                     # React + Vite
│   ├── src/
│   │   ├── components/           # UI components
│   │   │   ├── repo/             # File tree, code viewer
│   │   │   ├── pipeline/         # Goal, plan, diff, log
│   │   │   └── review/           # Review panel
│   │   ├── pages/                # Landing, Workspace
│   │   ├── services/             # API client
│   │   ├── stores/               # Zustand state
│   │   └── types/                # TypeScript types
│   └── ...
├── backend/                      # Python FastAPI
│   ├── app/
│   │   ├── api/routes/           # REST endpoints
│   │   ├── services/ai/          # Planner, Coder, Reviewer agents
│   │   ├── services/             # Repo, diff, session services
│   │   └── models/               # Pydantic schemas
│   └── requirements.txt
└── README.md
```

## 🏗 Pipeline Flow

```
User Goal → [Planner Agent] → Task Plan → [Coder Agent] → File Changes → [Reviewer Agent] → Review Report → Apply
```

## 📝 License

MIT — Built with ❤️ for the Mistral AI Hackathon
