# System Architecture

Complete architecture overview of the Agent Builder Platform.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User (Browser)                       │
│              Wallet Connect → Wallet Address            │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend (project/)                 │
│  - Agent Builder UI                                      │
│  - Agent List                                            │
│  - Chat Interface                                        │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Next.js Backend API (project/src/app/api)       │
│  - Agent CRUD                                            │
│  - Module Listing                                        │
│  - Deployment Job Creation                               │
└───────┬───────────────────────────────────┬─────────────┘
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│    MongoDB       │              │ Deployment Server│
│  - Agents        │◄─────────────┤   (server/)      │
│  - Jobs          │   Polls      │  - Polls Jobs    │
└──────────────────┘   Every 5s   │  - Deploys Agents│
                                  └────────┬──────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Cloudflare Workers│
                                  │  - NullShot Agents│
                                  │  - Tool Execution │
                                  └──────────────────┘
```

## 📁 Project Structure

```
/
├── project/                    # Next.js Frontend & Backend
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/          # Serverless API routes
│   │   │   └── ...           # Next.js pages
│   │   ├── lib/
│   │   │   ├── db/          # MongoDB models
│   │   │   └── storage/     # Data access
│   │   └── types/            # TypeScript types
│   └── ...
│
└── server/                    # Deployment Server
    ├── index.ts              # Main polling loop
    ├── services/
    │   ├── db.ts             # MongoDB operations
    │   ├── deploymentRunner.ts
    │   ├── nullshotAgent.ts  # NullShot integration
    │   ├── cloudflareDeployer.ts
    │   ├── codeGenerator.ts  # Agent code generation
    │   └── logger.ts
    ├── modules/              # Module definitions
    │   └── hello.ts         # Test module
    └── types/                # TypeScript types
```

## 🔄 Data Flow

### 1. Agent Creation Flow

```
User → Frontend → POST /api/agents
  → MongoDB (Agent collection)
  → Returns agent ID
```

### 2. Agent Deployment Flow

```
User → Frontend → POST /api/agents/[id]/deploy
  → Backend generates workflow
  → Creates deployment job (status: 'pending')
  → MongoDB (DeploymentJob collection)
  → Returns job ID
  
  [Async - Deployment Server]
  → Server polls MongoDB
  → Finds pending job
  → Updates status: 'deploying'
  → Generates NullShot agent code
  → Deploys to Cloudflare Workers
  → Updates status: 'deployed' + agentChatURL
```

### 3. Chat Flow

```
User → Frontend → Direct connection to agentChatURL
  → Cloudflare Workers (NullShot Agent)
  → Agent uses registered tools
  → Returns response
```

## 🗄️ Database Schema

### Agents Collection

```typescript
{
  _id: ObjectId,
  walletAddress: string,
  name: string,
  description?: string,
  tags?: string[],
  modules: Array<{
    moduleName: string,
    input?: object
  }>,
  status: 'draft' | 'deployed' | 'archived',
  apiKeys?: {
    llmKey?: string,
    cloudflareKey?: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### DeploymentJobs Collection

```typescript
{
  _id: ObjectId,
  jobId: string,
  userId: string,
  selectedModules: Array<{...}>,
  workflowJSON: object,
  status: 'pending' | 'deploying' | 'deployed' | 'failed',
  agentChatURL?: string,
  agentInstanceId?: string,
  workflowVersion?: string,
  deployedAt?: Date,
  errorMessage?: string,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Technology Stack

### Frontend/Backend (project/)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Deployment**: Vercel Serverless

### Deployment Server (server/)
- **Runtime**: Node.js (Long-running process)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Deployment**: Cloudflare Workers (via Wrangler)
- **Agent Framework**: NullShot

## 🔐 Security

- Wallet address validation
- User authorization (users can only access their agents)
- API keys stored securely
- Environment variables for secrets

## 📊 Module System

### Current Status

- **Modules Location**: Will be moved to `server/modules/`
- **Module Types**: Capabilities/tools, not pre-configured actions
- **Tool Registration**: Modules registered as tools in NullShot agent
- **Execution**: Tools executed during chat conversation

### Module Structure

```typescript
{
  name: string,
  description: string,
  inputSchema: JSONSchema,
  getToolDefinition: () => ToolDefinition
}
```

## 🚀 Deployment Architecture

### Agent Deployment Process

1. **Code Generation** → NullShot agent code with tools
2. **Cloudflare Upload** → Worker script uploaded
3. **Dependencies** → Installed via npm/pnpm
4. **Secrets** → ANTHROPIC_API_KEY set
5. **Publish** → Worker deployed and accessible

### Agent Runtime

- **Platform**: Cloudflare Workers (Edge)
- **Session Management**: Durable Objects
- **Tools**: Registered MCP tools
- **LLM**: Anthropic Claude

## 📈 Scalability

- **Frontend**: Serverless (auto-scales)
- **Backend API**: Serverless (auto-scales)
- **Deployment Server**: Single instance (can be scaled horizontally)
- **Agents**: Cloudflare Workers (global edge network)

## 🔄 Integration Points

1. **Frontend ↔ Backend**: REST API
2. **Backend ↔ Database**: MongoDB
3. **Backend ↔ Deployment Server**: MongoDB (shared database)
4. **Deployment Server ↔ Cloudflare**: Wrangler CLI / API
5. **Agents ↔ Tools**: Module execution API (to be implemented)

## 📝 Key Design Decisions

1. **Modules as Capabilities**: Not pre-configured, parameters from chat
2. **Async Deployment**: Jobs processed by separate server
3. **Direct Chat**: Agents accessible directly, no proxying
4. **Shared Database**: Both services use same MongoDB
5. **Separation of Concerns**: Frontend/backend separate from deployment

