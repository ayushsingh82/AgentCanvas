'use client';

import React from 'react';

const faqs = [
  {
    q: 'What is Agent Canvas?',
    a: 'Agent Canvas is a visual agent builder where you can drag and drop modules and tools to shape your agents. Deploy in minutes without any coding—just a few clicks and you get features, deployment, and everything you need.'
  },
  {
    q: 'How does the drag-and-drop builder work?',
    a: 'Simply drag modules and tools onto the canvas, connect them visually, and adjust your agent. Our pipeline service in the backend automatically deploys each agent change, so you can iterate quickly without worrying about infrastructure.'
  },
  {
    q: 'Do I need to be a developer?',
    a: 'No coding required! Agent Canvas is designed for everyone. Just drag, drop, and deploy. You can create production-ready agents in minutes with just a few clicks.'
  },
  {
    q: 'What is Null Shot agent framework?',
    a: 'Agent Canvas is powered by the Null Shot agent framework, which provides the underlying infrastructure for building and deploying AI agents. This framework handles all the complex orchestration, routing, and execution behind the scenes.'
  },
  {
    q: 'How quickly can I deploy an agent?',
    a: 'You can deploy an agent in minutes! Just drag your modules onto the canvas, connect them, and click deploy. Our pipeline service handles the rest automatically.'
  },
];

export default function Landing() {
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  return (
    <div className="bg-white font-sans tracking-tight pt-40 pb-24">
      {/* MAIN CONTENT - BENTO GRID */}
      <div className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-12 gap-6 auto-rows-[180px]">
          {/* Why Agent Canvas */}
          <div className="col-span-12 md:col-span-6 row-span-2 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: '#FFD1B3' }}>
            <h2 className="text-xl font-black mb-4 text-white border-2 border-black px-3 py-2 rounded-lg inline-block" style={{ backgroundColor: '#FF6E1A' }}>Why Agent Canvas</h2>
            <p className="text-sm text-black leading-relaxed">
              Agent Canvas is a visual agent builder where you have modules and tools which you can directly drag and drop to shape your agents. 
              Adjust and deploy in minutes without needing any coding—just a few clicks and you get features, deployment, and everything you need.
            </p>
          </div>
          {/* Powered by Null Shot */}
          <div className="col-span-12 md:col-span-6 row-span-2 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: '#B2DBAF' }}>
            <h2 className="text-xl font-black mb-4 text-white border-2 border-black px-3 py-2 rounded-lg inline-block" style={{ backgroundColor: '#F67979' }}>Powered by Null Shot</h2>
            <p className="text-sm text-black mb-4 leading-relaxed">Agent Canvas uses the Null Shot agent framework and includes a pipeline service that runs in the backend to deploy each agent change:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center"><span className="w-2 h-2 rounded-full mr-3 bg-black"></span><span className="text-black font-semibold">Null Shot agent framework for powerful AI capabilities</span></li>
              <li className="flex items-center"><span className="w-2 h-2 rounded-full mr-3 bg-black"></span><span className="text-black font-semibold">Pipeline service automatically deploys agent changes</span></li>
              <li className="flex items-center"><span className="w-2 h-2 rounded-full mr-3 bg-black"></span><span className="text-black font-semibold">Drag-and-drop modules and tools for easy agent building</span></li>
              <li className="flex items-center"><span className="w-2 h-2 rounded-full mr-3 bg-black"></span><span className="text-black font-semibold">Deploy in minutes with just a few clicks</span></li>
            </ul>
          </div>
          {/* How It Works */}
          <div className="col-span-12 md:col-span-8 row-span-2 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: '#FFD1B3' }}>
            <h2 className="text-xl font-black mb-4 text-white border-2 border-black px-3 py-2 rounded-lg inline-block" style={{ backgroundColor: '#FF6E1A' }}>How It Works</h2>
            <p className="text-sm text-black mb-4 leading-relaxed">Create and deploy your agent in three simple steps:</p>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-lg font-extrabold text-black mr-3">1</span>
                <div>
                  <div className="font-bold text-black mb-1 text-sm">Drag and drop modules</div>
                  <div className="text-xs text-black">Start with our visual canvas. Drag modules and tools from the sidebar onto the canvas to shape your agent—no coding required.</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg font-extrabold text-black mr-3">2</span>
                <div>
                  <div className="font-bold text-black mb-1 text-sm">Connect and adjust</div>
                  <div className="text-xs text-black">Connect your modules visually and adjust settings. The canvas makes it easy to see how your agent flows and works.</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-lg font-extrabold text-black mr-3">3</span>
                <div>
                  <div className="font-bold text-black mb-1 text-sm">Deploy in minutes</div>
                  <div className="text-xs text-black">Click deploy and you're done! Our pipeline service automatically handles deployment. Get features, deployment, and everything you need with just a few clicks.</div>
                </div>
              </div>
            </div>
          </div>
          {/* The Future of Agents */}
          <div className="col-span-12 md:col-span-4 row-span-1 border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 rounded-2xl flex flex-col justify-center" style={{ backgroundColor: '#FFD1B3' }}>
            <h3 className="text-lg font-black mb-2 text-white border-2 border-black px-3 py-1 rounded-lg inline-block" style={{ backgroundColor: '#FF6E1A' }}>The Future of Agents</h3>
            <p className="text-black text-sm mt-2">
              Agent Canvas is building the next generation of AI agents—visual, composable, and production-ready from day one.
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
                const colors = ['#B2DBAF', '#FFD1B3', '#B2DBAF', '#FFD1B3', '#B2DBAF'];
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