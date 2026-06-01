# Viswam-LMS-Frontend

React + Vite portal for **VISWAM LMS**.

**Git remote:** https://github.com/Akhilesh2006s/Viswam-LMS-Frontend  
**Production:** https://viswam-lms-frontend.vercel.app

## Setup

```bash
npm install
cp .env.example .env   # if present
npm run dev
```

## Push changes (this folder is its own repo)

```bash
cd client
git add .
git commit -m "Your message"
git push origin main
```

## Environment

- **Local dev:** `VITE_API_URL=http://206.189.179.75:5000` (or `http://localhost:5000`)
- **Vercel production:** API uses same-origin `/api` (see `vercel.json` → DigitalOcean). Do **not** set `VITE_API_URL_PROD` to `http://...` on Vercel.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
