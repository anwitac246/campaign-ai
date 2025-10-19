'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Layers, Layout, Upload, Download, Menu, X, ArrowRight } from 'lucide-react';
import Navbar from './navbar';

export default function CampaignAI() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const steps = [
    { title: 'Upload Your Marketing Brief', desc: 'Tell the AI your product, audience, and goal — it takes care of the rest.', icon: <Upload />, color: 'bg-blue-400' },
    { title: 'AI Generates Your Campaign', desc: 'Strategy, visuals, copy, influencer outreach, and posting plan — all crafted intelligently.', icon: <Sparkles />, color: 'bg-blue-500' },
    { title: 'Review & Customize', desc: 'Interactive dashboard lets you tweak images, captions, and schedules — the AI adapts instantly.', icon: <Layout />, color: 'bg-blue-600' },
  ];

  const leftFeatures = [
    {
      icon: <Sparkles className="w-10 h-10" />,
      title: 'Smart Strategy Generation',
      desc: 'AI understands your brief and creates a complete campaign concept tailored for your target audience.',
      color: 'from-blue-100 to-blue-200',
      borderColor: '#3B82F6'
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: 'Multi-Step Campaign Automation',
      desc: 'Copywriting, visual creation, influencer research, and media planning — everything happens automatically.',
      color: 'from-slate-100 to-slate-200',
      borderColor: '#64748B'
    }
  ];

  const rightFeatures = [
    {
      icon: <Layers className="w-10 h-10" />,
      title: 'AI Moodboard That Evolves',
      desc: 'Drag, drop, and tweak images, colors, and notes — watch AI generate visuals and copy aligned to your brand vibe.',
      color: 'from-blue-200 to-blue-300',
      borderColor: '#2563EB'
    },
    {
      icon: <Layout className="w-10 h-10" />,
      title: 'Interactive Campaign Canvas',
      desc: 'Review, edit, regenerate, and export your campaign in one intuitive dashboard.',
      color: 'from-slate-200 to-slate-300',
      borderColor: '#475569'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar/>

      {/* Hero Section */}
      <section id="about" className="pt-32 pb-20 px-6 relative z-0 ">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-6xl md:text-6xl font-bold mb-6 text-blue-600 leading-tight">
                About Relatus.AI with AI and Productivity
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Wherever you are should not be a factor in what you do. Brilliant well-being and productivity at one time will change the way the world works.
              </p>
              <a href="/chatbot">
                <button className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 text-xl shadow-lg">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
              </a>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden">
                <img
                  src="/hero.jpg"
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section id="mission" className="py-20 px-6 relative z-0 bg-slate-50">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(100, 100, 120, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100, 100, 120, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        ></div>

        <div className="relative max-w-5xl mx-auto grid md:grid-cols-2 gap-12 z-10">
          <div
            className="relative bg-white rounded-3xl p-8 overflow-hidden shadow-lg"
            style={{
              borderTop: '3px solid #1E293B',
              borderLeft: '3px solid #1E293B',
              borderRight: '10px solid #3B82F6',
              borderBottom: '10px solid #64748B',
            }}
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900 text-center">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed text-center">
              At CampaignAI, we provide tailored AI wellness and productivity solutions to boost efficiency, drive innovation, and support growth. We help individuals and businesses optimize their routines for lasting success.
            </p>
          </div>

          <div
            className="relative bg-white rounded-3xl p-8 overflow-hidden shadow-lg"
            style={{
              borderTop: '3px solid #1E293B',
              borderLeft: '3px solid #1E293B',
              borderRight: '10px solid #3B82F6',
              borderBottom: '10px solid #64748B',
            }}
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900 text-center">Our Value</h2>
            <p className="text-gray-700 leading-relaxed text-center">
              CampaignAI sets the global standard in AI-driven wellness and productivity solutions, empowering organizations worldwide through innovative technologies and strategies. Join us to approach wellness and productivity.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">Key Features</h2>
            <p className="text-xl text-gray-600">Everything you need to launch campaigns faster</p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...leftFeatures, ...rightFeatures].map((feature, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-2xl border-4 transition-all hover:-translate-y-1 hover:shadow-xl min-h-[300px] flex flex-col justify-between"
                  style={{ borderColor: feature.borderColor }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-gray-900 mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-50 to-slate-50 overflow-x-auto">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-4 text-gray-900">How It Works</h2>
          <p className="text-xl text-gray-600 mb-16">Four simple steps to campaign success</p>

          <div className="flex items-center gap-4 justify-center min-w-max">

            <div className="flex flex-col items-center">
              <div className="px-8 py-3 rounded-full border-4 border-blue-600 bg-white flex items-center justify-center shadow-sm font-semibold text-gray-900">
                Start
              </div>
            </div>

            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <ArrowRight className="w-8 h-8 text-gray-400" />

                <div className="flex flex-col items-center max-w-[220px] text-center">
                  <div className="flex flex-col items-center mb-1">
                    {React.cloneElement(step.icon, { className: "w-5 h-5 text-blue-600 mb-1" })}
                    <h3 className="font-bold text-gray-900 text-md">{step.title}</h3>
                  </div>
                  <p className="text-gray-700 text-s">{step.desc}</p>
                </div>
              </React.Fragment>
            ))}

            <ArrowRight className="w-8 h-8 text-gray-400" />

            <div className="flex flex-col items-center">
              <div className="px-8 py-3 rounded-full border-4 border-slate-700 bg-white flex items-center justify-center shadow-sm font-semibold text-gray-900">
                End
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-800 to-slate-900 py-12 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4">Relatus.AI</div>
              <p className="text-slate-300">AI-powered campaign generation for modern marketers</p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Product</h4>
              <div className="space-y-2 text-slate-300">
                <div className="hover:text-blue-400 cursor-pointer transition-colors">Features</div>
                <div className="hover:text-blue-400 cursor-pointer transition-colors">Pricing</div>
                <div className="hover:text-blue-400 cursor-pointer transition-colors">API</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3">Resources</h4>
              <div className="space-y-2 text-slate-300">
                <div className="hover:text-blue-400 cursor-pointer transition-colors">Documentation</div>
                <div className="hover:text-blue-400 cursor-pointer transition-colors">Tutorials</div>
                <div className="hover:text-blue-400 cursor-pointer transition-colors">Blog</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3">Company</h4>
              <div className="space-y-2 text-slate-300">
                <div className="hover:text-blue-400 cursor-pointer transition-colors">About</div>
                <div className="hover:text-blue-400 cursor-pointer transition-colors">Contact</div>
                <div className="hover:text-blue-400 cursor-pointer transition-colors">Careers</div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400">
            <p>© 2024 CampaignAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}