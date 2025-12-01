# Testing Guide - Hello Module Deployment

## Quick Test: Deploy Hello Agent

This guide walks you through deploying your first agent with the hello module.

## Prerequisites

1. **MongoDB** running and accessible
2. **Cloudflare credentials** set in environment
3. **Anthropic API key** set in environment
4. **Wrangler CLI** installed (or will use npx)

## Step 1: Start Deployment Server

```bash
cd server
npm install
npm run dev
```

You should see:
```
✅ Connected to MongoDB
✅ Deployment server started. Polling every 5 seconds
```

## Step 2: Create Deployment Job

From your Next.js backend or directly in MongoDB:

```javascript
// In MongoDB or via API
db.deploymentjobs.insertOne({
  jobId: `job-${Date.now()}`,
  userId: "0x1234567890123456789012345678901234567890",
  selectedModules: [
    { moduleName: "hello" }
  ],
  workflowJSON: {
    tools: [] // Will be loaded from module registry
  },
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

Or via Next.js API (if you update the deploy route):

```bash
curl -X POST http://localhost:3000/api/agents/{agentId}/deploy \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x1234..."}'
```

## Step 3: Watch Deployment

The server will:
1. Pick up the job (within 5 seconds)
2. Update status to "deploying"
3. Generate NullShot agent code
4. Deploy to Cloudflare Workers
5. Update status to "deployed" with agentChatURL

Watch the server logs:
```
[INFO] Found 1 pending job(s)
[INFO] Processing job job-123...
[INFO] Starting deployment for job job-123
[INFO] Loading tools for 1 modules...
[INFO] Deploying agent with 1 tools: hello_greet - A simple greeting tool...
[INFO] Deploying to Cloudflare Workers...
[INFO] Creating temporary deployment directory...
[INFO] Generating agent code...
[INFO] Installing dependencies...
[INFO] Deploying to Cloudflare Workers as: agent-job-123...
[INFO] Deployment successful! Agent URL: https://agent-job-123.workers.dev/agent/chat
[INFO] Deployment successful for job job-123
```

## Step 4: Test the Deployed Agent

```bash
curl -X POST https://agent-job-123.workers.dev/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'
```

Expected: Agent responds using the hello_greet tool.

## Step 5: Verify in MongoDB

Check the deployment job:

```javascript
db.deploymentjobs.findOne({ jobId: "job-123" })
```

Should show:
- `status: "deployed"`
- `agentChatURL: "https://agent-job-123.workers.dev/agent/chat"`
- `agentInstanceId: "agent-job-123-..."`
- `deployedAt: ISODate(...)`

## Troubleshooting

### Deployment Fails

**Error: "Module not found in registry"**
- Check `server/modules/hello.ts` exists
- Verify module is exported in `server/modules/index.ts`

**Error: "ANTHROPIC_API_KEY required"**
- Set `ANTHROPIC_API_KEY` in server `.env`

**Error: "CLOUDFLARE_ACCOUNT_ID required"**
- Set Cloudflare credentials in server `.env`

**Error: "Wrangler not found"**
- Install: `npm install -g wrangler`
- Or ensure npx works (it's used in code)

### Agent Not Responding

**Check Cloudflare Dashboard:**
- Go to Workers & Pages
- Find your worker
- Check logs: `npx wrangler tail --name agent-job-123`

**Verify Secrets:**
```bash
npx wrangler secret list --name agent-job-123
```

Should show `ANTHROPIC_API_KEY`.

## Next Steps

Once hello module works:
1. Add more modules to `server/modules/`
2. Test with multiple modules
3. Implement module execution API
4. Add real blockchain modules

