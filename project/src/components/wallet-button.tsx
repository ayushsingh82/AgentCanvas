'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function WalletButton() {
  const { address, isConnected } = useAccount();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-5 py-2 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-red-500 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-5 py-2 rounded-lg text-sm font-bold text-white hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className="bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-5 py-2 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200"
                >
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

