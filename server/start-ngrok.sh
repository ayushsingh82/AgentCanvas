#!/bin/bash

# Start ngrok and update .env with the URL

echo "🚀 Starting ngrok on port 3000..."
echo "⚠️  Make sure your Next.js server is running on port 3000 first!"
echo ""

# Kill any existing ngrok processes
pkill -f "ngrok http" 2>/dev/null
sleep 1

# Start ngrok in background
ngrok http 3000 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

echo "⏳ Waiting for ngrok to start..."
sleep 6

# Try multiple methods to get the URL
URL=""

# Method 1: Try JSON parsing with Python
if command -v python3 &> /dev/null; then
  URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'tunnels' in data and len(data['tunnels']) > 0:
        for tunnel in data['tunnels']:
            if tunnel.get('proto') == 'https':
                print(tunnel.get('public_url', ''))
                break
except:
    pass
" 2>/dev/null)
fi

# Method 2: Try grep for public_url
if [ -z "$URL" ]; then
  URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -oE '"public_url":"https://[^"]+"' | head -1 | sed 's/"public_url":"//;s/"//')
fi

# Method 3: Try simple pattern matching
if [ -z "$URL" ]; then
  URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -oE 'https://[a-zA-Z0-9.-]+\.(ngrok-free\.app|ngrok\.io)' | head -1)
fi

if [ -n "$URL" ]; then
  echo "✅ Found ngrok URL: $URL"
  echo ""
  
  # Update .env file
  cd "$(dirname "$0")"
  if [ -f .env ]; then
    # Remove old API_BASE_URL line if exists (including commented ones)
    sed -i.bak '/^API_BASE_URL=/d' .env
    sed -i.bak '/^#.*API_BASE_URL/d' .env
    # Add new one
    echo "" >> .env
    echo "# API Base URL for backend (set via ngrok for local testing, or Vercel URL for production)" >> .env
    echo "API_BASE_URL=$URL" >> .env
    echo "✅ Updated server/.env with: API_BASE_URL=$URL"
    echo ""
    echo "📋 Your ngrok is running! The URL has been saved to .env"
    echo "📋 To view ngrok dashboard: http://localhost:4040"
    echo ""
    echo "🔄 Keep this terminal open. When you're done, press Ctrl+C to stop ngrok."
    echo ""
    echo "💡 You can now deploy your agent and it will use this URL!"
    wait $NGROK_PID
    exit 0
  else
    echo "❌ .env file not found!"
    kill $NGROK_PID 2>/dev/null
    exit 1
  fi
else
  echo "⚠️  Could not automatically get ngrok URL from API."
  echo ""
  echo "📋 Manual steps:"
  echo "   1. Visit http://localhost:4040 in your browser"
  echo "   2. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)"
  echo "   3. Update server/.env:"
  echo "      API_BASE_URL=<your-ngrok-url>"
  echo ""
  echo "📋 ngrok is running in the background (PID: $NGROK_PID)"
  echo "📋 To stop ngrok, run: pkill -f 'ngrok http'"
  echo ""
  echo "🔄 Keeping ngrok running... Press Ctrl+C to stop."
  wait $NGROK_PID
fi
