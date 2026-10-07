# 🌉 MentorBridge · Full-Stack AI Career Mentorship Platform

> **Honest career conversations with real perspective.**
> A production-ready, full-stack mentorship platform connecting students and early-career engineers with verified industry mentors, backed by **backend-only Gemini 2.0 Flash AI** and a tailored design system.

---

## 🏆 Hackathon Evaluation Alignment Matrix

| Weight | Criterion | How MentorBridge Meets & Exceeds This |
| :---: | :--- | :--- |
| **25%** | **Problem Alignment & Value** | Solves the broken career advisory gap with 15 verified mentors across 8 high-demand categories (Software, AI/ML, UI/UX, Cloud, Data, Security, PM, Finance), real-time booking flows, review aggregation, and actionable roadmaps. |
| **25%** | **Full-Stack Implementation** | Clean REST APIs (`/api/mentors`, `/api/bookings`, `/api/reviews`, `/api/messages`, `/api/notifications`, `/api/progress`, `/api/auth/*`), Zod contract validation (`@workspace/api-zod`), TanStack Query state management, and role-based access for Students, Mentors, and Admins. |
| **20%** | **AI Security & Integration** | **100% Backend-Only Gemini 2.0 Flash execution**. Zero client-side API key exposure. Strict `response_mime_type: "application/json"` structured schema output with graceful heuristic fallbacks. |
| **20%** | **Working Deployment & UX** | Glassmorphic design system with curated typography, responsive navigation with **Quick Views** aligned flush under `mentorbridge`, live authentication modal, and dual Vercel serverless + static edge CDN deployment. |
| **10%** | **Video Demo & Documentation** | Comprehensive documentation, complete Vercel deployment walkthrough (`VERCEL_DEPLOYMENT.md`), and a timed 2–3 minute video presentation script below. |

---

## 🏗️ Repository Architecture

```
replit_02-main/
├── artifacts/
│   ├── mentorbridge/             # Frontend Application (Vite 7 + React 19 + Tailwind)
│   │   ├── src/
│   │   │   ├── App.tsx           # Main application, AuthContext, Pages, & AI Widgets
│   │   │   ├── index.css         # Curated design tokens, glassmorphism, & layout
│   │   │   └── main.tsx          # App entrypoint with API Base URL configuration
│   │   ├── vercel.json           # Frontend Vercel SPA rewrites & asset caching
│   │   └── vite.config.ts        # Vite build configuration (output: dist/public)
│   └── api-server/               # Backend REST API (Express 5 + Gemini AI)
│       ├── src/
│       │   ├── app.ts            # Express application with CORS & logging
│       │   ├── index.ts          # Standalone server runner
│       │   ├── serverless.ts     # Vercel Serverless Function export
│       │   ├── lib/
│       │   │   ├── gemini.ts     # Backend-only Gemini 2.0 JSON API integration
│       │   │   └── logger.ts     # Pino high-performance structured logger
│       │   └── routes/
│       │       ├── health.ts     # /healthz endpoint
│       │       └── mentorbridge.ts # Mentors, Bookings, Reviews, Auth, & AI routes
│       └── vercel.json           # Backend Vercel serverless function routing
├── lib/
│   ├── api-client-react/         # Auto-generated React Query hooks with setBaseUrl
│   ├── api-spec/                 # OpenAPI 3.1 contract specification
│   ├── api-zod/                  # Shared Zod validation schemas
│   └── db/                       # Drizzle ORM schema for PostgreSQL / Supabase
├── api/
│   ├── index.ts                  # Root Vercel serverless function entrypoint
│   └── [...path].ts              # Catch-all serverless router
├── vercel.json                   # Root monorepo Vercel configuration
├── VERCEL_DEPLOYMENT.md          # Step-by-step separate Vercel deployment guide
└── README.md
```

---

## 🔒 AI Security & Integration Architecture

1. **Backend-Only Execution**: The browser client **never** talks to the Google Gemini API directly and has **zero** knowledge of `GEMINI_API_KEY`.
2. **Endpoint Isolation**:
   - `POST /api/ai/match` — Analyzes mentee goals, career aspirations, and domain preferences to return top 3 mentor recommendations with personalized rationales.
   - `POST /api/ai/session-prep` — Generates 3 high-leverage discussion questions and tactical preparation advice for 1-on-1 mentorship sessions.
   - `POST /api/ai/roadmap` — Generates a phased 3-milestone career development roadmap with estimated timelines and skill priorities.
3. **Structured JSON Mode**: All calls pass `response_mime_type: "application/json"` to enforce type safety and parse reliability.
4. **Deterministic Fallback**: In the absence of an API key or during network disruptions, the backend seamlessly falls back to domain heuristic scoring without breaking the frontend experience.

