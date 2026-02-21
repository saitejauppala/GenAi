# DevAI Pro - MERN AI Workspace

Full-stack MERN workspace with AI chat, project-based file generation, and ZIP export.

## Repository Structure

- `server` - Express + TypeScript API
- `client` - React + Vite frontend
- `render.yaml` - Render Blueprint for one-click deploy (API + static frontend)

## Local Development

1. Configure env files:
   - copy `server/.env.example` to `server/.env`
   - copy `client/.env.example` to `client/.env`
2. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`
3. Start backend:
   - `cd server && npm run dev`
4. Start frontend:
   - `cd client && npm run dev`

## Render Deployment (Recommended)

1. Push this repository to GitHub.
2. In Render, choose **New + -> Blueprint**.
3. Select this repo. Render reads `render.yaml` and creates:
   - `devai-pro-api` (Node web service)
   - `devai-pro-web` (static site)
4. Set required env vars in `devai-pro-api`:
   - `MONGO_URI`
   - `SUPER_ADMIN_EMAIL`
   - `SUPER_ADMIN_PASSWORD`
   - `OLLAMA_API_URL` (public URL ending with `/api/generate`)
5. Deploy both services.

The frontend API URL and backend CORS origin are auto-wired in `render.yaml` using `RENDER_EXTERNAL_URL`.

## Remote Ollama Setup

Start Ollama:

```bash
ollama run llama3
```

Expose port 11434:

```bash
ngrok http 11434
```

Set Render env var:

```text
OLLAMA_API_URL=https://<your-public-domain>/api/generate
```

## Deployment Notes

- Super admin is created automatically at backend startup from:
  - `SUPER_ADMIN_EMAIL`
  - `SUPER_ADMIN_PASSWORD`
- Generated project files are stored in `PROJECTS_ROOT_DIR`.
- Default production path is `/tmp/devai-projects` (ephemeral). Use a mounted disk path for persistence across redeploys.
