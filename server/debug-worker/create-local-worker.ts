/**
 * Script to create a local worker for debugging
 * Run: npx tsx server/debug-worker/create-local-worker.ts
 */

import * as codeGenerator from '../services/codeGenerator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createLocalWorker() {
  const debugDir = __dirname;
  
  // Sample tools for testing
  const tools = [
    {
      name: 'createToken',
      description: 'Create and deploy a new ERC20 token on the blockchain using Coinbase AgentKit. Provides secure token deployment with proper contract creation.',
      inputSchema: {
        type: 'object',
        properties: {
          tokenName: {
            type: 'string',
            description: 'Name of the token (e.g., "My Awesome Token")',
          },
          tokenSymbol: {
            type: 'string',
            description: 'Symbol of the token (e.g., "MAT")',
          },
          totalSupply: {
            type: 'string',
            description: 'Total supply of tokens to create (as string, e.g., "1000000")',
          },
          decimals: {
            type: 'number',
            description: 'Number of decimals for the token (default: 18)',
          },
          network: {
            type: 'string',
            description: 'Blockchain network (e.g., "base-sepolia", "base-mainnet", "ethereum")',
          },
        },
        required: ['tokenName', 'tokenSymbol', 'totalSupply', 'network'],
      },
      toolFunction: 'createToken',
    },
  ];

  const agentName = 'DebugAgent';
  
  // Generate code
  const agentCode = (codeGenerator as any).generateAgentCode({
    agentName,
    tools,
    systemPrompt: 'You are a helpful AI assistant that can create ERC20 tokens. When users ask to create tokens, use the createToken tool.',
  });

  const wranglerConfig = (codeGenerator as any).generateWranglerConfig(agentName, undefined, 'debug-agent');
  const packageJson = (codeGenerator as any).generatePackageJson('debug-agent');

  // Create src directory
  await fs.mkdir(path.join(debugDir, 'src'), { recursive: true });

  // Write files
  await fs.writeFile(path.join(debugDir, 'src/index.ts'), agentCode);
  await fs.writeFile(path.join(debugDir, 'wrangler.jsonc'), wranglerConfig);
  await fs.writeFile(path.join(debugDir, 'package.json'), packageJson);

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "esnext",
      lib: ["ES2022"],
      jsx: "react",
      moduleResolution: "bundler",
      types: ["@cloudflare/workers-types"],
      resolveJsonModule: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
    },
    include: ["src/**/*"],
  };
  await fs.writeFile(path.join(debugDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  // Create .dev.vars file for local secrets
  const devVars = `ANTHROPIC_API_KEY=your-key-here
API_BASE_URL=http://localhost:3000
CDP_API_KEY_NAME=agentkit
CDP_API_KEY_PRIVATE_KEY=your-cdp-key-here
CDP_AGENT_KIT_NETWORK=base-sepolia
`;
  await fs.writeFile(path.join(debugDir, '.dev.vars'), devVars);

  console.log('✅ Local worker files created in:', debugDir);
  console.log('\n📝 Next steps:');
  console.log('1. Update .dev.vars with your actual API keys');
  console.log('2. Run: cd server/debug-worker && npm install');
  console.log('3. Run: npx wrangler dev');
  console.log('4. Test: curl -X POST http://localhost:8787/agent/chat -H "Content-Type: application/json" -d \'{"message": "Create a token named TestToken with symbol TST"}\'');
}

createLocalWorker().catch(console.error);

