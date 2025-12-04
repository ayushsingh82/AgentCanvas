# Agent Deployment System

## Overview

The agent deployment system generates NullShot agent code and deploys it to Cloudflare Workers. When a user deploys an agent, the system:

1. Generates agent code with registered tools
2. Deploys to Cloudflare Workers
3. Returns the agentChatURL for direct chat access

## Architecture

### Code Generation
- `codeGenerator.ts`: Generates NullShot agent TypeScript code
- Creates agent class extending `SimplePromptAgent`
- Registers tools as capabilities
- Generates tool handlers that call module implementations

### Deployment
- `deployer.ts`: Handles Cloudflare Workers deployment
- Uses Cloudflare API to upload and deploy workers
- Sets environment variables and secrets
- Returns deployment URL

### Agent Runner
- `runner.ts`: Orchestrates agent initialization and deployment
- Calls code generator and deployer
- Manages agent instances and sessions

## Environment Variables

Required for deployment:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
ANTHROPIC_API_KEY=your_anthropic_key (for LLM)
```

## Deployment Flow

1. User clicks "Deploy Agent"
2. System generates agent code with selected modules as tools
3. Code is deployed to Cloudflare Workers
4. Agent URL is returned: `https://{worker-name}.workers.dev/agent/chat`
5. User can chat directly with deployed agent

## Tool Registration

Tools are registered as capabilities. When user chats:
- User: "Deploy a token called MyToken"
- Agent uses `tokenFactory_create` tool
- Tool handler calls module implementation
- Token is deployed

## Notes

- Cloudflare Workers API requires proper authentication
- Workers need to be bundled before deployment (consider using Wrangler)
- For production, consider using a CI/CD pipeline
- Tool handlers call module services via API endpoints

