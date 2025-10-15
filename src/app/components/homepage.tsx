'use client';


import React, { useState } from 'react';
import { Sparkles, Zap, Layers, Layout, Upload, Download, Menu, X, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export default function CampaignAI() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50); // 50px se zyada scroll ho to navbar change
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
      className={`fixed top-0 w-full z-50 transition-colors duration-500 ${
        scrolled
          ? 'bg-[#FFFAE3] backdrop-blur-md shadow-sm'
          : 'bg-[linear-gradient(135deg,_#FFF9E0,_#FFFFFF)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-800">CampaignAI</div>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#about"
            className="block text-[#76BDC3] transition-colors duration-300 font-medium"
          >
            About
          </a>
          <a
            href="#features"
            className="block text-[#76BDC3] transition-colors duration-300 font-medium"
          >
            Features
          </a>
          <a
            href="#mission"
            className="block text-[#76BDC3] transition-colors duration-300 font-medium"
          >
            Mission
          </a>
          <a
            href="#team"
            className="block text-[#76BDC3] transition-colors duration-300 font-medium"
          >
            Team
          </a>
          <button className="px-6 py-2 bg-amber-400 text-gray-900 rounded-full hover:bg-amber-500 transition-all font-semibold">
            Get Started
          </button>
        </div>

        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-6 py-4 space-y-4">
            <a href="#about" className="block text-gray-600 hover:text-[#76BDC3] font-medium">About</a>
            <a href="#features" className="block text-gray-600">Features</a>
            <a href="#mission" className="block text-gray-600">Mission</a>
            <a href="#team" className="block text-gray-600">Team</a>
          </div>
        </div>
      )}
    </nav>

      {/* Hero Section */}
      <section id="about" className="pt-32 pb-20 px-6 relative z-0
    bg-[linear-gradient(135deg,_#FFF9E0,_#FFFFFF)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-6xl md:text-6xl font-bold mb-6 text-[#76BDC3] leading-tight">
                About CampaignAI with AI and Productivity
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Wherever you are should not be a factor in what you do. Brilliant well-being and productivity at one time will change the way the world works.
              </p>
              <button className="px-8 py-4 bg-amber-400 text-gray-900 rounded-full font-semibold hover:bg-amber-500 transition-all flex items-center gap-2 text-xl">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div className="space-y-4">
                  {/* Box 1 */}
                  <div className="rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
                    <img
                      src="/book_day.png"
                      alt="Box 1"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Box 2 */}
                  <div className="rounded-2xl shadow-lg overflow-hidden">
                    <img
                      src="/handmade.png"
                      alt="Box 2"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                  {/* Box 3 */}
                  <div className="rounded-2xl shadow-lg overflow-hidden">
                    <img
                      src="/coffee.png"
                      alt="Box 3"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Box 4 */}
                  <div className="rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
                    <img
                      src="/korean.png"
                      alt="Box 4"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section id="mission" className="py-20 px-6 relative z-0">
  {/* Background grid */}
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      background: '#f7f9fc',
      backgroundImage: `
        linear-gradient(rgba(200, 200, 100, 0.5) 1px, transparent 1px),
        linear-gradient(90deg, rgba(200, 200, 100, 0.5) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }}
  ></div>

  <div className="relative max-w-3xl mx-auto grid md:grid-cols-2 gap-12">
    
    {/* Card 1 */}
    <div className="relative  rounded-3xl shadow-2xl border-2 border-dotted border-gray-200 p-12 overflow-hidden z-10 bg-[#76BDC3BB]">
      <h2 className="text-4xl font-bold mb-4 text-gray-900 text-center">Our Mission</h2>
      <p className="text-gray-600 leading-relaxed text-center">
        At CampaignAI, we provide tailored AI wellness and productivity solutions to boost efficiency, drive innovation, and support growth. We help individuals and businesses optimize their routines for lasting success.
      </p>
    </div>

    {/* Card 2 */}
    <div className="relative  rounded-3xl shadow-2xl border-2 border-dashed  p-12 overflow-hidden z-10 bg-[#C68F95BB] ">
      <h2 className="text-4xl font-bold mb-4 text-gray-900 text-center">Our Value</h2>
      <p className="text-gray-600 leading-relaxed text-center">
        CampaignAI sets the global standard in AI-driven wellness and productivity solutions, empowering organizations worldwide through innovative technologies and strategies. Join us to approach wellness and productivity.
      </p>
    </div>

  </div>
