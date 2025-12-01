# Environment Variables Setup

## Required Environment Variables

The deployment server needs these environment variables to run:

### 1. MongoDB Connection
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### 2. Anthropic API Key (for LLM)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 3. Cloudflare Credentials
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

### 4. Optional: Log Level
```bash
LOG_LEVEL=INFO  # or DEBUG, WARN, ERROR
```

## Setup Instructions

### Option 1: Create `.env` file in `server/` directory

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

Then install `dotenv` package:
```bash
npm install dotenv
```

And load it in `server/index.ts`:
```typescript
import 'dotenv/config';
```

### Option 2: Export in terminal

```bash
export MONGODB_URI="mongodb+srv://..."
export ANTHROPIC_API_KEY="sk-ant-api03-..."
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"
export LOG_LEVEL="INFO"
```

### Option 3: Use environment-specific files

For different environments (dev, staging, prod), create:
- `.env.development`
- `.env.staging`
- `.env.production`

## Getting Your Credentials

### MongoDB URI
1. Go to MongoDB Atlas
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password

### Anthropic API Key
1. Go to https://console.anthropic.com/
2. Navigate to API Keys
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

### Cloudflare Credentials
1. Go to https://dash.cloudflare.com/
2. Click on your account
3. Scroll to "API Tokens" section
4. Create a token with:
   - Permissions: Account > Workers Scripts > Edit
   - Account Resources: Include > All accounts
5. Copy the Account ID (found in right sidebar)
6. Copy the API Token

## Verify Setup

Run the test script to verify:
```bash
cd server
MONGODB_URI="your-uri" node test-deployment.js
```

If successful, you'll see:
```
✅ Connected to MongoDB
✅ Agent created
✅ Deployment Job created
```

## Security Notes

⚠️ **Never commit `.env` files to git!**

Make sure `.env` is in `.gitignore`:
```
server/.env
server/.env.*
```

