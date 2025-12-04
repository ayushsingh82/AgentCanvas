import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

/**
 * POST /api/agentkit/makeTransaction
 * Executes a blockchain transaction (native token or ERC20 transfer)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, amount, network = 'base-sepolia', tokenAddress } = body;

    // Validate required parameters
    if (!to || !amount || !network) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: to, amount, and network are required',
        },
        { status: 400 }
      );
    }

    // Validate address format
    if (!ethers.isAddress(to)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid recipient address format',
        },
        { status: 400 }
      );
    }

    // Get wallet private key from environment variables
    const walletPrivateKey = process.env.WALLET_PRIVATE_KEY || process.env.CDP_WALLET_PRIVATE_KEY;
    const agentKitNetwork = network || process.env.CDP_AGENT_KIT_NETWORK || 'base-sepolia';

    if (!walletPrivateKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'WALLET_PRIVATE_KEY must be set in environment variables',
        },
        { status: 500 }
      );
    }

    // Validate private key format
    const privateKeyRegex = /^(0x)?[0-9a-fA-F]{64}$/;
    if (!privateKeyRegex.test(walletPrivateKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid private key format',
        },
        { status: 400 }
      );
    }

    // Get RPC URL based on network
    const rpcUrls: Record<string, string> = {
      'base-sepolia': 'https://sepolia.base.org',
      'base-mainnet': 'https://mainnet.base.org',
      'ethereum': process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      'polygon': process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
    };

    const rpcUrl = rpcUrls[agentKitNetwork];
    if (!rpcUrl) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported network: ${agentKitNetwork}`,
        },
        { status: 400 }
      );
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(walletPrivateKey, provider);

    let transactionHash: string;
    let receipt: ethers.TransactionReceipt | null;

    if (tokenAddress) {
      // ERC20 token transfer
      if (!ethers.isAddress(tokenAddress)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid token address format',
          },
          { status: 400 }
        );
      }

      // ERC20 Transfer ABI
      const erc20Abi = [
        'function transfer(address to, uint256 amount) external returns (bool)',
      ];

      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
      const amountWei = ethers.parseUnits(amount.toString(), 18); // Assuming 18 decimals

      const tx = await tokenContract.transfer(to, amountWei);
      transactionHash = tx.hash;
      receipt = await tx.wait();
    } else {
      // Native token transfer
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await wallet.sendTransaction({
        to,
        value: amountWei,
      });
      transactionHash = tx.hash;
      receipt = await tx.wait();
    }

    if (!receipt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction sent but receipt not available',
          transactionHash,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionHash,
      blockNumber: receipt.blockNumber,
      from: wallet.address,
      to,
      amount,
      network: agentKitNetwork,
      tokenAddress: tokenAddress || null,
      message: tokenAddress
        ? `Successfully transferred ${amount} tokens to ${to}`
        : `Successfully transferred ${amount} native tokens to ${to}`,
    });
  } catch (error) {
    console.error('Error making transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error making transaction',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


