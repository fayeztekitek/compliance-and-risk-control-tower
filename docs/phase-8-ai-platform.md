# Phase 8 — AI Platform

## Goal
Integrate LLM capabilities into the Control Tower platform, transforming the AI Assistant from a mock placeholder into a functional GRC Copilot powered by Google Gemini.

## Changes

### Backend

#### 1. AI LLM Service (`backend/src/services/ai/llm.service.ts`)
- Unified LLM gateway wrapping `@google/genai` SDK (Google Gemini)
- **GRC-specific system prompt** covering compliance, risk, security, audit, VEG governance, committees, roadmaps, SaaS domains
- **Mock fallback** when no `GEMINI_API_KEY` configured — generates contextual responses per domain
- Supports streaming `asyncIterator` for SSE delivery
- `listModels()` — returns available models (or mock when no API key)

#### 2. AI Routes (`backend/src/routes/ai.routes.ts`)
- `POST /api/ai/chat` — Chat completion endpoint
  - Non-streaming: returns `{ data: { text } }`
  - Streaming: returns SSE (`text/event-stream`) when `Accept: text/event-stream` header set
  - Zod validation for messages array and temperature/maxOutputTokens
  - Protected by `authMiddleware`
- `GET /api/ai/models` — List available models (protected)

#### 3. Environment Config (`backend/src/config/env.ts`)
- Added `GEMINI_API_KEY` (default: `""` — triggers mock fallback)
- Added `GEMINI_MODEL` (default: `"gemini-2.0-flash"`)

#### 4. Dependency (`backend/package.json`)
- Added `@google/genai: "^2.4.0"` (previously only in root package.json, not accessible to backend)

### Frontend

#### 5. AI API Client (`frontend/src/api/ai.api.ts`)
- `chat(messages, options?)` — Non-streaming chat via axios
- `chatStream(messages, options?, signal?)` — SSE streaming via `fetch()` with `ReadableStream` reader
- `listModels()` — Fetch available models

#### 6. AiHubPage (`frontend/src/pages/AiHubPage.tsx`)
- **Before**: Mock responses only (canned `setTimeout` text)
- **After**: Real API integration with streaming response
  - Sends user messages to `POST /api/ai/chat` with `Accept: text/event-stream`
  - Parses SSE `data:` lines and appends chunks to the assistant message in real time
  - Shows loading spinner during response
  - Error handling with user-friendly message
  - AbortController support for request cancellation
  - Mock fallback still works when backend unavailable (via service fallback)

## Architecture

```
Frontend (AiHubPage)                Backend (Express)
       │                                 │
       │  POST /api/ai/chat              │
       │  Accept: text/event-stream      │
       │────────────────────────────────>│
       │                                 ├─ authMiddleware (JWT)
       │                                 ├─ zod validation
       │                                 ├─ llmService.chat()
       │                                 │   ├─ @google/genai SDK
       │                                 │   └─ mock fallback
       │  SSE: data: {"text":"..."}      │
       │<────────────────────────────────│
       │  SSE: data: [DONE]              │
       │<────────────────────────────────│
```

## Configuration

Set in `.env` at project root:
```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash
```

Without `GEMINI_API_KEY`, the system falls back to mock responses covering compliance, risk, security, audit, and VEG domains.

## Next Steps
1. Implement **Prompt Library** (`/ai/prompts`) — saved reusable prompts per domain
2. Implement **AI Agents** — specialized agents (Compliance Scanner, Risk Analyzer, Policy Advisor) with tool-calling
3. Add **RAG pipeline** — embed compliance docs, policies, and past audit findings for context-aware responses
4. Add **function calling** — let the copilot query live API data (compliance scores, vulnerability counts, deal stats)
5. Implement **Copilot Widget** — floating assistant available from any page
