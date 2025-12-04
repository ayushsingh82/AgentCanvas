# Configuration

This file contains all configuration values needed for the deployment system.

## Factory Contract Addresses

Add your deployed factory contract addresses and ABIs here:

### Token Factory
- **Address**: `0xb88c0e115AFBD252B92CC31Ac6b52f83d24F7448`
- **Network**: `base-sepolia`
- **ABI**: See `project/src/app/api/agentkit/createToken/route.ts` (lines 74-136)
- **Status**: ✅ Deployed and working

### NFT Factory
- **Address**: `TBD` (Add when deployed)
- **Network**: `TBD`
- **ABI**: `TBD`

### DAO Factory
- **Address**: `TBD` (Add when deployed)
- **Network**: `TBD`
- **ABI**: `TBD`

## Environment Variables

Required environment variables are set in:
- `server/debug-worker/.dev.vars` (for local development)
- Cloudflare Workers secrets (for production)

## API Endpoints

The system uses the following backend API endpoints:
- `/api/agentkit/createToken` - Create ERC20 tokens
- `/api/agentkit/createNFT` - Create NFT collections
- `/api/agentkit/createDAO` - Create DAO contracts
- `/api/agentkit/makeTransaction` - Execute transactions
- `/api/agentkit/airdrop` - Airdrop tokens
- `/api/agentkit/transferFunds` - Transfer funds
- `/api/agentkit/deployContract` - Deploy contracts
- `/api/agentkit/readContract` - Read contract state
- `/api/agentkit/writeContract` - Write to contracts

## Notes

- Factory contract addresses should be added to environment variables or hardcoded in the API routes
- ABIs should be stored in the API route files or imported from contract files
- Network configuration is set per deployment job

