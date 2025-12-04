# Deployment Setup Guide

## What You Need Before Testing

### 1. Environment Variables

Update `.env.local` with your credentials:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agent-builder

# Cloudflare Workers Deployment (REQUIRED for agent deployment)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Anthropic API Key (REQUIRED for LLM)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Agent Base URL (optional, fallback if deployment fails)
AGENT_BASE_URL=https://agent.nullshot.io
```

### 2. Get Cloudflare Credentials

1. **Account ID**:
   - Go to https://dash.cloudflare.com/
   - Click on your domain or any Workers project
   - Account ID is in the right sidebar

2. **API Token**:
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Or create custom token with:
     - Permissions: `Account:Cloudflare Workers:Edit`
     - Account Resources: `Include All accounts`
   - Copy the token (you won't see it again!)

### 3. Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 4. MongoDB Setup

**Option A: MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string from "Connect" → "Connect your application"
4. Replace `<password>` with your database password

**Option B: Local MongoDB**
1. Install MongoDB locally
2. Use: `mongodb://localhost:27017/agent-builder`

## Testing Steps

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Test with Hello Module (Recommended First Test)

1. **Create Agent**:
   ```bash
   curl -X POST http://localhost:3000/api/agents \
     -H "Content-Type: application/json" \
     -d '{
       "walletAddress": "0x1234567890123456789012345678901234567890",
       "name": "Test Agent",
       "modules": [
         { "moduleName": "hello" }
       ],
       "apiKeys": {
         "llmKey": "sk-ant-your-key-here"
       }
     }'
   ```

2. **Deploy Agent** (replace `{agentId}` with ID from step 1):
   ```bash
   curl -X POST http://localhost:3000/api/agents/{agentId}/deploy \
     -H "Content-Type: application/json" \
     -d '{
       "walletAddress": "0x1234567890123456789012345678901234567890"
     }'
   ```

3. **Test Chat** (use the `agentChatURL` from deployment response):
   ```bash
   curl -X POST https://your-worker.workers.dev/agent/chat \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [
         {
           "role": "user",
           "content": "Say hello to John"
         }
       ]
     }'
   ```

### Step 3: Verify Deployment

Check Cloudflare Dashboard:
1. Go to https://dash.cloudflare.com/
2. Navigate to "Workers & Pages"
3. You should see your deployed agent worker
4. Check logs for any errors

## Troubleshooting

### Deployment Fails

**Error: "Cloudflare account ID and API token are required"**
- Check `.env.local` has `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`
- Restart dev server after adding env variables

**Error: "Failed to upload worker script"**
- Verify API token has correct permissions
- Check account ID is correct
- Ensure token hasn't expired

**Error: "Failed to set ANTHROPIC_API_KEY secret"**
- This is a warning, not critical
- Agent will still deploy but may not work without LLM key
- Verify `ANTHROPIC_API_KEY` is set in environment

### Agent Not Responding

**Check Worker Logs**:
```bash
# If you have Wrangler installed
npx wrangler tail
```

**Verify Agent URL**:
- Check the `agentChatURL` in deployment response
- Test with curl to see if worker is accessible
- Check Cloudflare dashboard for worker status

### MongoDB Connection Issues

**Error: "MongoDB connection failed"**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for testing)
- Ensure database user has read/write permissions

## Quick Test Checklist

- [ ] MongoDB connection string set in `.env.local`
- [ ] Cloudflare Account ID set
- [ ] Cloudflare API Token created and set
- [ ] Anthropic API Key set
- [ ] Dev server running (`npm run dev`)
- [ ] Created test agent with `hello` module
- [ ] Deployed agent successfully
- [ ] Got `agentChatURL` from deployment
- [ ] Tested chat endpoint with curl

## Next Steps After Testing

Once hello module works:
1. Test with other modules (tokenFactory, nftFactory, etc.)
2. Implement actual module execution endpoints
3. Add error handling and retry logic
4. Set up production deployment pipeline
5. Add monitoring and logging

## Notes

- **Hello Module**: Simple test module that just returns a greeting. Perfect for testing deployment without needing blockchain interactions.
- **Module Execution**: Other modules need API endpoints to execute. For now, they'll return placeholder responses.
- **Cloudflare Limits**: Free tier has limits. Check your usage in dashboard.
- **API Keys**: Never commit `.env.local` to git. It's already in `.gitignore`.