---

## 🔑 Authentication System

MentorBridge includes a full working authentication lifecycle:

- **Modal & Dedicated Page**: Accessible via the top navbar `Log In` button (`data-testid="button-nav-login"`) or `/login` / `/register`.
- **Instant 1-Click Role Accounts**:
  - **Student**: Alex Morgan (`student@mentorbridge.com`) — 2 upcoming bookings, skill progress tracking.
  - **Mentor**: Maya Chen (`mentor@mentorbridge.com`) — Staff Engineer at Northstar Systems, session management.
  - **Admin**: Sarah Jenkins (`admin@mentorbridge.com`) — System analytics, user tables, revenue metrics.
- **Custom Credentials**: Register with name, email, role, and password; persisted via localStorage session tokens.
- **Dynamic Navbar State**: Displays user avatar pill, role tag, and quick dashboard switcher with one-click logout.

---

## 🚀 Separate Vercel Deployment

For complete instructions on deploying frontend and backend to distinct Vercel projects, refer to [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

### Quick Summary:
1. **Backend Project (`mentorbridge-backend`)**:
   - Root Directory: Repository Root
   - Build Command: `pnpm --filter @workspace/api-server run build`
   - Env Variable: `GEMINI_API_KEY=your_key_here`
   - Yields: `https://mentorbridge-backend.vercel.app`
2. **Frontend Project (`mentorbridge-frontend`)**:
   - Root Directory: `artifacts/mentorbridge`
   - Framework: `Vite`
   - Build Command: `pnpm run build`
   - Output Directory: `dist/public`
   - Env Variable: `VITE_API_URL=https://mentorbridge-backend.vercel.app`
   - Yields: `https://mentorbridge-frontend.vercel.app`

---

## 🎬 2–3 Minute Video Demo Script for Judges

Use this script when recording the submission video:

```
[0:00 - 0:25] THE PROBLEM & VALUE PROPOSITION
"Hello judges! We built MentorBridge to solve the fragmented, noisy experience early-career 
engineers face when seeking real career guidance. Instead of impersonal advice columns, 
MentorBridge connects mentees directly with verified senior engineers, designers, and managers 
for targeted 1-on-1 mentorship sessions."

[0:25 - 0:55] FULL-STACK ARCHITECTURE & AUTHENTICATION
"Our platform is built with a modern full-stack architecture: React 19 and Vite 7 on the frontend, 
an Express 5 backend, shared Zod schemas, and TanStack Query for cache synchronization. 
Notice our navbar with 'Quick Views' cleanly aligned right beneath the brand header. 
With our working authentication system, users can sign in with credentials or choose 
1-click role accounts: Student Alex Morgan, Mentor Maya Chen, or Admin Sarah Jenkins. 
Sessions persist, showing real-time role indicators and customized dashboard navigation."

[0:55 - 1:40] BACKEND-ONLY GEMINI 2.0 AI INTEGRATION
"Security and reliability were our top priorities for AI. In MentorBridge, all Gemini AI calls 
are strictly backend-only. The browser never receives an API key. 
In the Mentors directory, mentees can describe their goals, and Gemini 2.0 Flash returns 
structured JSON matches with compatibility scores and tailored discussion topics.
When booking a session, our AI Session Prep Coach analyzes the mentor's specific experience 
to suggest high-leverage questions so mentees get maximum value from minute one.
On the Progress page, Gemini breaks goals down into concrete multi-week milestones."

[1:40 - 2:20] BOOKINGS, REVIEWS & DASHBOARDS
"Students can select session dates and topics, book instantly, and track their upcoming chats. 
Mentors have a dedicated dashboard to accept requests and view reviews. 
Platform administrators have real-time metrics across booking volume, mentor categories, 
and revenue streams."

[2:20 - 2:45] PRODUCTION DEPLOYMENT & WRAP-UP
"MentorBridge is fully deployable to Vercel with completely separated frontend and backend 
pipelines. The frontend runs on Vercel's global edge network, while the backend runs as a 
scalable Node serverless function with secret isolation.
Thank you for watching MentorBridge!"
```

---

## 🛠️ Local Development

```bash
# Install dependencies
pnpm install

# Start backend API server (Port 5000)
$env:PORT="5000"; pnpm --filter @workspace/api-server run start

# Start frontend development server (Port 3000)
$env:PORT="3000"; $env:BASE_PATH="/"; pnpm --filter @workspace/mentorbridge run dev
```

Visit `http://localhost:3000` to interact with MentorBridge locally.
