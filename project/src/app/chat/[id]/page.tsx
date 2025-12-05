'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useWalletAddress } from '@/hooks/use-wallet-address';
import { Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { WalletButton } from '@/components/wallet-button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const params = useParams();
  const agentId = params.id as string;
  const walletAddress = useWalletAddress();
  const [agent, setAgent] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch agent details
  useEffect(() => {
    async function fetchAgent() {
      if (!walletAddress || !agentId) return;

      try {
        setIsLoadingAgent(true);
        const response = await fetch(`/api/agents/${agentId}?walletAddress=${walletAddress}`);
        const data = await response.json();

        if (data.success && data.agent) {
          setAgent(data.agent);
        }
      } catch (error) {
        console.error('Error fetching agent:', error);
      } finally {
        setIsLoadingAgent(false);
      }
    }

    fetchAgent();
  }, [agentId, walletAddress]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const formatJSONResponse = (text: string): string => {
    try {
      // Try to parse as JSON
      const json = JSON.parse(text);
      return JSON.stringify(json, null, 2);
    } catch {
      // If not JSON, return as is
      return text;
    }
  };

  const isJSON = (text: string): boolean => {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agent?.agentChatURL || isLoading) return;

    const messageToSend = inputMessage.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${agent.agentChatURL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract text from response and remove thinking tags
      let content: string = data.text || data.message || '';
      
      // Remove thinking tags and their content
      content = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
      
      // If no text content, fall back to JSON formatting for structured data
      if (!content && (data.contractAddress || data.transactionHash || (data.success !== undefined && Object.keys(data).length > 3))) {
        content = JSON.stringify(data, null, 2);
      } else if (!content) {
        content = JSON.stringify(data, null, 2);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    // Prevent scroll
    e.target.scrollTop = 0;
  };

  if (isLoadingAgent) {
    return (
      <div className="h-screen bg-white font-sans tracking-tight flex items-center justify-center">
        <div className="text-black text-lg font-bold">Loading agent...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="h-screen bg-white font-sans tracking-tight flex items-center justify-center">
        <div className="text-black text-lg font-bold">Agent not found</div>
      </div>
    );
  }

  if (!agent.agentChatURL) {
    return (
      <div className="h-screen bg-white font-sans tracking-tight flex items-center justify-center">
        <div className="text-center">
          <div className="text-black text-lg font-bold mb-2">Agent not deployed</div>
          <div className="text-gray-500 text-sm">Please deploy the agent first</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white font-sans tracking-tight flex flex-col">
      {/* Top Bar with Bottom Border */}
      <div className="border-b-2 border-black px-6 py-4 flex items-center justify-between bg-white flex-shrink-0">
        <Link href="/" className="focus:outline-none">
          <button className="border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] px-6 py-2 rounded-lg cursor-pointer text-2xl font-black text-black leading-tight flex items-center gap-3" style={{ backgroundColor: '#FFD1B3' }}>
            <Image 
              src="/logo.png" 
              alt="Agent Canvas Logo" 
              width={60} 
              height={60}
              className="object-contain"
            />
            <div className="flex flex-col">
              <span>AGENT</span>
              <span>CANVAS</span>
            </div>
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/my-agents">
            <button className="border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-5 py-2 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-200" style={{ backgroundColor: '#FFD1B3' }}>
              Launch Agent
            </button>
          </Link>
          <WalletButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Agent Info */}
        <div className="w-80 border-r-2 border-black bg-white p-6 flex flex-col overflow-y-auto">
          {/* Agent Info */}
          <div className="mb-6">
            <h2 className="text-xl font-black text-black mb-2">{agent.name || 'Agent'}</h2>
            {agent.description && (
              <p className="text-sm text-gray-600 mb-4">{agent.description}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-black mb-2">Agent URL</label>
            <div className="border-2 border-black rounded-lg p-3 bg-gray-50 break-all">
              <p className="text-xs text-black font-mono">{agent.agentChatURL}</p>
            </div>
          </div>

          <div className="mt-auto">
            <div className="border-2 border-black rounded-lg p-3 bg-gray-50">
              <div className="text-xs text-black mb-1">
                <span className="font-bold">Status:</span> {agent.status || 'unknown'}
              </div>
              {agent.modules && agent.modules.length > 0 && (
                <div className="text-xs text-black mt-2">
                  <span className="font-bold">Modules:</span> {agent.modules.length}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-sm">Start a conversation with your agent</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-black border-2 border-black'
                }`}
              >
                {message.role === 'assistant' && isJSON(message.content) ? (
                  <div className="bg-white p-3 rounded border border-gray-300">
                    <pre className="text-xs whitespace-pre-wrap font-mono text-black overflow-x-auto">
                      {formatJSONResponse(message.content)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-black border-2 border-black rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t-2 border-black p-4 bg-white">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <textarea
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 border-2 border-black px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400 resize-none overflow-hidden"
              style={{ minHeight: '44px', maxHeight: '120px', height: '44px', overflowY: 'hidden' }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-6 py-2.5 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex items-center justify-center"
              style={{ backgroundColor: '#FFD1B3', height: '44px' }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
