'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from './wallet-button';

export function Header() {
  const pathname = usePathname();
  const isAgentBuilder = pathname === '/agent-builder';
  const isChatPage = pathname?.startsWith('/chat/');

  if (isAgentBuilder || isChatPage) {
    return null;
  }

  return (
    <header className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-8">
      <div>
        <Link href="/" className="focus:outline-none">
          <button className="border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] px-6 py-4 rounded-lg cursor-pointer text-2xl font-black text-black leading-tight" style={{ backgroundColor: '#FFD1B3' }}>
            <div className="flex flex-col">
              <span>AGENT</span>
              <span>CANVAS</span>
            </div>
          </button>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/my-agents">
          <button className="border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-5 py-2 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200" style={{ backgroundColor: '#FFD1B3' }}>
            Launch Agent
          </button>
        </Link>
        <WalletButton />
      </div>
    </header>
  );
}

