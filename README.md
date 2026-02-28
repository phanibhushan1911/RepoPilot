<p align="center">
  <img src="frontend/public/repopilot-logo.png" alt="RepoPilot Logo" width="80" />
</p>

<h1 align="center">RepoPilot 🚀</h1>

<p align="center">
  <strong>AI-Powered Autonomous Developer — Analyze, Plan, Code, Review & Ship.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_18-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-Python_3.11-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Powered_by-Mistral_AI-FF7000?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMiAyMmgyMEwxMiAyeiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=&logoColor=white" alt="Mistral AI" />
  <img src="https://img.shields.io/badge/WebSocket-Real_Time-blue?style=for-the-badge" alt="WebSocket" />
</p>

<p align="center">
  Built for the <strong>Mistral AI Hackathon</strong> 🏆
</p>

---

## 🎯 What is RepoPilot?

RepoPilot is an **AI-powered autonomous developer** that goes beyond code generation. Give it any GitHub repository and a natural-language goal, and it will:

1. **📂 Analyze** — Clone and deeply understand the codebase structure, languages, and architecture
2. **📋 Plan** — Generate a structured, multi-task development plan using AI
3. **⚡ Code** — Produce precise, multi-file code changes for each task
4. **🔍 Review** — Self-review all generated changes for quality, correctness, and goal alignment
5. **✅ Apply** — Commit approved changes back to the repository
6. **💬 Chat** — Discuss the code, ask questions, and request follow-up improvements

> **Think of it as an AI developer that doesn't just write code — it thinks, plans, executes, and reviews like a senior engineer.**

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph Client["🖥️ Frontend (React + Vite)"]
        LP["Landing Page"]
        WP["Workspace Page"]
        
        subgraph UIComponents["UI Components"]
            FT["📁 File Tree"]
            CV["📄 Code Viewer"]
            GI["🎯 Goal Input"]
            PV["📋 Plan View"]
            DV["🔀 Diff Viewer"]
            SP["📊 Summary Panel"]
            CP["💬 Chat Panel"]
            EL["📝 Execution Log"]
            RP["🔍 Review Panel"]
        end
        
        subgraph State["State Management (Zustand)"]
            RS["Repo Store\n(sessionStorage)"]
            PS["Pipeline Store"]
        end
    end

    subgraph Server["⚙️ Backend (FastAPI + Python)"]
        subgraph API["REST API Routes"]
            RepoAPI["POST /api/repo/clone\nGET /api/repo/{id}/tree\nGET /api/repo/{id}/file"]
            PipeAPI["POST /api/pipeline/session\nPOST /api/pipeline/{id}/plan\nPOST /api/pipeline/{id}/execute\nPOST /api/pipeline/{id}/apply"]
            AIAPI["POST /api/ai/explain\nGET /api/ai/{id}/summary\nPOST /api/ai/{id}/chat"]
        end
        
        WS["🔌 WebSocket Server\n(Real-time Progress)"]
        
        subgraph Services["Core Services"]
            RepoService["Repo Service\n(GitPython)"]
            SessionMgr["Session Manager"]
            DiffService["Diff Service"]
        end
        
        subgraph Agents["🤖 AI Agent Pipeline"]
            Planner["🧠 Planner Agent\n(Mistral Large)"]
            Coder["💻 Coder Agent\n(Codestral)"]
            Reviewer["🔍 Reviewer Agent\n(Mistral Large)"]
        end
        
        MC["Mistral AI SDK"]
    end

    LP -->|"GitHub URL"| RepoAPI
    WP --> UIComponents
    UIComponents --> State
    State -->|"HTTP"| API
    State -->|"WebSocket"| WS
    
    RepoAPI --> RepoService
    PipeAPI --> SessionMgr
    PipeAPI --> Agents
    AIAPI --> MC
    
    Planner --> MC
    Coder --> MC
    Reviewer --> MC
    
    WS -->|"Live Updates"| PS

    style Client fill:#1a1a2e,stroke:#e94560,color:#fff
    style Server fill:#0f3460,stroke:#e94560,color:#fff
    style Agents fill:#16213e,stroke:#0f3460,color:#fff
