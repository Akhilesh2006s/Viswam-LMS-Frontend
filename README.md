# Viswam-LMS-Frontend

React + Vite student and admin portal for **VISWAM LMS**.

## Setup

```bash
npm install
cp .env.example .env   # if present; configure API URL
npm run dev
```

## Environment

Set `VITE_API_URL` (dev) and `VITE_API_URL_PROD` (production builds) in `.env` — e.g. `http://206.189.179.75:5000`. **Do not commit `.env`.**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
