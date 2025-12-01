# Test Deployment Flow

## Full End-to-End Test

### Step 1: Start Deployment Server

```bash
cd server
npm run dev
```

Server will:
- Connect to MongoDB
- Start polling every 5 seconds
- Process pending deployment jobs

### Step 2: Create Agent via Backend API

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "name": "Token Creator Agent",
    "description": "Agent for creating tokens",
    "modules": [
      { "moduleName": "tokenFactory" }
    ],
    "apiKeys": {
      "llmKey": "your-anthropic-key"
    }
  }'
```

Save the `id` from response.

### Step 3: Deploy Agent (Creates Job)

```bash
curl -X POST http://localhost:3000/api/agents/{AGENT_ID}/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890"
  }'
```

Response:
```json
{
  "success": true,
  "jobId": "job-...",
  "message": "Deployment job created. The deployment server will process it shortly.",
  "status": "pending"
}
```

### Step 4: Server Picks Up Job

The deployment server will:
1. Find the pending job (within 5 seconds)
2. Update status to "deploying"
3. Deploy to Cloudflare Workers
4. Update status to "deployed" with agentChatURL

### Step 5: Test Deployed Agent

```bash
curl -X POST https://YOUR-AGENT-URL.workers.dev/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Create a token named MyToken with symbol MTK, total supply 1000000, on Ethereum mainnet. Use my private key 0x... and RPC URL https://..."
      }
    ]
  }'
```

The agent will use the `tokenFactory_createToken` tool to create the token.

## Check Deployment Status

Query MongoDB:
```javascript
db.deploymentjobs.findOne({ jobId: "job-..." })
```

Or check the Agent document:
```javascript
db.agents.findOne({ _id: ObjectId("...") })
```

## Module Details

### TokenFactory Module
- **Tool**: `tokenFactory_createToken`
- **Required**: privateKey, rpcUrl, tokenName, tokenSymbol, totalSupply, network
- **Optional**: decimals, firstSendAddress, firstSendAmount