```

---

## 🔄 Multi-Agent Pipeline Flow

The core innovation of RepoPilot is its **multi-agent pipeline** — three specialized AI agents working in sequence, each using the optimal Mistral model for its task:

```mermaid
sequenceDiagram
    actor User
    participant FE as 🖥️ Frontend
    participant API as ⚙️ FastAPI
    participant WS as 🔌 WebSocket
    participant P as 🧠 Planner<br/>(Mistral Large)
    participant C as 💻 Coder<br/>(Codestral)
    participant R as 🔍 Reviewer<br/>(Mistral Large)

    User->>FE: Enter GitHub URL
    FE->>API: POST /repo/clone
    API-->>FE: Repo structure + file tree

    User->>FE: Describe goal in natural language
    FE->>API: POST /pipeline/session
    API-->>FE: Session ID
    FE->>WS: Connect (session_id)

    rect rgb(30, 60, 90)
        Note over API,P: 📋 PLANNING PHASE
        FE->>API: POST /pipeline/{id}/plan
        API->>P: Analyze repo structure + goal
        P->>WS: 📡 analyzing... reading_files...
        WS-->>FE: Real-time progress updates
        P->>WS: 📡 building_context... ai_thinking...
        P-->>API: Structured Task Plan
        API-->>FE: Task plan (N tasks)
    end

    User->>FE: Click "Execute Plan"

    rect rgb(40, 80, 50)
        Note over API,C: ⚡ CODING PHASE
        loop For each task in plan
            API->>C: Generate code for task
            C->>WS: 📡 task_start → coding → task_complete
            WS-->>FE: Live streaming updates
            C-->>API: File changes + diffs
        end
    end

    rect rgb(80, 50, 30)
        Note over API,R: 🔍 REVIEW PHASE
        API->>R: Review all generated changes
        R->>WS: 📡 review_start
        R-->>API: Review report + score
        API-->>FE: Results + review
    end

    User->>FE: Click "Apply All Changes"
    FE->>API: POST /pipeline/{id}/apply
    API-->>FE: Changes committed ✅
```

---

## 🧠 Mistral AI Model Strategy

RepoPilot deliberately selects the **optimal Mistral model** for each task:

```mermaid
graph LR
    subgraph Planning["📋 Planning Phase"]
        ML1["🧠 Mistral Large"]
        ME["🔗 Mistral Embed"]
    end
    
    subgraph Coding["⚡ Coding Phase"]
        CS["💻 Codestral"]
    end
    
    subgraph Review["🔍 Review Phase"]
        ML2["🧠 Mistral Large"]
    end
    
    subgraph PostPipeline["💬 Post-Pipeline"]
        ML3["🧠 Mistral Large\n(Chat & Summary)"]
        CS2["💻 Codestral\n(Code Explanation)"]
    end

    ML1 -->|"Best at reasoning\n& task decomposition"| CS
    CS -->|"Specialized for\ncode generation"| ML2
    ML2 -->|"Best at quality\nassessment"| PostPipeline

    style Planning fill:#1e3a5f,stroke:#4a90d9,color:#fff
    style Coding fill:#2d5a3d,stroke:#5cb85c,color:#fff
    style Review fill:#5a3d2d,stroke:#d9944a,color:#fff
    style PostPipeline fill:#3d2d5a,stroke:#9b59b6,color:#fff
```

| Phase | Model | Why This Model? |
|-------|-------|-----------------|
| **Analysis & Planning** | Mistral Large | Superior reasoning for understanding complex codebases and creating structured task breakdowns |
| **Context Building** | Mistral Embed | Efficient embeddings for mapping repository structure |
| **Code Generation** | Codestral | Purpose-built for code — generates precise, multi-file edits with correct syntax |
| **Code Review** | Mistral Large | Strong analytical reasoning to catch bugs, security issues, and quality problems |
| **AI Chat** | Mistral Large | Conversational ability with deep code comprehension |
| **Code Explanation** | Codestral | Specialized understanding of code patterns and architecture |

---

## ✨ Key Features

### 🔄 Real-Time Streaming
Watch the AI work in real-time via WebSocket. See which task is being coded, which files are changing, and track progress live — no waiting for a black-box to finish.

### 💬 AI Chat with Codebase Context
After the pipeline runs, chat with Mistral Large about the generated changes. Ask questions, request explanations, or suggest improvements — all with full context of the codebase and changes.

### 📊 AI Summary Report
Generate a comprehensive report that explains what was built, why, and how. Perfect for documentation and stakeholder updates.

### 🔍 Code Explanation (Codestral)
Click "Explain" on any file to get an AI-powered breakdown of its structure, purpose, and key functions. Results are cached to save tokens.

### 🎨 Premium UI with Resizable Panels
- Drag-to-resize file explorer and right panel
- Glassmorphism design with smooth animations
- Pulsing Mistral model logos during AI operations
- Tab state persistence — switch tabs without losing data

### 💾 Smart State Management
- Explanation caching prevents redundant API calls
- Session storage persists repo state across refreshes
- Zustand stores for predictable state updates

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI Framework |
| **Build** | Vite 5 | Fast development & bundling |
| **State** | Zustand + sessionStorage | Global state management with persistence |
| **Icons** | Lucide React + Mistral Brand Icons | UI iconography |
| **Styling** | Custom CSS + Glassmorphism | Premium dark theme |
| **Backend** | FastAPI (Python 3.11+) | High-performance async API |
| **AI SDK** | Mistral AI Python SDK | Model integration |
| **Git** | GitPython | Repository operations |
| **Real-time** | WebSocket (FastAPI) | Live progress streaming |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Python** 3.11+
- **Mistral AI API Key** — Get one at [console.mistral.ai](https://console.mistral.ai)

### 1. Clone the Repository

```bash
git clone https://github.com/phanibhushan1911/RepoPilot.git
cd RepoPilot
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your MISTRAL_API_KEY

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Navigate to **http://localhost:5173** and start building! 🎉

