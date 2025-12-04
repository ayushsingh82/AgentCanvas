'use client';

import { usePathname } from 'next/navigation';

export function ConditionalFooter() {
  const pathname = usePathname();
  const isAgentBuilder = pathname === '/agent-builder';

  if (isAgentBuilder) {
    return null;
  }

  return (
    <footer className="border-t-2 border-black px-10 py-6 flex items-center justify-between text-base text-black" style={{ margin: 0 }}>
      <span className="font-black text-lg tracking-tight">AGENT CANVAS</span>
      <div className="flex items-center gap-5 pr-2">
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity"
          aria-label="Twitter"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity"
          aria-label="GitHub"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0C5.372 0 0 5.373 0 12.004c0 5.304 3.438 9.8 8.205 11.387.6.111.82-.261.82-.58 0-.287-.011-1.244-.017-2.255-3.338.726-4.042-1.61-4.042-1.61-.546-1.389-1.333-1.758-1.333-1.758-1.089-.746.083-.73.083-.73 1.205.085 1.84 1.239 1.84 1.239 1.07 1.834 2.809 1.304 3.492.997.108-.776.418-1.305.762-1.605-2.665-.304-5.467-1.334-5.467-5.932 0-1.31.468-2.381 1.236-3.22-.124-.303-.536-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.45 11.45 0 0 1 3.004-.404c1.018.005 2.045.138 3.004.404 2.291-1.553 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.77.839 1.234 1.91 1.234 3.22 0 4.61-2.807 5.625-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.901-.015 3.293 0 .322.216.697.825.578C20.565 21.8 24 17.306 24 12.004 24 5.373 18.627 0 12 0z" />
          </svg>
        </a>
      </div>
    </footer>
  );
}

