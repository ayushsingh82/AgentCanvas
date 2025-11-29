'use client';

import Link from 'next/link';
import React from 'react';

const faqs = [
  {
    q: 'What is D&D?',
    a: 'D&D is a drag-and-drop AI agent builder that lets you design, connect, and launch powerful agents visually—no complex setup required.'
  },
  {
    q: 'How does the drag-and-drop builder work?',
    a: 'You create agents by snapping together building blocks like data sources, tools, memory, and actions. D&D handles orchestration, routing, and execution behind the scenes.'
  },
  {
    q: 'Do I need to be a developer?',
    a: 'No. D&D is built for both builders and developers. You can ship production-ready agents with a visual canvas, and add custom logic only where you need it.'
  },
  {
    q: 'Can I deploy my agents anywhere?',
    a: 'Yes. Agents created in D&D can be deployed to your app, website, workflows, or internal tools with simple embeds and APIs.'
  },
];

export default function Landing() {
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  return (
    <div className="bg-white">

      {/* HERO */}
      <div className="relative pt-24 pb-8 px-4 mb-8">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-5xl border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-[50%] flex items-center justify-center py-8 px-8" style={{ aspectRatio: '2/1', backgroundColor: '#FFD1B3' }}>
            <div className="text-center">
              <p className="text-sm font-black mb-8 text-white border-2 border-black px-3 py-2 rounded-lg inline-block" style={{ backgroundColor: '#FF6E1A' }}>Build AI agents in minutes, not weeks</p>
              <h3 className="text-5xl font-bold font-black text-black italic mb-2">
                Drag-and-Drop
              </h3>
              <h2 className="text-5xl font-black mb-2 text-white border-2 border-black px-3 py-2 rounded-lg inline-block italic" style={{ backgroundColor: '#FF6E1A' }}>Agent Builder by D&amp;D</h2>
            </div>
          </div>
        </div>
      </div>


      <div className="text-center mb-6 flex flex-col md:flex-row items-center justify-center gap-6">
        <Link href="/">
          <button className="border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] px-8 py-4 rounded-lg text-lg font-bold text-white hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px]" style={{ backgroundColor: '#FF6E1A' }}>
            Subscribe
          </button>
        </Link>

        <Link href="/my-agents">
          <button className="border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] px-8 py-4 rounded-lg text-lg font-bold text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px]" style={{ backgroundColor: '#FFD1B3' }}>
            Launch Agent
          </button>
        </Link>
      </div>

      {/* MAIN CONTENT - BENTO GRID */}
      <div className="max-w-5xl mx-auto px-4 pb-24 mt-16">
        <div className="grid grid-cols-12 gap-6 auto-rows-[180px]">
          {/* Why D&D Agent Builder */}
          <div className="col-span-12 md:col-span-6 row-span-2 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: '#FFD1B3' }}>
            <h2 className="text-xl font-black mb-4 text-white border-2 border-black px-3 py-2 rounded-lg inline-block" style={{ backgroundColor: '#FF6E1A' }}>Why D&amp;D Agent Builder</h2>
            <p className="text-sm text-black leading-relaxed">
              D&amp;D turns complex AI agent architectures into a simple visual canvas. Drag blocks, connect flows, and ship production-ready agents
              without wrestling with infrastructure, orchestration, or boilerplate code.
            </p>
          </div>
          {/* Powered by Advanced Tech */}
          <div className="col-span-12 md:col-span-6 row-span-2 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: '#B2DBAF' }}>
            <h2 className="text-xl font-black mb-4 text-white border-2 border-black px-3 py-2 rounded-lg inline-block" style={{ backgroundColor: '#F67979' }}>Powered by Advanced Tech</h2>
            <p className="text-sm text-black mb-4 leading-relaxed">Under the hood, D&amp;D gives you serious power with simple building blocks:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center"><span className="w-2 h-2 rounded-full mr-3 bg-black"></span><span className="text-black font-semibold">Visual canvas for flows, tools, and memory</span></li>
              <li className="flex items-center"><span className="w-2 h-2 rounded-full mr-3 bg-black"></span><span className="text-black font-semibold">Built-in orchestration, retries, and routing</span></li>
              <li className="flex items-center"><span className="w-2 h-2 rounded-full mr-3 bg-black"></span><span className="text-black font-semibold">Connect APIs, databases, and webhooks easily</span></li>
              <li className="flex items-center"><span className="w-2 h-2 rounded-full mr-3 bg-black"></span><span className="text-black font-semibold">Ship agents to production with a single deploy</span></li>
            </ul>
          </div>
          {/* How It Works */}
          <div className="col-span-12 md:col-span-8 row-span-2 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: '#FFD1B3' }}>
            <h2 className="text-xl font-black mb-4 text-white border-2 border-black px-3 py-2 rounded-lg inline-block" style={{ backgroundColor: '#FF6E1A' }}>How It Works</h2>
            <p className="text-sm text-black mb-4 leading-relaxed">In a nutshell, you go from idea to live agent in three steps:</p>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-lg font-extrabold text-black mr-3">1</span>
                <div>
                  <div className="font-bold text-black mb-1 text-sm">Design your agent visually</div>
                  <div className="text-xs text-black">Drag blocks for input, tools, memory, and outputs. Connect them like a flowchart—no complex configs.</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg font-extrabold text-black mr-3">2</span>
                <div>
                  <div className="font-bold text-black mb-1 text-sm">Plug into your stack</div>
                  <div className="text-xs text-black">Connect APIs, databases, webhooks, and third-party tools so your agents can actually get things done.</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg font-extrabold text-black mr-3">3</span>
                <div>
                  <div className="font-bold text-black mb-1 text-sm">Launch & iterate fast</div>
                  <div className="text-xs text-black">Publish your agent with one click, monitor runs, and refine the flow without redeploying your whole app.</div>
                </div>
              </div>
            </div>
          </div>
          {/* The Future of Agents */}
          <div className="col-span-12 md:col-span-4 row-span-1 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: '#FFD1B3' }}>
            <h3 className="text-lg font-black mb-2 text-white border-2 border-black px-3 py-1 rounded-lg inline-block" style={{ backgroundColor: '#FF6E1A' }}>The Future of Agents</h3>
            <p className="text-black text-sm mt-2">
              D&amp;D is building the next generation of AI agents—composable, visual, and production-ready from day one.
            </p>
          </div>
          {/* Enterprise-Grade Reliability */}
          <div className="col-span-12 md:col-span-4 row-span-1 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: '#B2DBAF' }}>
            <h4 className="text-lg font-bold text-white border-2 border-black px-3 py-1 rounded-lg inline-block" style={{ backgroundColor: '#F67979' }}>Enterprise-Grade Reliability</h4>
            <p className="text-black text-sm mt-2">
              Built-in observability, versioning, and safe deploys so your agents behave predictably in real products and workflows.
            </p>
          </div>
        </div>

        {/* FAQ SECTION */}
        <section className="relative z-10 px-4 py-16 border-t border-black mt-12 mb-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl text-black font-black mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => {
                // Alternate between green and orange/peach colors
                const colors = ['#B2DBAF', '#FFD1B3', '#B2DBAF', '#FFD1B3'];
                const bgColor = colors[index] || '#B2DBAF';
                
                return (
                  <div key={index} className="border-2 border-black rounded-2xl overflow-hidden" style={{ backgroundColor: bgColor }}>
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between text-black hover:bg-gray-100 transition-all duration-300 focus:outline-none"
                      style={{ backgroundColor: expandedFaq === index ? 'transparent' : bgColor }}
                    >
                      <span className="font-medium text-lg">{faq.q}</span>
                      <span className="text-2xl">{expandedFaq === index ? '−' : '+'}</span>
                    </button>
                    {expandedFaq === index && (
                      <div className="px-6 pb-6 text-black animate-fade-in" style={{ backgroundColor: bgColor }}>{faq.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}