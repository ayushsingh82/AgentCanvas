'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWalletAddress } from '@/hooks/use-wallet-address';

interface Agent {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  walletAddress: string;
  agentChatURL?: string;
  status: 'draft' | 'deployed' | 'archived';
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
  modules: Array<{
    moduleName: string;
    input: Record<string, any>;
    order?: number;
  }>;
}

export default function MyAgentsPage() {
  const walletAddress = useWalletAddress();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/agents?walletAddress=${walletAddress}`);
        const data = await response.json();

        if (data.success && data.agents) {
          setAgents(data.agents);
        } else {
          setError(data.error || 'Failed to fetch agents');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch agents');
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();
  }, [walletAddress]);

  // If no wallet connected
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-white font-sans tracking-tight flex items-center justify-center px-4 pt-40">
        <div className="max-w-md w-full rounded-2xl p-8 text-center border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]" style={{ backgroundColor: '#FFD1B3' }}>
          <h1 className="text-2xl font-black mb-3 text-black">Connect Wallet</h1>
          <p className="text-sm text-black mb-8">
            Please connect your wallet to view your agents.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white font-sans tracking-tight flex items-center justify-center px-4 pt-40">
        <div className="text-black text-lg font-bold">Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white font-sans tracking-tight flex items-center justify-center px-4 pt-40">
        <div className="max-w-md w-full rounded-2xl p-8 text-center border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]" style={{ backgroundColor: '#FFD1B3' }}>
          <h1 className="text-2xl font-black mb-3 text-black">Error</h1>
          <p className="text-sm text-black mb-8">{error}</p>
        </div>
      </div>
    );
  }

  // No agents - centered
  if (agents.length === 0) {
    return (
      <div className="min-h-screen bg-white font-sans tracking-tight flex items-center justify-center px-4 pt-40">
        <div className="max-w-md w-full rounded-2xl p-8 text-center border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]" style={{ backgroundColor: '#FFD1B3' }}>
          <h1 className="text-2xl font-black mb-3 text-black">No agents yet</h1>
          <p className="text-sm text-black mb-2">
            You haven&apos;t created any agents.
          </p>
          <p className="text-sm text-black mb-8">
            Create your first agent with nutshell tech and start building flows in minutes.
          </p>
          <Link href="/agent-builder">
            <button className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] px-8 py-3 rounded-lg text-sm font-bold text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px]">
              Create your first agent
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Has agents - split layout
  return (
    <div className="bg-white font-sans tracking-tight px-4 pt-40 pb-24 min-h-screen flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Create Agent */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl p-8 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col justify-center sticky top-32" style={{ backgroundColor: '#FFD1B3' }}>
              <h2 className="text-2xl font-black mb-4 text-black">Create an Agent</h2>
              <p className="text-sm text-black mb-6">
                Build a new AI agent with drag-and-drop tools and modules. Design your agent visually and deploy it in minutes.
              </p>
              <Link href="/agent-builder">
                <button className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] px-8 py-3 rounded-lg text-sm font-bold text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] w-full">
                  Create New Agent
                </button>
              </Link>
            </div>
          </div>

          {/* Right side - Agent List */}
          <div className="order-1 lg:order-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-black mb-4">Your Agents</h2>
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ backgroundColor: '#FFD1B3' }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-black mb-1 break-words">{agent.name}</h3>
                    {agent.description && (
                      <p className="text-sm text-black opacity-80 mb-2 break-words">{agent.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded border border-black whitespace-nowrap ${
                          agent.status === 'deployed'
                            ? 'bg-green-200 text-black'
                            : agent.status === 'draft'
                            ? 'bg-yellow-200 text-black'
                            : 'bg-gray-200 text-black'
                        }`}
                      >
                        {agent.status}
                      </span>
                      {agent.modules && agent.modules.length > 0 && (
                        <span className="text-xs text-black opacity-60 whitespace-nowrap">
                          {agent.modules.length} module{agent.modules.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {agent.agentChatURL ? (
                      <Link href={`/chat/${agent.id}`}>
                        <button className="bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-6 py-2 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200 whitespace-nowrap">
                          Chat
                        </button>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-200 border-2 border-black px-6 py-2 rounded-lg text-sm font-bold text-black opacity-50 cursor-not-allowed whitespace-nowrap"
                      >
                        Not Deployed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
