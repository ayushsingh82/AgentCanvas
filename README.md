<div align="center">
  <img src="project/public/logo.png" alt="Agent Canvas Logo" width="120" height="120" />
  <h1>Agent Canvas</h1>
</div>

Agent Canvas is a no-code agent deployer that enables you to build and deploy AI agents in just a few clicks. The platform supports multiple tool categories including onchain activity, onchain data, and productivity tools (coming soon). Built on the Null Shot framework, Agent Canvas provides a visual drag-and-drop interface for creating production-ready agents without writing any code.

The deployment pipeline uses a dedicated server that automatically deploys agents using the Null Shot framework, ensuring seamless CI/CD integration for your agent workflows.

## Features

- **Visual Agent Builder**: Drag-and-drop interface for building agents with modules and tools
- **No-Code Deployment**: Deploy agents to production in minutes with just a few clicks
- **Null Shot Framework Integration**: Powered by the Null Shot agent framework for robust agent orchestration and execution
- **Onchain Activity Tools**: Support for blockchain interactions including token creation, NFT minting, DAO creation, and fund transfers
- **Onchain Data Tools**: Fetch real-time blockchain data including prices, balances, transaction history, and contract states
- **Modular Architecture**: Composable modules that can be connected visually to create complex agent workflows
- **Automatic CI/CD Pipeline**: Server-based deployment system that automatically handles agent deployments using Null Shot
- **Cloudflare Workers Deployment**: Agents are deployed as serverless functions on Cloudflare Workers
- **Wallet-Based Authentication**: Secure authentication using wallet addresses
- **Real-Time Chat Interface**: Interactive chat interface for testing and using deployed agents
- **Agent Management**: Create, update, and manage multiple agents from a single dashboard

## Upcoming Features

- **Productivity Tools Support**: Email sending, reminders, task creation, and meeting scheduling capabilities
- **Enhanced Module Library**: Expanded collection of pre-built modules for common use cases
- **Agent Analytics**: Performance metrics and usage analytics for deployed agents
- **Custom Module Builder**: Create and share custom modules with the community
- **Multi-Chain Support**: Extended blockchain network support beyond current implementations
- **Agent Templates**: Pre-configured agent templates for quick deployment
- **Collaborative Features**: Team collaboration and agent sharing capabilities

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

## How to Setup Project Locally

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Cloudflare account with API token
- Wallet for authentication

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Sumit-Dragdrop
```

### 2. Setup Next.js Frontend/Backend

```bash
cd project
npm install
```

Create a `.env.local` file in the `project` directory:

```env
MONGODB_URI=mongodb+srv://...
AGENT_BASE_URL=https://agent.nullshot.io
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
WALLET_PRIVATE_KEY=...
CDP_API_KEY_PRIVATE_KEY=...
CDP_AGENT_KIT_NETWORK=base-sepolia
```

Start the development server:

```bash
npm run dev
```

The application will run on http://localhost:3000

### 3. Setup Deployment Server

Open a new terminal and navigate to the server directory:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=mongodb+srv://...  # Same as project
AGENT_BASE_URL=https://agent.nullshot.io
LOG_LEVEL=INFO
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

Start the deployment server:

```bash
npm run dev
```

The deployment server polls MongoDB every 5 seconds for pending deployment jobs and automatically deploys agents using the Null Shot framework.

## Architecture

- **Project**: Next.js 15 with serverless API routes handling agent management and workflow generation
- **Server**: Long-running Node.js process that implements the CI/CD pipeline, polling for deployment jobs and deploying agents to Cloudflare Workers using the Null Shot framework
- **Database**: Shared MongoDB instance for agent metadata and deployment job tracking
- **Null Shot Framework**: Core framework powering agent execution, orchestration, and deployment

## Documentation

- `project/workflow.md` - Backend workflow and API documentation
- `project/DEPLOYMENT_SETUP.md` - Deployment setup guide
- `server/README.md` - Deployment server documentation

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API routes, Node.js
- **Database**: MongoDB with Mongoose
- **Deployment**: Cloudflare Workers
- **Agent Framework**: Null Shot framework
- **Blockchain**: Ethers.js, Viem, Wagmi
