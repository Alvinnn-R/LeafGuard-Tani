---
trigger: always_on
---

# CLAUDE.md — LeafGuard Tani

---

## 1. Project Overview

- **Name**        : LeafGuard Tani
- **Description** : Autonomous AI agent (PWA) that helps Indonesian rice farmers detect plant diseases, interpret agricultural product labels, and receive actionable treatment recommendations — from a single smartphone photo.
- **Goal**        : Compress the gap between "seeing a symptom" and "taking the right action" from 3–7 days to under 5 minutes, using Gemini 1.5 Flash multimodal AI.
- **Target Users**: Rice farmers (*petani padi*) in East Java, Indonesia — basic smartphone literacy, limited field connectivity.
- **Version**     : v1.0.0
- **Status**      : Active development (Hackathon MVP — deadline 9 May 2026)

> Full spec: `.specify/specs/1-leafguard-tani-core/spec.md`
> Architecture: `.specify/specs/1-leafguard-tani-core/plan.md`
> Non-negotiable principles: `.specify/memory/constitution.md`

---

## 2. Tech Stack

### Backend
- **Language**   : Python 3.11
- **Framework**  : FastAPI
- **AI Engine**  : Gemini 1.5 Flash via `google-generativeai` SDK
- **Storage**    : Firebase Admin SDK (Firebase Storage)
- **Deployment** : Google Cloud Run (min-instances=1)
- **Package Mgr**: pip + requirements.txt

### Frontend
- **Language**   : JavaScript (React)
- **Framework**  : React 18 + Vite
- **Styling**    : Tailwind CSS (utility-first, mobile-first)
- **PWA**        : vite-plugin-pwa (manifest + Workbox service worker)
- **Data Fetch** : fetch API (native, no axios)
- **Image Util** : browser-image-compression
- **Deployment** : Firebase Hosting
- **Package Mgr**: npm

### Infrastructure
- **Storage**    : Firebase Storage (session-scoped UUID paths)
- **CDN/Hosting**: Firebase Hosting (frontend)
- **Compute**    : Google Cloud Run (backend)
- **Secrets**    : Cloud Run environment variables (never in frontend bundle)

---

## 3. Commands

```bash
# === BACKEND ===
cd backend

# Development
uvicorn main:app --reload --port 8000

# Install dependencies
pip install -r requirements.txt

# Deploy to Cloud Run
gcloud run deploy leafguard-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances=1

# === FRONTEND ===
cd frontend

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase Hosting
firebase deploy --only hosting

# PWA audit
npx lighthouse http://localhost:4173 --view
```

> **Never use yarn or pnpm** — always use `npm` for frontend, `pip` for backend.

---

## 4. Project Structure

**Architecture**: Feature-based, separated frontend/backend monorepo

```
LeafGuard-Tani/
├── CLAUDE.md                        # This file — read first
├── README.md
│
├── backend/                         # Python FastAPI service
│   ├── main.py                      # App entry point, CORS, router registration
│   ├── routers/
│   │   └── analyze.py               # POST /analyze, GET /health
│   ├── services/
│   │   ├── gemini.py                # Gemini API wrapper (multimodal calls)
│   │   └── storage.py               # Firebase Storage async upload
│   ├── models/
│   │   └── schemas.py               # All Pydantic request/response models
│   ├── prompts/
│   │   └── system.py                # Gemini system prompts (plant, label, both)
│   ├── utils/
│   │   └── image.py                 # Image validation (MIME type, size)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                        # React + Vite PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.jsx       # Camera capture + gallery, client-side compress
│   │   │   ├── AnalysisResult.jsx   # Plant diagnosis card
│   │   │   ├── LabelResult.jsx      # OCR label interpretation card
│   │   │   ├── RecommendationCard.jsx # Integrated treatment recommendation
│   │   │   ├── SummaryCard.jsx      # Shareable summary (Web Share API)
│   │   │   ├── LoadingState.jsx     # Animated loading with Indonesian messages
│   │   │   └── ErrorState.jsx       # Error display with retry action
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing + mode selection (3 modes)
│   │   │   ├── Analysis.jsx         # Upload → process → result flow
│   │   │   └── History.jsx          # Past analyses from localStorage
│   │   ├── services/
│   │   │   ├── api.js               # fetch wrapper → POST /analyze
│   │   │   └── storage.js           # localStorage read/write for history
│   │   ├── hooks/
│   │   │   └── useAnalysis.js       # { status, result, error }, runAnalysis()
│   │   └── App.jsx                  # React Router setup + bottom nav
│   ├── public/
│   │   └── manifest.json            # PWA manifest
│   ├── vite.config.js               # Vite + vite-plugin-pwa config
│   ├── tailwind.config.js
│   └── package.json
│
├── .specify/                        # Spec-kit artifacts (AI-readable docs)
│   ├── memory/
│   │   └── constitution.md          # Non-negotiable project principles
│   └── specs/1-leafguard-tani-core/
│       ├── spec.md                  # Feature spec + user stories
│       ├── plan.md                  # Architecture + phases
│       ├── data-model.md            # All entity schemas
│       ├── api-contracts.md         # Full API contract with examples
│       ├── prompts.md               # Gemini prompt templates
│       ├── tasks.md                 # T001–T038 implementation checklist
│       └── checklists/
│           └── requirements.md      # Spec quality checklist
│
└── .agents/
    └── workflows/                   # Antigravity workflow files
```

