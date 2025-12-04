# Migration Guide: Project Restructure

## Overview

The project has been restructured to separate the Next.js frontend/backend from the deployment server.

## New Structure

```
/Sumit-Dragdrop
├── /project          # Next.js frontend and backend (existing code)
│   ├── src/
│   ├── package.json
│   └── ...
├── /server           # Long-running deployment server (NEW)
│   ├── index.ts
│   ├── services/
│   ├── types/
│   └── package.json
└── ...
```

## What Changed

### 1. Deployment Server Created (`/server`)
- Long-running Node.js process
- Polls MongoDB every 5 seconds for pending deployment jobs
- Handles agent deployment using NullShot framework
- Separate from Next.js serverless functions

### 2. Next Steps (Manual)

**Option A: Keep current structure (recommended for now)**
- Current code stays in root
- Server is in `/server` folder
- Both can run independently

**Option B: Move to `/project` folder**
If you want to move existing code to `/project`:

```bash
# Create project folder
mkdir project

# Move Next.js files (keep server separate)
mv src project/
mv public project/
mv app project/  # if exists
mv package.json project/
mv tsconfig.json project/
mv next.config.ts project/
mv .env.local project/
# ... move other Next.js files

# Update paths in project files if needed
```

## How It Works Now

### Deployment Flow

1. **User clicks "Deploy"** in Next.js frontend
2. **Next.js API route** (`/api/agents/[id]/deploy`) creates a deployment job:
   ```typescript
   await DeploymentJobModel.create({
     jobId: generateJobId(),
     userId: walletAddress,
     selectedModules: agent.modules,
     workflowJSON: workflow,
     status: 'pending',
   });
   ```
3. **Deployment server** (running separately) picks up the job
4. **Server processes** the deployment and updates status
5. **Frontend polls** or user refreshes to see deployment status

### Running Both Services

**Terminal 1 - Next.js Frontend/Backend:**
```bash
npm run dev
```

**Terminal 2 - Deployment Server:**
```bash
cd server
npm install
npm run dev
```

## Update Deploy Route

The `/api/agents/[id]/deploy` route should be updated to create a deployment job instead of deploying directly. See the example in the server README.

## Database

Both services use the same MongoDB database:
- Next.js backend: Uses `Agent` collection
- Deployment server: Uses `DeploymentJob` collection

They can share the same `MONGODB_URI`.

## Benefits

- **Separation of Concerns**: Frontend/backend separate from deployment processing
- **Scalability**: Deployment server can be scaled independently
- **Reliability**: Deployment failures don't affect API
- **Monitoring**: Easier to monitor deployment server separately

