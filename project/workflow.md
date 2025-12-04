# Backend Workflow & Integration Guide

## Overview

This document outlines the complete backend flow, API endpoints, and features implemented for the no-code agent builder platform. The backend is built with Next.js 15 serverless API routes, TypeScript, and MongoDB for persistence.

### 🎯 Key Architectural Principle

**Modules are Capabilities, Not Pre-Configured Actions**

- Modules are registered as **available tools/capabilities** when an agent is created
- **No input parameters** are required at agent creation time
- Parameters are provided by the user **during chat conversation**
- The agent uses tools dynamically based on what the user asks for

**Example Flow**:
1. User creates agent → Selects `tokenFactory` module (no params needed)
2. Agent deployed → `tokenFactory_create` tool is registered
3. User chats: "Deploy a token called MyToken"
4. Agent uses `tokenFactory_create` tool with chat-provided parameters
5. Token is deployed

---

## Architecture

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (with Mongoose)
- **Storage**: MongoDB collections
- **Deployment**: Vercel Serverless Functions
- **Agent Engine**: NullShot (stubbed for integration)

### Folder Structure
```
src/
├── app/
│   └── api/                    # API routes
│       ├── agents/             # Agent management
│       ├── modules/            # Module listing
│       ├── chat/               # Chat endpoint (deprecated)
│       ├── generateWorkflow/   # Workflow generation
│       ├── getUserModules/     # Get user modules (deprecated)
│       ├── runWorkflow/        # Run workflow
│       └── saveModules/        # Save modules (deprecated)
├── lib/
│   ├── agent/                  # Agent runner & session management
│   ├── db/                     # MongoDB connection & models
│   ├── modules/                # Module definitions
│   ├── storage/                # Storage utilities
│   └── workflow/               # Workflow builder
└── types/                      # TypeScript type definitions
```

---

## User Flow

### 1. User Authentication (Wallet Connect)
- User connects wallet using WalletConnect
- Frontend receives wallet address (e.g., `0x1234...`)
- Wallet address is used as user identifier throughout the system

### 2. Fetch User Agents
**Endpoint**: `GET /api/agents?walletAddress=0x...`