**File placement rules:**
- New UI components → `frontend/src/components/`
- New pages → `frontend/src/pages/`
- Business logic / AI calls → `backend/services/`
- Pydantic models → `backend/models/schemas.py`
- Gemini prompts → `backend/prompts/system.py` only
- **Do not create new folders without confirmation**

---

## 5. Naming Conventions

```
# Backend (Python)
- Files/modules    : snake_case       e.g. gemini.py, analyze.py
- Classes          : PascalCase       e.g. DiagnosisResult, LabelInfo
- Functions        : snake_case       e.g. analyze_image(), validate_image()
- Constants        : UPPER_SNAKE      e.g. GEMINI_MODEL, MAX_IMAGE_SIZE
- Pydantic models  : PascalCase       e.g. AnalysisRequest, ApiResponse

# Frontend (JavaScript/React)
- Components       : PascalCase       e.g. UploadZone.jsx, LabelResult.jsx
- Non-components   : camelCase        e.g. useAnalysis.js, api.js
- Folders          : kebab-case       e.g. (already set)
- CSS classes      : kebab-case via Tailwind utilities only

# Git Branches
- Feature          : feat/[name]      e.g. feat/summary-card-share
- Bug fix          : fix/[name]       e.g. fix/ocr-parse-error
- Prompt tweak     : prompt/[name]    e.g. prompt/blast-daun-fewshot
```

---

## 6. Code Conventions

```
# General
- DRY: extract to function if used more than once
- Readable over clever — no one-liner hacks
- All user-facing strings in Bahasa Indonesia (no English in UI)

# Backend (Python)
- Use async/await for all I/O (Gemini calls, Firebase uploads)
- Always use Pydantic models for request/response validation
- Never catch bare Exception — catch specific exceptions
- Firebase Storage upload MUST be fire-and-forget (never block response)

# Frontend (JavaScript)
- No TypeScript — plain JavaScript with JSDoc comments where needed
- Use native fetch API, not axios
- No useEffect for data fetching — use custom hook useAnalysis
- Compress images client-side BEFORE sending to backend
  (target: ≤ 1MB using browser-image-compression)

# Import Order (Frontend)
1. React and React ecosystem
2. Third-party libraries
3. Internal components (./components/...)
4. Internal hooks/services (./hooks/..., ./services/...)
5. Assets

# Error Handling
- Every async function must have try-catch
- Map all backend errors to user-friendly Indonesian messages
- retryable: true errors → show retry button
- retryable: false errors → show upload-again guidance
```

---

## 7. Component Rules

```
# Component file structure order:
1. Imports
2. Component function
3. useState / custom hooks
4. Handler functions
5. Return JSX
6. Export default

# Props rules
- Always destructure props in function signature
- No prop drilling beyond 2 levels — lift to useAnalysis hook

# Conditional rendering
- Use mode to conditionally render: diagnosis card, label card, or both
- LoadingState and ErrorState are always full-screen overlays

# Touch targets
- All buttons and interactive elements: minimum 44×44px
- Use Tailwind: min-h-[44px] min-w-[44px] on all clickable elements

# Mobile-first breakpoints
- Default styles = mobile (360px)
- md: = tablet (768px) — secondary
- Never lg: or xl: in new components (desktop not priority)
```

