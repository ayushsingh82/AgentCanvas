'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import { useWalletAddress } from '@/hooks/use-wallet-address';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: any[];
}

type DeploymentStep = 'keys' | 'details' | 'summary' | 'deploying' | 'success';

export function DeployModal({ isOpen, onClose, nodes }: DeployModalProps) {
  const router = useRouter();
  const walletAddress = useWalletAddress();
  const [step, setStep] = useState<DeploymentStep>('keys');
  const [agentName, setAgentName] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [cloudflareAccountId, setCloudflareAccountId] = useState('');
  const [cloudflareApiToken, setCloudflareApiToken] = useState('');
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentChatUrl, setAgentChatUrl] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  // Map node types to module names
  function getModuleName(nodeType: string): string {
    // All onchain actions currently map to tokenFactory
    // This will be expanded when more modules are added
    if (nodeType.startsWith('mint_') || nodeType.startsWith('transfer_') || nodeType.startsWith('create_')) {
      return 'tokenFactory';
    }
    // For now, all other types also map to tokenFactory
    return 'tokenFactory';
  }

  // Get selected modules from nodes (exclude agent node)
  const selectedModules = nodes
    .filter(node => node.type !== 'agent' && node.type && !node.type.includes('add_more'))
    .map(node => ({
      moduleName: getModuleName(node.type),
      input: {},
      order: 0,
    }));

  // Get unique modules (deduplicate)
  const uniqueModules = Array.from(
    new Map(selectedModules.map(m => [m.moduleName, m])).values()
  );

  // Reset modal when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('keys');
      setAgentName('');
      setAnthropicKey('');
      setCloudflareAccountId('');
      setCloudflareApiToken('');
      setDeploymentStatus('');
      setAgentId(null);
      setAgentChatUrl(null);
      setIsDeploying(false);
    }
  }, [isOpen]);

  // Poll deployment status
  useEffect(() => {
    if (step === 'deploying' && agentId) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/agents/${agentId}?walletAddress=${walletAddress}`);
          const data = await response.json();
          
          if (data.success && data.agent) {
            if (data.agent.status === 'deployed' && data.agent.agentChatURL) {
              setAgentChatUrl(data.agent.agentChatURL);
              setStep('success');
              setIsDeploying(false);
              clearInterval(pollInterval);
              
              // Trigger confetti
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              });
              
              // Navigate after 2 seconds
              setTimeout(() => {
                router.push(`/chat/${agentId}`);
              }, 2000);
            } else {
              setDeploymentStatus(data.agent.status || 'deploying');
            }
          }
        } catch (error) {
          console.error('Error polling deployment status:', error);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }
  }, [step, agentId, walletAddress, router]);

  const handleNext = () => {
    if (step === 'keys') {
      if (!anthropicKey || !cloudflareAccountId || !cloudflareApiToken) {
        alert('Please fill in all API keys');
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!agentName.trim()) {
        alert('Please enter an agent name');
        return;
      }
      if (uniqueModules.length === 0) {
        alert('Please add at least one module to the canvas');
        return;
      }
      setStep('summary');
    }
  };

  const handleDeploy = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet');
      return;
    }

    setIsDeploying(true);
    setStep('deploying');

    try {
      // Step 1: Create agent
      const createResponse = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          name: agentName,
          description: `Agent with ${selectedModules.length} module(s)`,
          modules: uniqueModules,
          apiKeys: {
            llmKey: anthropicKey,
            cloudflareKey: cloudflareApiToken,
            cloudflareAccountId: cloudflareAccountId,
          },
        }),
      });

      const createData = await createResponse.json();
      
      if (!createData.success || !createData.agent) {
        throw new Error(createData.error || 'Failed to create agent');
      }

      const newAgentId = createData.agent.id;
      setAgentId(newAgentId);

      // Step 2: Deploy agent
      const deployResponse = await fetch(`/api/agents/${newAgentId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
        }),
      });

      const deployData = await deployResponse.json();
      
      if (!deployData.success) {
        throw new Error(deployData.error || 'Failed to deploy agent');
      }

      setDeploymentStatus('deploying');
      // Polling will handle the rest
    } catch (error) {
      console.error('Deployment error:', error);
      alert(error instanceof Error ? error.message : 'Failed to deploy agent');
      setIsDeploying(false);
      setStep('summary');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black">
              {step === 'keys' && 'Step 1: Set API Keys'}
              {step === 'details' && 'Step 2: Agent Details'}
              {step === 'summary' && 'Step 3: Summary & Deployment'}
              {step === 'deploying' && 'Deploying Agent...'}
              {step === 'success' && 'Deployment Success!'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-5 w-5 text-black" />
            </button>
          </div>

          {/* Step 1: API Keys */}
          {step === 'keys' && (
            <div className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Anthropic API Key
                  </label>
                  <input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full border-2 border-black px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Cloudflare Account ID
                  </label>
                  <input
                    type="text"
                    value={cloudflareAccountId}
                    onChange={(e) => setCloudflareAccountId(e.target.value)}
                    placeholder="Your Cloudflare Account ID"
                    className="w-full border-2 border-black px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Cloudflare API Token
                  </label>
                  <input
                    type="password"
                    value={cloudflareApiToken}
                    onChange={(e) => setCloudflareApiToken(e.target.value)}
                    placeholder="Your Cloudflare API Token"
                    className="w-full border-2 border-black px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-6 py-3 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-6 py-3 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                  style={{ backgroundColor: '#FFD1B3' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Agent Details */}
          {step === 'details' && (
            <div className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="My Agent"
                    className="w-full border-2 border-black px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Selected Modules ({selectedModules.length})
                  </label>
                  <div className="border-2 border-black rounded-lg p-4 bg-gray-50">
                    {uniqueModules.length > 0 ? (
                      <ul className="space-y-2">
                        {uniqueModules.map((module, idx) => (
                          <li key={idx} className="text-sm text-black">
                            • {module.moduleName}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No modules selected. Add modules to the canvas.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('keys')}
                  className="flex-1 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-6 py-3 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 bg-white"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-6 py-3 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                  style={{ backgroundColor: '#FFD1B3' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 'summary' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-black mb-4">Step 3: Summary & Deployment</h2>
              
              <div className="space-y-4 border-2 border-black rounded-lg p-4 bg-gray-50">
                <div>
                  <span className="font-bold text-black">Agent Name:</span>
                  <span className="ml-2 text-black">{agentName}</span>
                </div>
                <div>
                  <span className="font-bold text-black">Modules:</span>
                  <span className="ml-2 text-black">{uniqueModules.length} module(s)</span>
                </div>
                <div>
                  <span className="font-bold text-black">API Keys:</span>
                  <span className="ml-2 text-green-600">✓ Configured</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-6 py-3 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 bg-white"
                >
                  Back
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="flex-1 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-6 py-3 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#FFD1B3' }}
                >
                  Deploy Agent
                </button>
              </div>
            </div>
          )}

          {/* Deploying */}
          {step === 'deploying' && (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-black text-black mb-4">Deploying Agent...</h2>
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent mx-auto"></div>
                <p className="text-black">{deploymentStatus || 'Initializing deployment...'}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500 w-16 h-16 flex items-center justify-center">
                  <Check className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-black mb-4">Agent Deployed Successfully!</h2>
              {agentChatUrl && (
                <div className="border-2 border-black rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-black mb-2">Agent Chat URL:</p>
                  <p className="text-xs text-gray-600 break-all">{agentChatUrl}</p>
                </div>
              )}
              <p className="text-black">Redirecting to chat...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

