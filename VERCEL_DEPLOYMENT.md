# 🚀 MentorBridge Vercel Deployment Guide

This guide details how to deploy **MentorBridge** to **Vercel** with a clean separation between the **Frontend** (Vite + React SPA) and the **Backend** (Express + Gemini AI Serverless API).

---

## 🏗️ Architecture Overview

| Component | Technology | Directory | Output / Entry | Vercel Runtime |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React 19, Vite 7, Tailwind, TanStack Query | `artifacts/mentorbridge` | `dist/public` | Vercel Static Edge CDN |
| **Backend** | Express 5, Gemini 2.0 AI, Zod, Drizzle | `artifacts/api-server` | `api/index.ts` / `dist/serverless.mjs` | Vercel Serverless Function (Node.js) |

---

## 🌟 Deploying Separately to Vercel (2 Distinct Projects)

To have completely decoupled frontend and backend deployments with separate URLs and logs, deploy them as **two projects** in your Vercel Dashboard.

---

### Step 1: Deploy the Backend API (`mentorbridge-backend`)

1. Go to your [Vercel Dashboard](https://vercel.com/new).
2. Click **Add New…** → **Project** and select your GitHub repository (`replit_02-main` or `mentorbridge`).
3. Configure the Project Settings:
   - **Project Name**: `mentorbridge-backend` (or your choice)
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (leave as root) or click edit and select `artifacts/api-server`
   - **Build & Development Settings**:
     - Build Command: `pnpm --filter @workspace/api-server run build`
     - Output Directory: (leave blank or default)
     - Install Command: `pnpm install`
4. **Environment Variables**:
   Add the following environment variables:
   - `GEMINI_API_KEY`: *(Required for backend-only Gemini AI matching, session prep, and roadmap coach)*
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Optional: your PostgreSQL / Supabase connection string)*
5. Click **Deploy**.
6. Once deployed, note down your Backend URL:
   `https://mentorbridge-backend.vercel.app`

#### Backend Verification Endpoints:
- `GET https://mentorbridge-backend.vercel.app/api/healthz` ➔ `{"status":"ok"}`
- `GET https://mentorbridge-backend.vercel.app/api/mentors` ➔ Array of 15 verified mentors
- `POST https://mentorbridge-backend.vercel.app/api/auth/login` ➔ Returns user session token
- `POST https://mentorbridge-backend.vercel.app/api/ai/match` ➔ Structured Gemini JSON recommendations

---

### Step 2: Deploy the Frontend (`mentorbridge-frontend`)

1. In the Vercel Dashboard, click **Add New…** → **Project** again.
2. Select the same repository.
3. Configure the Frontend Project Settings:
   - **Project Name**: `mentorbridge-frontend`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `artifacts/mentorbridge`
   - **Build & Development Settings**:
     - Build Command: `pnpm run build`
     - Output Directory: `dist/public`
     - Install Command: `pnpm install`
4. **Environment Variables**:
   Add your Backend URL:
   - `VITE_API_URL`: `https://mentorbridge-backend.vercel.app` *(use the exact URL from Step 1)*
5. Click **Deploy**.
6. Once deployed, visit your live Frontend:
   `https://mentorbridge-frontend.vercel.app`

---

## ⚡ Zero-CORS API Proxy Option (Frontend `vercel.json`)

If you prefer the frontend to proxy all `/api/*` calls directly to your backend domain without cross-origin requests, edit `artifacts/mentorbridge/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist/public",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://mentorbridge-backend.vercel.app/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

With this rewrite rule, the browser makes requests to `https://mentorbridge-frontend.vercel.app/api/*`, and Vercel edge infrastructure securely routes them to your backend!

---

## 💻 Deploying via Vercel CLI

If you use the Vercel CLI from your terminal:

### 1. Install & Authenticate Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 2. Deploy Backend
```bash
# In the repository root
vercel --prod -e GEMINI_API_KEY="your-gemini-key"
```

### 3. Deploy Frontend
```bash
cd artifacts/mentorbridge
vercel --prod -e VITE_API_URL="https://your-backend.vercel.app"
```

---

## 📦 Alternative: 1-Click Unified Monorepo Deployment

If you want both the frontend and backend deployed together under a single unified Vercel URL (e.g. `https://mentorbridge.vercel.app`):

1. Keep the root `vercel.json` located at the root of the repository.
2. Import the root repository in Vercel.
3. Set `GEMINI_API_KEY` in Project Settings.
4. Click **Deploy**.
5. Vercel will build the frontend to `artifacts/mentorbridge/dist/public` and serve all `/api/*` requests through the serverless function in `api/index.ts`.

---

## 🧪 Pre-Deployment Local Validation

You can verify that both frontend and backend build cleanly before deploying:

```bash
# 1. Typecheck the entire workspace
pnpm run typecheck

# 2. Build backend serverless & standalone bundle
pnpm --filter @workspace/api-server run build

# 3. Build frontend production bundle
pnpm --filter @workspace/mentorbridge run build
```

Both builds are verified and succeed with exit code `0`.
