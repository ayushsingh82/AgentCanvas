# Deployment Server

Long-running Node.js server for CI/CD style agent deployments using NullShot framework.

## 📋 Implementation Status

### ✅ Implemented

- [x] **Polling System** - Polls MongoDB every 5 seconds for pending jobs
- [x] **Status Management** - Updates job status (pending → deploying → deployed/failed)
- [x] **NullShot Code Generation** - Generates agent code following NullShot framework
- [x] **Cloudflare Deployment** - Deploys agents to Cloudflare Workers using Wrangler
- [x] **Tool Registration** - Registers modules as tools in agent
- [x] **Error Handling** - Comprehensive error handling with status updates
- [x] **Concurrent Processing** - Handles up to 5 deployments simultaneously
- [x] **Graceful Shutdown** - Waits for active deployments before stopping
- [x] **Logging System** - Structured logging with levels
- [x] **Database Integration** - MongoDB operations for deployment jobs
- [x] **Hello Module** - Test module for deployment testing

### ⚠️ Partially Implemented

- [x] **NullShot Integration** - Code generation complete, needs testing
- [x] **Tool Handlers** - Hello module works, others need API endpoints
- [x] **Module Registry** - Hello module created, ready for more modules
- [ ] **Module Execution** - Module execution API not yet implemented
- [ ] **Deployment Monitoring** - No real-time status updates to frontend

### ❌ Not Implemented

- [ ] **Additional Modules** - Only hello module exists, need tokenFactory, nftFactory, etc.
- [ ] **Tool Execution** - Actual module tool execution logic for blockchain operations
- [ ] **Deployment Retry** - Retry logic for failed deployments
- [ ] **Health Checks** - Health check endpoint for monitoring
- [ ] **Metrics** - Deployment metrics and analytics
- [ ] **Webhook Notifications** - Notify frontend on deployment completion

## 🏗️ Architecture

### Structure

```
server/
├── index.ts                 # Main polling loop
├── services/
│   ├── db.ts               # MongoDB operations
│   ├── deploymentRunner.ts # Orchestrates deployment
│   ├── nullshotAgent.ts    # NullShot agent deployment
│   ├── cloudflareDeployer.ts # Cloudflare Workers deployment
│   ├── codeGenerator.ts    # Generates NullShot agent code
│   └── logger.ts           # Logging utility
├── types/
│   └── deploymentJob.ts    # Type definitions
└── modules/                # Module definitions
    ├── hello.ts            # Hello test module (✅ Ready)
    └── index.ts            # Module registry
```

### Deployment Flow

1. **Poll MongoDB** → Find jobs with `status: 'pending'`
2. **Update Status** → Set to `'deploying'`
3. **Generate Code** → Create NullShot agent code with tools
4. **Deploy** → Upload to Cloudflare Workers via Wrangler
5. **Update Status** → Set to `'deployed'` with agentChatURL
6. **Cleanup** → Remove temporary files

### Module System

Modules are defined in `server/modules/` and registered as tools:
- Each module exports tool definition
- Tools are registered in generated agent code
- Agent can use tools during chat conversation

## 🔧 Setup

```bash
npm install
npm run dev
```

## 🔑 Environment Variables

```env
MONGODB_URI=mongodb+srv://...
ANTHROPIC_API_KEY=sk-ant-...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
LOG_LEVEL=INFO
```

## 📊 Deployment Job Schema

```typescript
{
  jobId: string;
  userId: string;
  selectedModules: Array<{ moduleName: string; input?: object }>;
  workflowJSON: { tools: Array<{ name, description, inputSchema }> };
  status: 'pending' | 'deploying' | 'deployed' | 'failed';
  agentChatURL?: string;
  agentInstanceId?: string;
  workflowVersion?: string;
  deployedAt?: Date;
  errorMessage?: string;
}
```

## 🧪 Testing

1. Create deployment job in MongoDB
2. Server picks it up automatically
3. Check logs for deployment progress
4. Verify agentChatURL in database

## 📝 Notes

- Runs continuously (not serverless)
- Requires Wrangler CLI (or uses npx)
- Creates temporary directories for deployment
- Cleans up after deployment
- Max 5 concurrent deployments

## 🔗 Integration

- **MongoDB**: Reads pending jobs, updates status
- **Cloudflare**: Deploys agents to Workers
- **NullShot**: Uses framework for agent creation
