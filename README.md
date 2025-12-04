# Agent Builder Platform

No-code agent builder platform with separate deployment server.

## Project Structure

```
/
├── project/          # Next.js frontend and backend
│   ├── src/          # Next.js app source
│   ├── public/       # Static assets
│   └── ...
├── server/           # Long-running deployment server
│   ├── index.ts      # Main polling loop
│   ├── services/     # Deployment services
│   └── ...
└── README.md         # This file
```

## Quick Start

### 1. Next.js Frontend/Backend (Project)

```bash
cd project
npm install
npm run dev
```

Runs on: http://localhost:3000

### 2. Deployment Server

```bash
cd server
npm install
npm run dev
```

Polls MongoDB every 5 seconds for pending deployment jobs.

## Environment Setup

### Project (.env.local)
```env
MONGODB_URI=mongodb+srv://...
AGENT_BASE_URL=https://agent.nullshot.io
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

### Server (.env)
```env
MONGODB_URI=mongodb+srv://...  # Same as project
AGENT_BASE_URL=https://agent.nullshot.io
LOG_LEVEL=INFO
```

## Architecture

- **Project**: Next.js 15 with serverless API routes
- **Server**: Long-running Node.js process for CI/CD deployments
- **Database**: Shared MongoDB instance

## Documentation

- `project/workflow.md` - Backend workflow and API documentation
- `project/DEPLOYMENT_SETUP.md` - Deployment setup guide
- `server/README.md` - Deployment server documentation
