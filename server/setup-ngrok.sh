#!/bin/bash

echo "🔐 ngrok Authentication Setup"
echo ""
echo "To use ngrok, you need to:"
echo "1. Sign up for a free account: https://dashboard.ngrok.com/signup"
echo "2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken"
echo ""
read -p "Enter your ngrok authtoken (or press Enter to skip): " AUTHTOKEN

if [ -n "$AUTHTOKEN" ]; then
  ngrok config add-authtoken "$AUTHTOKEN"
  if [ $? -eq 0 ]; then
    echo "✅ ngrok authentication configured!"
    echo ""
    echo "Now you can run: ./start-ngrok.sh"
  else
    echo "❌ Failed to configure ngrok. Please check your token."
  fi
else
  echo "⏭️  Skipped. You can set it up later with:"
  echo "   ngrok config add-authtoken <your-token>"
fi