**Response**:
```json
{
  "success": true,
  "agents": [
    {
      "id": "agent_id",
      "name": "My DeFi Agent",
      "description": "Handles token creation",
      "tags": ["defi", "tokens"],
      "walletAddress": "0x1234...",
      "status": "deployed",
      "agentChatURL": "https://agent.nullshot.io/chat/...",
      "modules": [...],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 3. Create New Agent
**Endpoint**: `POST /api/agents`

**Important**: Modules are **capabilities/tools**, not pre-configured actions. Parameters come from chat conversation when the agent uses the tool.

**Request**:
```json
{
  "walletAddress": "0x1234...",
  "name": "My Agent",
  "description": "Agent description",
  "tags": ["tag1", "tag2"],
  "modules": [
    {
      "moduleName": "tokenFactory",  // Just the capability - no input params needed
      "order": 0
    },
    {
      "moduleName": "nftFactory"     // Another capability
    }
  ],
  "apiKeys": {
    "llmKey": "sk-...",
    "cloudflareKey": "cf-..."
  }
}
```

**Note**: The `input` field is optional. Modules are registered as available tools/capabilities. When the agent is deployed, these tools become available for the agent to use based on chat conversation.

**Response**:
```json
{
  "success": true,
  "agent": {
    "id": "agent_id",
    "name": "My Agent",
    "status": "draft",
    ...
  }
}
```

### 4. Update Agent
**Endpoint**: `PUT /api/agents/[id]`

**Request**:
```json
{
  "walletAddress": "0x1234...",
  "name": "Updated Name",
  "tags": ["new", "tags"],
  "modules": [...],
  "apiKeys": {...}
}
```

### 5. Deploy Agent
**Endpoint**: `POST /api/agents/[id]/deploy`

**Request**:
```json
{
  "walletAddress": "0x1234..."
}
```

**Process**:
1. Validates agent exists and belongs to user
2. Registers selected modules as available tools/capabilities
3. Generates tool definitions for agent registration (no pre-filled parameters)
4. Initializes NullShot agent instance with registered tools
5. Returns `agentChatURL` for direct chat access
6. Updates agent status to "deployed"

**Key Point**: Tools are registered as capabilities. The agent can use these tools during chat conversation. Parameters come from the user's chat messages, not from agent creation.

**Response**:
```json
{
  "success": true,
  "agent": {...},
  "agentChatURL": "https://agent.nullshot.io/chat/agent-123?session=session-456"
}
```

### 6. Chat with Agent
**Direct Connection** (Recommended):
- Frontend receives `agentChatURL` from deployment
- Opens chat window connecting directly to agent URL
- No proxying through backend
- Can be embedded in iframe or custom widget

**Backend Endpoint** (Deprecated):
- `POST /api/chat` - Returns agentChatURL for direct connection

---

## API Endpoints

### Agent Management

#### `GET /api/agents`
Get all agents for a wallet address.

**Query Parameters**:
- `walletAddress` (required): User's wallet address

**Response**: Array of agent objects with metadata

---

#### `POST /api/agents`
Create a new agent.

**Body**:
- `walletAddress` (required): User's wallet address
- `name` (required): Agent name
- `description` (optional): Agent description
- `tags` (optional): Array of tags
- `modules` (required): Array of module selections (module names only, no input params needed)
- `apiKeys` (optional): API keys object

**Module Selection Format**:
```json
{
  "modules": [
    { "moduleName": "tokenFactory" },  // Just the capability
    { "moduleName": "nftFactory" }
  ]
}
```

**Response**: Created agent object

---

#### `GET /api/agents/[id]`
Get specific agent by ID.

**Query Parameters**:
- `walletAddress` (required): For authorization

**Response**: Agent object with full details

---

#### `PUT /api/agents/[id]`
Update agent.

**Body**:
- `walletAddress` (required): For authorization
- Other fields to update

**Response**: Updated agent object

---

#### `DELETE /api/agents/[id]`
Delete agent.

**Query Parameters**:
- `walletAddress` (required): For authorization

**Response**: Success message

---

#### `POST /api/agents/[id]/deploy`
Deploy agent and get chat URL.

**Body**:
- `walletAddress` (required): For authorization

**Response**: Agent object with `agentChatURL`

---

### Module Management

#### `POST /api/modules`
Get all available modules.

**Response**:
```json
{
  "success": true,
  "modules": [
    {
      "name": "tokenFactory",
      "description": "Create and deploy custom ERC20 tokens",
      "inputSchema": {...}
    },
    ...
  ]
}
```

---

### Workflow Management

#### `POST /api/generateWorkflow`
Generate workflow JSON from agent modules.

**Body**:
- `walletAddress` (required): User's wallet address
- `agentId` (required): Agent ID

**Response**: Complete workflow object

---

#### `POST /api/runWorkflow`
Run a workflow using NullShot.

**Body**:
- `workflow` (required): Workflow object
- `mcpTools` (optional): MCP tools configuration

**Response**: Execution results with outputs

---

### Deprecated Endpoints

These endpoints are kept for backward compatibility but should not be used in new implementations:

- `POST /api/saveModules` - Use `PUT /api/agents/[id]` instead
- `POST /api/getUserModules` - Use `GET /api/agents/[id]` instead
- `POST /api/chat` - Connect directly to `agentChatURL` instead

---

## Modules

### Module Architecture: Capabilities, Not Pre-Configured Actions

**Key Concept**: Modules are registered as **capabilities/tools** that the agent can use during chat conversation. Parameters are provided by the user during chat, not at agent creation time.

### Available Modules

1. **tokenFactory**
   - **Capability**: Create and deploy ERC20 tokens
   - **Tool Name**: `tokenFactory_create`
   - **Parameters** (provided during chat): name, symbol, totalSupply, decimals, network

2. **nftFactory**
   - **Capability**: Create and deploy NFT collections
   - **Tool Name**: `nftFactory_create`
   - **Parameters** (provided during chat): collectionName, symbol, maxSupply, baseURI, network

3. **daoFactory**
   - **Capability**: Create DAOs with governance
   - **Tool Name**: `daoFactory_create`
   - **Parameters** (provided during chat): daoName, votingPeriod, quorum, network

4. **fundTransfer**
   - **Capability**: Transfer tokens between addresses
   - **Tool Name**: `fundTransfer_execute`
   - **Parameters** (provided during chat): to, amount, tokenAddress, network

5. **airdrop**
   - **Capability**: Distribute tokens to multiple addresses
   - **Tool Name**: `airdrop_execute`
   - **Parameters** (provided during chat): tokenAddress, recipients array, network

6. **marketplace**
   - **Capability**: Create NFT marketplaces
   - **Tool Name**: `marketplace_create`
   - **Parameters** (provided during chat): marketplaceName, feePercentage, feeRecipient, network

### Module Structure

Each module exports:
- `name`: Module identifier
- `description`: Human-readable description
- `inputSchema`: JSON schema for tool parameters (used during chat)
- `workflowSnippet`: NullShot tool actions (for reference)
- `validateInput()`: Input validation function (used when tool is called)
- `generateWorkflow()`: Generate workflow snippet (legacy, for compatibility)
- `getToolDefinition()`: **Returns tool definition for agent registration** (NEW)

### How Modules Work

1. **Agent Creation**: User selects modules (e.g., `tokenFactory`, `nftFactory`)
   - No input parameters required
   - Modules are stored as capabilities

2. **Agent Deployment**: Modules are registered as available tools
   - Tool definitions are generated
   - Tools are registered with NullShot agent
   - Agent can now use these tools

3. **Chat Conversation**: User provides parameters when using tools
   - User: "Deploy a token called MyToken with symbol MTK"
   - Agent: Uses `tokenFactory_create` tool with parameters from chat
   - Token is deployed with chat-provided parameters

---

## Database Schema

### Agent Collection

```typescript
{
  _id: ObjectId,
  walletAddress: string (indexed),
  name: string,
  description?: string,
  tags?: string[],
  modules: [
    {
      moduleName: string,
      input?: object,  // Optional - modules are capabilities, not pre-configured actions
      order?: number
    }
  ],
  workflow?: object,
  agentChatURL?: string,
  status: 'draft' | 'deployed' | 'archived',
  apiKeys?: {
    llmKey?: string,
    cloudflareKey?: string,
    [key: string]: string
  },
  createdAt: Date,
  updatedAt: Date,
  deployedAt?: Date
}
```

**Indexes**:
- `walletAddress` (single)
- `walletAddress + status` (compound)
- `walletAddress + createdAt` (compound, descending)

---

## Workflow Generation

### Process

1. **Module Selection**: User selects modules as capabilities (no input parameters needed)
2. **Tool Registration**: Each module is registered as an available tool
3. **Workflow Building**: 
   - Tool definitions are generated from modules
   - Tools are registered with the agent (not executed)
   - Parameters are empty - they come from chat conversation
4. **Metadata Addition**:
   - `userId`: Wallet address
   - `sessionId`: Unique session identifier
   - `agentId`: Unique agent identifier
   - `agentChatURL`: Direct chat URL
   - `timestamp`: Creation timestamp

### Workflow Structure

The workflow now contains **tool definitions** for agent registration, not pre-filled actions:

```json
{
  "metadata": {
    "userId": "0x1234...",
    "sessionId": "session-123",
    "agentId": "agent-456",
    "agentChatURL": "https://...",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "nodes": [
    {
      "id": "tool-0",
      "type": "tool",
      "name": "tokenFactory_create",
      "tool": "tokenFactory_create",
      "parameters": {}  // Empty - parameters come from chat
    },
    {
      "id": "tool-1",
      "type": "tool",
      "name": "nftFactory_create",
      "tool": "nftFactory_create",
      "parameters": {}  // Empty - parameters come from chat
    }
  ],
  "tools": [
    {
      "name": "tokenFactory_create",
      "description": "Create and deploy a custom ERC20 token",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Token name" },
          "symbol": { "type": "string", "description": "Token symbol" },
          "totalSupply": { "type": "string", "description": "Total supply" },
          "network": { "type": "string", "description": "Blockchain network" }
        },
        "required": ["name", "symbol", "totalSupply", "network"]
      },
      "toolFunction": "tokenFactory_create"
    }
  ]
}
```

**Key Difference**: 
- **Before**: Workflow had pre-filled parameters (e.g., `"name": "MyToken"`)
- **Now**: Workflow has tool definitions with empty parameters
- **Parameters**: Provided by user during chat conversation

---

## Agent Deployment

### Deployment Flow

1. **Validation**:
   - Agent exists and belongs to user
   - Agent has at least one module selected
   - No input validation needed (modules are capabilities, not actions)

2. **Tool Registration**:
   - Generate tool definitions from selected modules
   - Each module becomes an available tool/capability
   - Tools are registered with the agent (not executed)

3. **Agent Initialization**:
   - Initialize NullShot agent instance
   - Register tools as available capabilities
   - Pass API keys to agent
   - Generate unique agent instance ID

4. **URL Generation**:
   - Create `agentChatURL` with format:
     `{AGENT_BASE_URL}/chat/{agentInstanceId}?session={sessionId}`

5. **Database Update**:
   - Set status to "deployed"
   - Store workflow (with tool definitions)
   - Store agentChatURL
   - Set deployedAt timestamp

### Example: Chat-Driven Tool Usage

**After Deployment**:
- Agent has `tokenFactory_create` tool available
- Agent has `nftFactory_create` tool available

**User Chat**:
```
User: "Deploy a token called MyToken with symbol MTK and supply 1000000 on ethereum"
Agent: [Uses tokenFactory_create tool with parameters from chat]
Agent: "Token deployed successfully at address 0x..."
```

**Key Point**: The agent uses tools based on conversation context. Parameters are extracted from user messages, not from agent configuration.

---

## Direct Chat Integration

### Frontend Implementation

Once agent is deployed, frontend receives `agentChatURL`. Two integration options:

#### Option 1: Iframe Embed
```tsx
<iframe 
  src={agent.agentChatURL}
  width="100%"
  height="600px"
  frameBorder="0"
