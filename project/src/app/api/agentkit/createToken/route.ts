import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

/**
 * POST /api/agentkit/createToken
 * Creates an ERC20 token using ethers.js directly
 * Note: Using ethers.js instead of AgentKit due to dependency compatibility issues
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenName, tokenSymbol, totalSupply, decimals = 18, network = 'base-sepolia' } = body;

    // Validate required parameters
    if (!tokenName || !tokenSymbol || !totalSupply || !network) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: tokenName, tokenSymbol, totalSupply, and network are required',
        },
        { status: 400 }
      );
    }

    // Get wallet private key from environment variables
    // Note: This should be a wallet private key (64 hex chars), NOT the CDP_API_KEY_PRIVATE_KEY
    // CDP_API_KEY_PRIVATE_KEY is for API authentication, not blockchain transactions
    const walletPrivateKey = process.env.WALLET_PRIVATE_KEY || process.env.CDP_WALLET_PRIVATE_KEY;
    const agentKitNetwork = network || process.env.CDP_AGENT_KIT_NETWORK || 'base-sepolia';

    if (!walletPrivateKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'WALLET_PRIVATE_KEY or CDP_WALLET_PRIVATE_KEY must be set in environment variables. This should be a wallet private key (64 hex characters), not the CDP API key secret.',
          hint: 'Generate a wallet private key using: ethers.Wallet.createRandom().privateKey',
        },
        { status: 500 }
      );
    }

    // Validate that it's a valid private key format (64 hex chars, optionally prefixed with 0x)
    const privateKeyRegex = /^(0x)?[0-9a-fA-F]{64}$/;
    if (!privateKeyRegex.test(walletPrivateKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid private key format. Private key must be 64 hex characters (optionally prefixed with 0x)',
          received: walletPrivateKey.substring(0, 20) + '...',
        },
        { status: 400 }
      );
    }

    // Get RPC URL based on network
    const rpcUrls: Record<string, string> = {
      'base-sepolia': 'https://sepolia.base.org',
      'base-mainnet': 'https://mainnet.base.org',
      'ethereum': process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
    };

    const rpcUrl = rpcUrls[agentKitNetwork] || rpcUrls['base-sepolia'];
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    // Ensure private key has 0x prefix if not present
    const formattedPrivateKey = walletPrivateKey.startsWith('0x') ? walletPrivateKey : `0x${walletPrivateKey}`;
    const wallet = new ethers.Wallet(formattedPrivateKey, provider);

    // Token Factory Contract Address on Base Sepolia
    const TOKEN_FACTORY_ADDRESS = process.env.TOKEN_FACTORY_ADDRESS || '0xb88c0e115AFBD252B92CC31Ac6b52f83d24F7448';
    
    // Token Factory ABI - from deployed contract
    const factoryABI = [
      {
        "inputs": [
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "symbol", "type": "string" },
          { "internalType": "uint256", "name": "totalSupply", "type": "uint256" },
          { "internalType": "uint8", "name": "decimals", "type": "uint8" }
        ],
        "name": "createToken",
        "outputs": [
          { "internalType": "address", "name": "tokenAddress", "type": "address" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          { "indexed": true, "internalType": "address", "name": "tokenAddress", "type": "address" },
          { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
          { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
          { "indexed": false, "internalType": "string", "name": "symbol", "type": "string" },
          { "indexed": false, "internalType": "uint256", "name": "totalSupply", "type": "uint256" },
          { "indexed": false, "internalType": "uint8", "name": "decimals", "type": "uint8" }
        ],
        "name": "TokenCreated",
        "type": "event"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "creator", "type": "address" }
        ],
        "name": "getAllTokens",
        "outputs": [
          { "internalType": "address[]", "name": "tokens", "type": "address[]" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "creator", "type": "address" },
          { "internalType": "uint256", "name": "index", "type": "uint256" }
        ],
        "name": "getToken",
        "outputs": [
          { "internalType": "address", "name": "tokenAddress", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "creator", "type": "address" }
        ],
        "name": "getTokenCount",
        "outputs": [
          { "internalType": "uint256", "name": "count", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    // Connect to the deployed factory contract
    const factoryContract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, factoryABI, wallet);
    
    // Convert totalSupply to wei (with decimals)
    const totalSupplyWei = ethers.parseUnits(totalSupply, decimals);
    
    // Call the factory to create the token
    // The function returns the token address directly
    const tx = await factoryContract.createToken(
      tokenName,
      tokenSymbol,
      totalSupplyWei,
      decimals
    );
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    // Get the token address - try multiple methods
    let contractAddress: string | null = null;
    
    // Method 1: Try to get it from the return value (if the transaction was called with callStatic)
    // Since we used send(), we need to get it from events or by querying
    
    // Method 2: Parse TokenCreated event from receipt
    if (receipt.logs && receipt.logs.length > 0) {
      try {
        const factoryInterface = new ethers.Interface(factoryABI);
        for (const log of receipt.logs) {
          try {
            const parsed = factoryInterface.parseLog(log);
            if (parsed && parsed.name === 'TokenCreated' && parsed.args && parsed.args.tokenAddress) {
              contractAddress = parsed.args.tokenAddress;
              break;
            }
          } catch (e) {
            // Not the event we're looking for, continue
          }
        }
      } catch (e) {
        console.warn('Error parsing events:', e);
      }
    }
    
    // Method 3: If event parsing failed, query the factory contract
    if (!contractAddress) {
      try {
        const tokenCount = await factoryContract.getTokenCount(wallet.address);
        if (tokenCount > 0n) {
          // Get the most recent token (last index)
          contractAddress = await factoryContract.getToken(wallet.address, tokenCount - 1n);
        }
      } catch (e) {
        console.warn('Could not retrieve token address from factory:', e);
      }
    }
    
    const txHash = receipt.hash;

    // If we still don't have the address, return what we have
    if (!contractAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token created but could not retrieve token address. Transaction was successful.',
          transactionHash: txHash,
          hint: 'Check the factory contract events or use getTokenCount/getToken methods to retrieve the token address',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      contractAddress: contractAddress,
      transactionHash: txHash,
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      totalSupply: totalSupply,
      decimals: decimals,
      network: agentKitNetwork,
      message: `Token ${tokenSymbol} (${tokenName}) successfully created via factory on ${agentKitNetwork}`,
    });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating token',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