---

## 8. Styling Rules

```
# Approach
- Tailwind CSS utility classes only — no inline styles, no CSS files
- Exception: CSS variables for brand colors (defined in index.css)
- Never use !important

# Brand Colors (use these CSS variables, not hardcoded hex)
--color-primary    : #1a6b3c  (hijau tani — primary actions)
--color-primary-lt : #e8f5ee  (hijau muda — card backgrounds)
--color-urgent-red : #dc2626  (merah — IMMEDIATE urgency)
--color-urgent-org : #ea580c  (oranye — WITHIN_3_DAYS urgency)
--color-safe-grn   : #16a34a  (hijau — MONITOR / healthy)
--color-warning    : #fef3c7  (kuning muda — safety warnings background)

# Urgency color mapping (ALWAYS use all three indicators: color + icon + text)
IMMEDIATE     → text-red-600    bg-red-50    icon: AlertTriangle
WITHIN_3_DAYS → text-orange-600 bg-orange-50 icon: Clock
MONITOR       → text-green-600  bg-green-50  icon: Eye

# Confidence badge colors
HIGH   → bg-green-100  text-green-800
MEDIUM → bg-yellow-100 text-yellow-800
LOW    → bg-red-100    text-red-800

# Tailwind class order convention
layout (flex/grid) → spacing (p/m) → sizing (w/h) → color → typography → state (hover/focus)
```

---

## 9. API & Data Rules

```
# Single endpoint: POST /analyze
- mode: "plant" | "label" | "both"
- plant_image: File (required if mode = plant or both)
- label_image: File (required if mode = label or both)

# Always use this response structure (see api-contracts.md for full examples):
{ success: boolean, data: AnalysisResult | null, error: ApiError | null }

# Frontend api.js usage:
const result = await analyze({ mode, plantImage, labelImage })
// throws ApiError on failure — catch in useAnalysis hook

# localStorage schema (history — US5):
key   : "leafguard_history"
value : AnalysisSession[] (max 50 items, FIFO eviction)

# Never store:
- Gemini API key anywhere in frontend
- User PII in localStorage or anywhere
- Firebase credentials in frontend bundle
  (use Firebase client SDK config only — not service account)
```

---

## 10. Gemini Prompt Rules

```
# CRITICAL — never modify prompts without reading prompts.md first
# Location: backend/prompts/system.py

# Gemini config (non-negotiable):
model       : "gemini-1.5-flash"
temperature : 0.1   ← keep low for deterministic diagnosis output
response_mime_type: "application/json"  ← force JSON, no markdown wrapper

# Output validation pipeline (always in this order):
1. Check HTTP status from Gemini API
2. Parse JSON — if fails → AI_ERROR
3. Check if response contains "error" field → INVALID_IMAGE
4. Validate against Pydantic schema → if fails → AI_ERROR

# The disclaimer string is HARDCODED — never let AI generate it:
"Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan."
```

---

## 11. Performance Rules

```
# Image handling
- Compress client-side to ≤ 1MB before upload (browser-image-compression)
- Reject files > 10MB at frontend before any network call
- Accept JPEG and PNG only

# Backend
- Cloud Run: --min-instances=1 to avoid cold start on demo day
- Firebase Storage upload: always async (asyncio.create_task), never await in response path
- Target: POST /analyze responds in ≤ 5 seconds on 4G

# Frontend
- Lighthouse PWA score target: ≥ 70
- No blocking renders — show LoadingState immediately on submit
- Lazy load History page (not in initial bundle)
```

---

## 12. Git Rules

Commit after every completed task from tasks.md. Mark task as [x] before committing.

