'use client';

import { useAccount } from 'wagmi';

/**
 * Hook to get the connected wallet address
 * @returns {string | undefined} The wallet address or undefined if not connected
 */
export function useWalletAddress(): string | undefined {
  const { address, isConnected } = useAccount();
  return isConnected ? address : undefined;
}

