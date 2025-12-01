# Quick Start: Test Hello Module Deployment

This guide walks you through testing the hello module deployment end-to-end.

## Prerequisites

1. **MongoDB** - Database running and accessible
2. **Environment Variables** - See `ENV_SETUP.md` for details

## Step 1: Set Environment Variables

```bash
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database"
export ANTHROPIC_API_KEY="sk-ant-api03-..."
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"
```

Or create a `.env` file in `server/` directory (see `ENV_SETUP.md`).

## Step 2: Install Dependencies

```bash
cd server
npm install
```

## Step 3: Create Test Agent and Deployment Job

```bash
node test-deployment.js
```

This will:
- ✅ Create an Agent document in MongoDB
- ✅ Create a DeploymentJob document with status "pending"
- ✅ Use the "hello" module

Expected output:
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📝 Creating Agent document...
✅ Agent created: 507f1f77bcf86cd799439011
   Name: Hello Test Agent
   Wallet: 0x1234567890123456789012345678901234567890
   Modules: hello

📝 Creating Deployment Job...
✅ Deployment Job created: job-1234567890
   Status: pending
   Modules: hello

🎉 Success! Agent and deployment job created.
```

## Step 4: Start Deployment Server

In a new terminal:

```bash
cd server
npm run dev
```

You should see:
```
🚀 Starting Deployment Server...
✅ Database connected
✅ Deployment server started. Polling every 5 seconds
📊 Max concurrent deployments: 5
```

## Step 5: Watch Deployment

The server will automatically:
1. Pick up the pending job (within 5 seconds)
2. Update status to "deploying"
3. Generate NullShot agent code
4. Deploy to Cloudflare Workers
5. Update status to "deployed" with agentChatURL

Watch the logs:
```
[INFO] Found 1 pending job(s)
[INFO] Processing job job-1234567890 (1/5 active)
[INFO] Starting deployment runner for job job-1234567890
[INFO] Deploying agent for job job-1234567890
[INFO] Starting deployment for job job-1234567890
[INFO] Loading tools for 1 modules...
[INFO] Deploying agent with 1 tools: hello_greet - A simple greeting tool...
[INFO] Deploying to Cloudflare Workers...
[INFO] Creating temporary deployment directory...
[INFO] Generating agent code...
[INFO] Deployment successful! Agent URL: https://hello-test-agent-12345678.workers.dev/agent/chat
[INFO] Deployment successful for job job-1234567890
[INFO] Job job-1234567890 marked as deployed
```

## Step 6: Verify in MongoDB

Check the deployment job was updated:

```javascript
// In MongoDB shell or Compass
db.deploymentjobs.findOne({ jobId: "job-1234567890" })
```

Should show:
- `status: "deployed"`
- `agentChatURL: "https://hello-test-agent-12345678.workers.dev/agent/chat"`
- `agentInstanceId: "agent-..."`
- `deployedAt: ISODate(...)`

## Step 7: Test the Deployed Agent

```bash
curl -X POST https://hello-test-agent-12345678.workers.dev/agent/chat \
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

## Troubleshooting

### "MONGODB_URI environment variable is required"
- Set the environment variable before running the script
- Or create a `.env` file

### "Module not found in registry"
- Check `server/modules/hello.ts` exists
- Check `server/modules/index.ts` exports it

### "ANTHROPIC_API_KEY environment variable is required"
- Set the API key in environment
- Or pass it when starting the server

### "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN required"
- Set Cloudflare credentials
- Verify they're correct in Cloudflare dashboard

### Deployment fails
- Check Cloudflare logs: `npx wrangler tail --name hello-test-agent-12345678`
- Verify secrets are set: `npx wrangler secret list --name hello-test-agent-12345678`

## Next Steps

Once hello module works:
1. Add more modules to `server/modules/`
2. Test with multiple modules
3. Integrate with frontend
4. Add real blockchain modules