```
# Commit message format:
feat     : add [component/feature name]
fix      : resolve [specific bug]
prompt   : update [mode] system prompt for [reason]
deploy   : configure [cloud run / firebase hosting]
docs     : update [file name]
chore    : [dependency install / config change]

# Examples:
feat: add UploadZone component with client-side compression
fix: resolve Firebase Storage blocking analyze response
prompt: add Tungro few-shot examples to plant system prompt
deploy: set Cloud Run min-instances to 1

# Rules:
- Never commit .env or any file with secrets
- One task = one commit (reference task ID in message when possible)
  e.g. "feat: implement POST /analyze endpoint (T017)"
- Never push directly to main — use feature branch
```

---

## 13. Features

```
# Completed
- (none yet — starting today 2 May 2026)

# In Progress
- [ ] T001–T011  Phase 1: Setup & Infrastructure
- [ ] T012–T021  Phase 2: Backend Core (FastAPI + Gemini)
- [ ] T022–T034  Phase 3: Frontend Core (React PWA)

# Planned
- [ ] T035–T038  Phase 4: Integration, QA & Deploy
- [ ] US4        SummaryCard with Web Share API
- [ ] US5        Analysis history (localStorage)
```

---

## 14. Testing

```
# Approach: Manual testing (hackathon scope — no automated tests in MVP)

# Backend — test via Postman
- GET /health → { status: "ok" }
- POST /analyze mode=plant   → valid plant photo, blurry photo, non-plant photo
- POST /analyze mode=label   → 5 different product labels
- POST /analyze mode=both    → plant + matching label, plant + non-matching label

# Frontend — test on real devices
- Chrome Android (primary)
- Safari iOS (secondary)
- Chrome desktop (secondary)
- Screen sizes: 360px, 390px, 428px

# PWA checklist (run before submission):
- Lighthouse PWA audit ≥ 70
- App installable from Chrome Android
- Manifest icons all sizes present
- HTTPS enforced (Firebase Hosting handles this)

# Demo scenario test photos (prepare before 9 May):
1. Wereng Cokelat — clear colony photo at stem base
2. Label PaddyShield 300SC — clear full label
3. Both mode — Wereng + PaddyShield combined
```

---

## 15. Do Not

> If any instruction is ambiguous — **ASK FIRST, don't assume.**

```
# Structure
- Never create new folders without confirmation
- Never delete or move existing files without confirmation
- Never change the .specify/ folder structure

# Code
- Never hardcode GEMINI_API_KEY or Firebase credentials in any source file
- Never expose Gemini API key to frontend — all AI calls go through backend
- Never use await for Firebase Storage upload — it must be fire-and-forget
- Never install new npm packages without confirmation
- Never change the Gemini system prompts without reading prompts.md first
- Never remove or shorten the disclaimer string from diagnosis output

# UI & Language
- Never use English text in any user-facing UI element
- Never use color as the sole indicator of urgency (always add icon + text)
- Never design for desktop first — always 360px mobile first

# Data & Privacy
- Never collect or store user PII (name, phone, location)
- Never store photos permanently without explicit user consent
- Never commit any .env file

# Database / Storage
- Never use Firestore in MVP (localStorage only for history)
- Never use synchronous Firebase Storage calls in response path
```

---

## 16. Environment Variables

```bash
# Copy .env.example to .env before running locally
# NEVER commit .env to repository

# === BACKEND (.env) ===

# Required — server only, never expose to frontend
GEMINI_API_KEY=                    # Google AI Studio API key
FIREBASE_STORAGE_BUCKET=          # e.g. leafguard-tani.appspot.com
GOOGLE_APPLICATION_CREDENTIALS=   # Path to Firebase service account JSON

# Optional
PORT=8080                          # Cloud Run default port
ENVIRONMENT=development            # development | production

# === FRONTEND (.env) ===

# Public — safe to expose (Firebase client config, NOT service account)
VITE_API_URL=                      # Backend URL e.g. https://leafguard-api-xxx.run.app
VITE_FIREBASE_API_KEY=             # Firebase client API key (public)
VITE_FIREBASE_AUTH_DOMAIN=         # Firebase auth domain
VITE_FIREBASE_STORAGE_BUCKET=      # Firebase storage bucket
VITE_FIREBASE_PROJECT_ID=          # Firebase project ID
```

---

*Last updated: 2026-05-02 — Update this file as the project evolves.*
*For full technical details, see `.specify/specs/1-leafguard-tani-core/`*
