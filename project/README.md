# Agent Builder Platform - Next.js Frontend & Backend

Next.js 15 application with serverless API routes for the no-code agent builder platform.

## 📋 Implementation Status

### ✅ Implemented

- [x] **Wallet-based Authentication** - Uses wallet address as user identifier
- [x] **Agent CRUD Operations** - Create, read, update, delete agents
- [x] **MongoDB Integration** - Full database persistence with Mongoose
- [x] **API Routes** - All required endpoints implemented
- [x] **Agent Metadata** - Name, description, tags support
- [x] **API Key Management** - Store LLM and Cloudflare keys per agent
- [x] **Deployment Job Creation** - Creates jobs for deployment server
- [x] **Module Listing** - Returns available modules
- [x] **TypeScript Types** - Full type safety throughout

### ⚠️ Partially Implemented

- [x] **Workflow Generation** - Generates workflow JSON (tools registration)
- [ ] **Module Execution** - Module execution endpoints not yet implemented
- [ ] **Direct Chat Integration** - Frontend integration pending
- [ ] **Deployment Status Polling** - No real-time status updates

### 📦 Module System

**Note**: Modules are now in `/server/modules/` (not in project). The backend only lists available modules, but module definitions and tool execution are handled by the deployment server.

### ❌ Not Implemented

- [ ] **Frontend UI Integration** - UI components not connected to backend
- [ ] **Real-time Deployment Status** - No WebSocket/polling for job status
- [ ] **Module Execution API** - Endpoints to execute module tools
- [ ] **Error Recovery** - Retry logic for failed operations
- [ ] **Rate Limiting** - API rate limiting not implemented
- [ ] **Authentication Middleware** - Wallet signature verification

## 🏗️ Architecture

### Structure

```
project/
├── src/
│   ├── app/
│   │   ├── api/              # Serverless API routes
│   │   │   ├── agents/       # Agent management
│   │   │   └── modules/     # Module listing
│   │   └── ...              # Next.js pages
│   ├── lib/
│   │   ├── db/              # MongoDB models & connection
│   │   ├── storage/         # Data access layer
│   │   └── workflow/        # Workflow builder
│   └── types/               # TypeScript definitions
└── ...
```

### Data Flow

1. **User creates agent** → `POST /api/agents`
   - Stores agent with selected modules (as capabilities)
   - No input parameters needed

2. **User deploys agent** → `POST /api/agents/[id]/deploy`
   - Generates workflow with tool definitions
   - Creates deployment job in MongoDB
   - Returns job ID (deployment happens async via server)

3. **Deployment Server** (separate process)
   - Polls for pending jobs
   - Deploys agent to Cloudflare Workers
   - Updates job status

## 🔌 API Endpoints

### Agent Management

- `GET /api/agents?walletAddress=0x...` - List user agents
- `POST /api/agents` - Create agent
- `GET /api/agents/[id]?walletAddress=0x...` - Get agent
- `PUT /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]?walletAddress=0x...` - Delete agent
- `POST /api/agents/[id]/deploy` - Create deployment job

### Module Management

- `POST /api/modules` - List available modules

## 📦 Dependencies

- Next.js 15
- TypeScript
- MongoDB (Mongoose)
- React 19

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 🔧 Environment Variables

```env
MONGODB_URI=mongodb+srv://...
AGENT_BASE_URL=https://agent.nullshot.io
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

## 📝 Notes

- Modules are stored as capabilities, not pre-configured actions
- Parameters come from chat conversation
- Deployment is asynchronous via separate server
- All API routes return JSON (no HTML)

## 🔗 Integration

- **Deployment Server**: Creates jobs that server processes
- **Frontend**: Consumes API endpoints
- **MongoDB**: Shared database with deployment server