/>
```

#### Option 2: Custom Widget
```tsx
// Connect directly to agent URL
const chatSocket = new WebSocket(agent.agentChatURL);
// Handle chat messages
```

### Benefits
- No backend proxying
- Direct connection to agent
- Lower latency
- Reduced server load
- Better scalability

---

## Environment Variables

### Required Variables

Create `.env.local` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agent-builder

# Agent Base URL
AGENT_BASE_URL=https://agent.nullshot.io
```

### Vercel Deployment

Add environment variables in Vercel dashboard:
1. Go to project settings
2. Navigate to "Environment Variables"
3. Add `MONGODB_URI` and `AGENT_BASE_URL`

---

## Error Handling

All API endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Common Error Codes

- `400`: Bad Request (missing/invalid parameters)
- `404`: Not Found (agent doesn't exist)
- `500`: Internal Server Error

---

## Security Features

1. **Wallet Address Validation**: All endpoints validate wallet address format
2. **Authorization**: Users can only access their own agents
3. **Input Validation**: All module inputs are validated
4. **API Key Storage**: API keys stored securely in database
5. **Environment Variables**: Sensitive data in `.env.local` (gitignored)

---

## Features Implemented

### ✅ Core Features

- [x] Wallet-based authentication
- [x] Agent CRUD operations
- [x] Module selection as capabilities (no input params required)
- [x] Tool registration system (modules become available tools)
- [x] Workflow generation with tool definitions
- [x] Agent deployment with chat URL
- [x] Direct agent chat integration
- [x] MongoDB persistence
- [x] API key management
- [x] Agent metadata (name, tags, description)
- [x] Agent status tracking (draft, deployed, archived)
- [x] Chat-driven tool execution (parameters from conversation)

### ✅ Module System

- [x] Token Factory module (capability-based)
- [x] NFT Factory module (capability-based)
- [x] DAO Factory module (capability-based)
- [x] Fund Transfer module (capability-based)
- [x] Airdrop module (capability-based)
- [x] Marketplace module (capability-based)
- [x] Modular architecture for easy extension
- [x] Tool definition generation for agent registration

### ✅ API Endpoints

- [x] List user agents
- [x] Create agent
- [x] Get agent details
- [x] Update agent
- [x] Delete agent
- [x] Deploy agent
- [x] List available modules
- [x] Generate workflow
- [x] Run workflow

### ✅ Infrastructure

- [x] MongoDB integration
- [x] Serverless-ready architecture
- [x] TypeScript type safety
- [x] Error handling
- [x] Environment variable management
- [x] Database indexing for performance

---

## Next Steps (Integration Points)

### NullShot Integration

The following functions need NullShot SDK integration:

1. **`src/lib/agent/runner.ts`**:
   - `NullShotRunner.initializeAgent()` - Replace stub
   - `NullShotRunner.runWorkflow()` - Replace stub
   - `NullShotRunner.chat()` - Replace stub

2. **Workflow Format**:
   - Ensure workflow structure matches NullShot requirements
   - Verify tool names match NullShot tool registry

### Frontend Integration

1. **Wallet Connect**: Integrate wallet connection
2. **Agent List**: Display user agents with metadata
3. **Agent Creation**: Form for creating agents
   - Agent name, description, tags
   - **Module Selection**: Simple checkbox/list (no configuration needed)
   - API Key Input: Secure input for API keys
4. **Deployment**: Trigger deployment and show agentChatURL
5. **Chat Widget**: Embed or connect to agentChatURL
   - User provides parameters during chat
   - Agent uses registered tools based on conversation

---

## Testing

### Manual Testing Flow

1. Connect wallet → Get wallet address
2. Create agent → `POST /api/agents` (select modules, no input params needed)
3. List agents → `GET /api/agents?walletAddress=...`
4. Update agent → `PUT /api/agents/[id]`
5. Deploy agent → `POST /api/agents/[id]/deploy` (tools are registered)
6. Get agentChatURL → Use in frontend
7. Connect to chat → Direct connection to agentChatURL
8. **Test tool usage**: Chat with agent, provide parameters, agent uses tools

---

## Support & Documentation

- **Module Development**: See `src/lib/modules/` for examples
- **API Documentation**: See individual route files in `src/app/api/`
- **Type Definitions**: See `src/types/` for TypeScript interfaces

---

## Version History

- **v1.1.0**: Architecture Update - Modules as Capabilities
  - **BREAKING CHANGE**: Modules are now capabilities/tools, not pre-configured actions
  - No input parameters required at agent creation
  - Parameters provided during chat conversation
  - Tool registration system for agent deployment
  - Chat-driven tool execution

- **v1.0.0**: Initial implementation
  - Wallet-based authentication
  - Agent CRUD operations
  - Module system
  - Workflow generation
  - Direct chat integration
  - MongoDB persistence

