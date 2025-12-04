# Local Worker Debug Setup

## Quick Start

1. **Generate worker files:**
   ```bash
   npx tsx create-local-worker.ts
   ```

2. **Update .dev.vars with your API keys:**
   ```bash
   # Edit .dev.vars and add your actual keys
   ANTHROPIC_API_KEY=sk-ant-...
   API_BASE_URL=http://localhost:3000
   CDP_API_KEY_NAME=agentkit
   CDP_API_KEY_PRIVATE_KEY=your-key
   CDP_AGENT_KIT_NETWORK=base-sepolia
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run locally:**
   ```bash
   npx wrangler dev
   ```

5. **Test the agent:**
   ```bash
   curl -X POST http://localhost:8787/agent/chat \
     -H 'Content-Type: application/json' \
     -d '{
       "message": "Create a new ERC20 token named TestToken with symbol TST, total supply of 1000000, and 18 decimals on base-sepolia network"
     }'
   ```

## Debugging

- Check console logs for `[TOOL EXECUTION]` messages
- Check for tool structure logs
- Look for any errors in the wrangler dev output