---

## 📁 Project Structure

```
RepoPilot/
├── frontend/                          # React + Vite + TypeScript
│   ├── public/                        # Static assets & logos
│   ├── src/
│   │   ├── components/
│   │   │   ├── pipeline/              # AI pipeline UI
│   │   │   │   ├── ChatPanel.tsx      # 💬 AI chat interface
│   │   │   │   ├── DiffViewer.tsx     # 🔀 Code diff display
│   │   │   │   ├── ExecutionLog.tsx   # 📝 Real-time logs
│   │   │   │   ├── GoalInput.tsx      # 🎯 Goal entry + progress
│   │   │   │   ├── PlanView.tsx       # 📋 Task plan display
│   │   │   │   └── SummaryPanel.tsx   # 📊 AI summary report
│   │   │   ├── repo/
│   │   │   │   ├── CodeViewer.tsx     # 📄 Code viewer + AI explain
│   │   │   │   └── FileTree.tsx       # 📁 Interactive file tree
│   │   │   ├── review/
│   │   │   │   └── ReviewPanel.tsx    # 🔍 AI review display
│   │   │   ├── MistralIcon.tsx        # 🎨 Mistral model icons
│   │   │   └── ResizeHandle.tsx       # ↔️ Drag-to-resize panels
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx        # 🏠 Home page
│   │   │   └── WorkspacePage.tsx      # 🖥️ Main workspace
│   │   ├── services/
│   │   │   ├── api.ts                 # 🌐 REST API client
│   │   │   └── websocket.ts          # 🔌 WebSocket client
│   │   ├── stores/
│   │   │   ├── pipelineStore.ts       # Pipeline state + WS handlers
│   │   │   └── repoStore.ts          # Repo state (persisted)
│   │   └── types/index.ts            # TypeScript interfaces
│   └── ...
│
├── backend/                           # Python FastAPI
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── repo.py               # 📂 Repo clone & file endpoints
│   │   │   ├── pipeline.py           # 🔄 Pipeline orchestration
│   │   │   ├── ai.py                 # 🤖 AI chat, explain, summary
│   │   │   └── files.py              # 📄 File read endpoints
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── planner.py        # 🧠 Planner Agent
│   │   │   │   ├── coder.py          # 💻 Coder Agent
│   │   │   │   ├── reviewer.py       # 🔍 Reviewer Agent
│   │   │   │   ├── prompts.py        # 📝 System prompts
│   │   │   │   └── mistral_client.py # 🔑 Mistral SDK wrapper
│   │   │   ├── repo_service.py       # Git operations
│   │   │   ├── diff_service.py       # Diff generation
│   │   │   └── session_manager.py    # Session lifecycle
│   │   └── models/                   # Pydantic schemas
│   └── requirements.txt
│
└── README.md
```

---

## 🎥 How It Works

### Step 1: Import a Repository
Paste any public GitHub URL. RepoPilot clones it and builds a complete understanding of the project structure, languages, and file relationships.

### Step 2: Describe Your Goal
Write what you want in plain English:
> *"Add user authentication with JWT tokens, including login and registration endpoints"*

### Step 3: Watch the AI Work
The multi-agent pipeline kicks in:
- **Planner** (Mistral Large) breaks down the goal into actionable tasks
- **Coder** (Codestral) generates code changes for each task
- **Reviewer** (Mistral Large) scores and validates everything

All streamed live to your screen via WebSocket. ⚡

### Step 4: Review & Apply
Inspect the diff, read the AI review, generate a summary report, or chat with the AI about the changes. When satisfied, click **Apply** to commit everything.

---

## 🏆 Built for the Mistral AI Hackathon

RepoPilot demonstrates:
- **Multi-model orchestration** — Right model for each task (Large for reasoning, Codestral for code)
- **Agentic pipeline** — Autonomous plan → code → review workflow
- **Real-time streaming** — WebSocket-powered live progress
- **Full-stack integration** — Production-quality React + FastAPI application
- **Smart UX** — Caching, persistence, resizable panels, and premium design

---

## 📝 License

MIT — Built with ❤️ for the Mistral AI Hackathon by [Phani Bhushan](https://github.com/phanibhushan1911)
