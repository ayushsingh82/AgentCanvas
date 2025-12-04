#!/bin/bash
# Test script - run this after restarting wrangler dev

echo "Testing agent..."
curl -X POST http://localhost:8787/agent/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Create a new ERC20 token named TestToken with symbol TST, total supply of 1000000, and 18 decimals on base-sepolia network"
  }' | jq '.'

echo ""
echo "Check wrangler dev logs for:"
echo "- [TOOL EXECUTION] messages (means tools are being called)"
echo "- Any errors about tool format"
