# Required Environment Variables

Before running the deployment server or test script, you need these environment variables:

## 🔴 Required (Must Have)

### 1. MongoDB Connection
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```
**Used by:** Database connection in `server/services/db.ts`

### 2. Anthropic API Key
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```
**Used by:** LLM provider for agent responses in `server/services/nullshotAgent.ts`

### 3. Cloudflare Account ID
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
```
**Used by:** Cloudflare Workers deployment in `server/services/cloudflareDeployer.ts`

### 4. Cloudflare API Token
```bash
CLOUDFLARE_API_TOKEN=your-api-token-here
```
**Used by:** Cloudflare Workers deployment in `server/services/cloudflareDeployer.ts`

## 🟡 Optional

### Log Level
```bash
LOG_LEVEL=INFO  # Options: DEBUG, INFO, WARN, ERROR
```
**Used by:** Logging service in `server/services/logger.ts`
**Default:** INFO

## Quick Setup

### Option 1: Export in Terminal
```bash
export MONGODB_URI="mongodb+srv://..."
export ANTHROPIC_API_KEY="sk-ant-api03-..."
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"
```

### Option 2: Create .env File
```bash
cd server
cat > .env << EOF
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
ANTHROPIC_API_KEY=sk-ant-api03-...
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
LOG_LEVEL=INFO
EOF
```

Then install dotenv:
```bash
npm install dotenv
```

And add to top of `index.ts`:
```typescript
import 'dotenv/config';
```

## Verify Setup

Test your environment variables:
```bash
cd server
MONGODB_URI="your-uri" node test-deployment.js
```

If you see "✅ Connected to MongoDB", your MONGODB_URI is correct.

## Getting Credentials

See `ENV_SETUP.md` for detailed instructions on obtaining each credential.