</section>



      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">Key Features</h2>
            <p className="text-xl text-gray-600">Everything you need to launch campaigns faster</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Sparkles className="w-10 h-10" />,
                title: 'Smart Strategy Generation',
                desc: 'AI understands your brief and creates a complete campaign concept tailored for your target audience.',
                color: 'from-blue-100 to-blue-200'
              },
              {
                icon: <Layers className="w-10 h-10" />,
                title: 'AI Moodboard That Evolves',
                desc: 'Drag, drop, and tweak images, colors, and notes — watch AI generate visuals and copy aligned to your brand vibe.',
                color: 'from-rose-100 to-rose-200'
              },
              {
                icon: <Zap className="w-10 h-10" />,
                title: 'Multi-Step Campaign Automation',
                desc: 'Copywriting, visual creation, influencer research, and media planning — everything happens automatically.',
                color: 'from-amber-100 to-amber-200'
              },
              {
                icon: <Layout className="w-10 h-10" />,
                title: 'Interactive Campaign Canvas',
                desc: 'Review, edit, regenerate, and export your campaign in one intuitive dashboard.',
                color: 'from-teal-100 to-teal-200'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-gray-700 mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-600">Four simple steps to campaign success</p>
          </div>
          
          <div className="space-y-8">
            {[
              { num: '01', title: 'Upload Your Marketing Brief', desc: 'Tell the AI your product, audience, and goal — it takes care of the rest.', icon: <Upload /> },
              { num: '02', title: 'AI Generates Your Campaign', desc: 'Strategy, visuals, copy, influencer outreach, and posting plan — all crafted intelligently.', icon: <Sparkles /> },
              { num: '03', title: 'Review & Customize', desc: 'Interactive dashboard lets you tweak images, captions, and schedules — the AI adapts instantly.', icon: <Layout /> },
              { num: '04', title: 'Export & Launch', desc: 'Download your campaign package and deploy across social media platforms.', icon: <Download /> }
            ].map((step, i) => (
              <div 
                key={i}
                className={`flex items-center gap-8 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0 w-20 h-20 bg-amber-400 rounded-2xl flex items-center justify-center text-gray-900 shadow-lg">
                  {React.cloneElement(step.icon, { className: 'w-10 h-10' })}
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg flex-1 border-2 border-gray-100">
                  <div className="text-3xl font-bold text-gray-300 mb-2">{step.num}</div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 px-6 bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">Meet the Team</h2>
            <p className="text-xl text-gray-600">The people behind CampaignAI</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Ronald Richards', role: 'Founder', color: 'from-blue-100 to-blue-200' },
              { name: 'Jenny Wilson', role: 'Founder', color: 'from-rose-100 to-rose-200' },
              { name: 'Ralph Edwards', role: 'Founder', color: 'from-teal-100 to-teal-200' },
              { name: 'Leslie Alexander', role: 'Founder', color: 'from-amber-100 to-amber-200' },
              { name: 'Jane Cooper', role: 'Founder', color: 'from-purple-100 to-purple-200' },
              { name: 'Brooklyn Simmons', role: 'Founder', color: 'from-green-100 to-green-200' }
            ].map((member, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all">
                <div className={`aspect-square bg-gradient-to-br ${member.color} rounded-xl mb-3`}></div>
                <h4 className="font-bold text-gray-900 text-center">{member.name}</h4>
                <p className="text-sm text-gray-500 text-center">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Success Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-rose-100 to-amber-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-6 text-gray-900 leading-tight">
                Our success Depends on Our Customers Success.
              </h2>
            </div>

            <div className="bg-gradient-to-br from-rose-200 to-rose-300 p-8 rounded-3xl shadow-xl min-h-[400px]">
              {/* Decorative element */}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-amber-400">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">Love from CampaignAI</h2>
            <p className="text-xl text-gray-700">See what our customers say about us</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      Streamlined text: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </p>
                    <div>
                      <p className="font-bold text-gray-900">Jessica Howard</p>
                      <p className="text-sm text-gray-500">HR Bank of America</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 px-6 bg-amber-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center gap-12 flex-wrap">
            {['Replicate', 'Plain.', 'Beecons', 'Modal'].map((brand, i) => (
              <div key={i} className="text-2xl font-bold text-gray-900">{brand}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4">CampaignAI</div>
              <p className="text-gray-400">AI-powered campaign generation for modern marketers</p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Product</h4>
              <div className="space-y-2 text-gray-400">
                <div className="hover:text-white cursor-pointer">Features</div>
                <div className="hover:text-white cursor-pointer">Pricing</div>
                <div className="hover:text-white cursor-pointer">API</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3">Resources</h4>
              <div className="space-y-2 text-gray-400">
                <div className="hover:text-white cursor-pointer">Documentation</div>
                <div className="hover:text-white cursor-pointer">Tutorials</div>
                <div className="hover:text-white cursor-pointer">Blog</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3">Company</h4>
              <div className="space-y-2 text-gray-400">
                <div className="hover:text-white cursor-pointer">About</div>
                <div className="hover:text-white cursor-pointer">Contact</div>
                <div className="hover:text-white cursor-pointer">Careers</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2024 CampaignAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}