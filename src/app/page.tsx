"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, ShieldCheck, TrendingUp, Smartphone, PlaySquare, Calendar, Users, X, Send } from "lucide-react";

export default function HomePage() {
  const [mode, setMode] = useState<"creator" | "brand">("creator");
  const [mpesaPhone, setMpesaPhone] = useState("0712 345 678");
  const [stkStatus, setStkStatus] = useState<"idle" | "loading" | "active" | "success">("idle");
  const [showApplyModal, setShowApplyModal] = useState(false);

  const triggerSTK = () => {
    if (!mpesaPhone) return alert("Please enter your M-Pesa number");
    setStkStatus("loading");
    setTimeout(() => {
      setStkStatus("active");
    }, 1500);
  };

  return (
    <div className="font-sans antialiased text-white min-h-screen">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center font-display text-white text-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:scale-105 transition-transform">
              SK
            </div>
            <span className="font-display text-2xl tracking-widest hidden sm:block mt-1">SK KENYA</span>
          </Link>
          <div className="hidden md:flex gap-8 font-bold text-sm tracking-wide">
            <a href="#how-it-works" className="text-gray-400 hover:text-white uppercase">How It Works</a>
            <Link href="/discover" className="text-gray-400 hover:text-white uppercase">Discover</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hidden sm:inline-block px-5 py-2.5 rounded-full font-bold hover:bg-white/5 transition border border-transparent hover:border-white/10 uppercase text-sm">
              Log In
            </Link>
            <Link href="/register/creator" className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-full font-bold transition uppercase text-sm shadow-md">
              Start Earning
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-32 pb-20 px-6 text-center overflow-hidden min-h-[90vh] flex flex-col justify-center items-center">
        {/* Glow behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,rgba(10,10,10,0)_70%)] pointer-events-none rounded-full z-0"></div>

        <div className="relative z-10 w-full max-w-5xl mx-auto">
          {/* Mode Toggle */}
          <div className="inline-flex bg-[#141414] border border-[#222] p-1.5 rounded-full mb-12 shadow-lg">
            <button
              onClick={() => setMode("creator")}
              className={`px-8 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition ${
                mode === "creator"
                  ? "bg-[#F97316] text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              For Creators
            </button>
            <button
              onClick={() => setMode("brand")}
              className={`px-8 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition ${
                mode === "brand"
                  ? "bg-[#F97316] text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              For Brands
            </button>
          </div>

          {mode === "creator" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              <h1 className="font-display text-5xl sm:text-7xl lg:text-[100px] leading-[0.9] mb-8 text-shadow-sm uppercase">
                EARN REAL MONEY POSTING CLIPS ON TIKTOK, YOUTUBE & INSTAGRAM
              </h1>
              <p className="text-xl sm:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium">
                Join 500+ Kenyan creators earning via M-Pesa. No followers minimum required to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register/creator" className="bg-[#F97316] hover:bg-orange-600 text-white px-10 py-4 rounded-full font-bold transition uppercase text-lg shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:-translate-y-1">
                  Start Earning Now
                </Link>
                <Link href="/discover" className="bg-transparent border border-[#333] hover:border-gray-400 text-white px-10 py-4 rounded-full font-bold transition uppercase text-lg hover:bg-white/5">
                  Browse Campaigns
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              <h1 className="font-display text-5xl sm:text-7xl lg:text-[100px] leading-[0.9] mb-8 text-shadow-sm uppercase">
                LAUNCH CAMPAIGNS FOR YOUR BRAND
              </h1>
              <p className="text-xl sm:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium">
                Grow your brand awareness with short-form creators making authentic videos for you in Kenya. Only pay for verified views.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register/brand" className="bg-[#F97316] hover:bg-orange-600 text-white px-10 py-4 rounded-full font-bold transition uppercase text-lg shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:-translate-y-1">
                  Launch My Campaign
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* STATS BAR */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 -mt-16 sm:-mt-24 mb-20">
        <div className="bg-[#141414] border border-[#F97316]/30 rounded-[32px] p-8 sm:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_0_30px_rgba(249,115,22,0.05)] backdrop-blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#333]">
            <div className="py-2">
              <div className="font-display text-5xl sm:text-6xl text-[#F97316] mb-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">KSh 4.2M+</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Paid Out</div>
            </div>
            <div className="py-2">
              <div className="font-display text-5xl sm:text-6xl text-white mb-2">500+</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Creators</div>
            </div>
            <div className="py-2">
              <div className="font-display text-5xl sm:text-6xl text-white mb-2">47</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Live Campaigns</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-5xl sm:text-6xl text-center mb-16 uppercase">How It Works</h2>
          
          {mode === "creator" ? (
            <div className="grid md:grid-cols-2 gap-12 items-center animate-in fade-in duration-500">
              <div className="space-y-10">
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#141414] border border-[#333] flex items-center justify-center font-display text-3xl text-gray-400">1</div>
                  <div>
                    <h4 className="font-display text-2xl mb-2 text-white tracking-wide">Sign Up Free</h4>
                    <p className="text-gray-400 text-lg">Create your account in 2 minutes. No followers required to get started on the platform.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#141414] border border-[#333] flex items-center justify-center font-display text-3xl text-gray-400">2</div>
                  <div>
                    <h4 className="font-display text-2xl mb-2 text-white tracking-wide">Copy Content</h4>
                    <p className="text-gray-400 text-lg">Browse available campaigns and download the required media or follow the UGC guidelines.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#F97316] flex items-center justify-center font-display text-3xl text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]">3</div>
                  <div>
                    <h4 className="font-display text-2xl mb-2 text-[#F97316] tracking-wide">Post & Earn</h4>
                    <p className="text-gray-400 text-lg">Make a short, engaging clip and post to your TikTok, YouTube Shorts, or Instagram Reels. Earn per verified view.</p>
                  </div>
                </div>
              </div>
              <div className="relative aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_60%)] rounded-full"></div>
                <PlaySquare className="w-40 h-40 text-[#F97316] opacity-80" strokeWidth={1} />
              </div>
            </div>
          ) : (
             <div className="grid md:grid-cols-2 gap-12 items-center animate-in fade-in duration-500">
                <div className="space-y-10">
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#141414] border border-[#333] flex items-center justify-center font-display text-3xl text-gray-400">1</div>
                  <div>
                    <h4 className="font-display text-2xl mb-2 text-white tracking-wide">Create Campaign</h4>
                    <p className="text-gray-400 text-lg">Set your budget, target platforms, reward rate per 1,000 views, and content guidelines.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#141414] border border-[#333] flex items-center justify-center font-display text-3xl text-gray-400">2</div>
                  <div>
                    <h4 className="font-display text-2xl mb-2 text-white tracking-wide">Creators Make Content</h4>
                    <p className="text-gray-400 text-lg">Thousands of Kenyan creators compete to make the best clips and UGC for your brand.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#F97316] flex items-center justify-center font-display text-3xl text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]">3</div>
                  <div>
                    <h4 className="font-display text-2xl mb-2 text-[#F97316] tracking-wide">Pay Only for Views</h4>
                    <p className="text-gray-400 text-lg">Pay strictly per verified view. 100% transparent. See every view, every creator, every shilling.</p>
                  </div>
                </div>
              </div>
               <div className="relative aspect-square flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_60%)] rounded-full"></div>
                <TrendingUp className="w-40 h-40 text-[#F97316] opacity-80" strokeWidth={1} />
              </div>
             </div>
          )}
        </div>
      </section>

      {/* ACTIVE CAMPAIGNS */}
      <section className="py-20 px-6 bg-[#050505] border-y border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-5xl sm:text-6xl mb-4">ACTIVE CAMPAIGNS</h2>
          <p className="text-gray-400 text-xl font-medium mb-12">Browse premium deals and start earning today.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {/* Fake Campaign Card 1 */}
            <div className="bg-[#141414] border border-[#222] rounded-[24px] p-6 hover:-translate-y-1 hover:border-[#F97316] transition-all group shadow-lg">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-black border border-[#333] rounded-xl flex items-center justify-center font-display text-xl">SA</div>
                 <span className="bg-white/5 text-gray-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-white/10">Clipping</span>
              </div>
              <h3 className="text-xl font-bold mb-4 font-sans text-white group-hover:text-[#F97316] transition-colors">Safaricom M-Pesa Go</h3>
              <div className="bg-[#050505] rounded-xl p-4 border border-[#333] mb-5">
                <div className="font-display text-4xl text-[#F97316]">KSh 350 <span className="text-sm text-gray-500 font-sans tracking-normal lowercase">/ 1k views</span></div>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <div className="flex gap-2">
                  <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold text-gray-400">TikTok</span>
                  <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold text-gray-400">YT Shorts</span>
                </div>
                <button onClick={() => setShowApplyModal(true)} className="bg-white hover:bg-[#F97316] text-black hover:text-white px-5 py-2 rounded-full font-bold text-sm transition-colors">Apply</button>
              </div>
            </div>

            {/* Fake Campaign Card 2 */}
            <div className="bg-[#141414] border border-[#222] rounded-[24px] p-6 hover:-translate-y-1 hover:border-[#F97316] transition-all group shadow-lg">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-black border border-[#333] rounded-xl flex items-center justify-center font-display text-xl">EQ</div>
                 <span className="bg-white/5 text-gray-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-white/10">UGC</span>
              </div>
              <h3 className="text-xl font-bold mb-4 font-sans text-white group-hover:text-[#F97316] transition-colors">Equity Wings to Fly</h3>
              <div className="bg-[#050505] rounded-xl p-4 border border-[#333] mb-5 relative overflow-hidden">
                <div className="font-display text-4xl text-[#F97316]">KSh 500 <span className="text-sm text-gray-500 font-sans tracking-normal lowercase">/ 1k views</span></div>
                <div className="text-xs font-bold text-green-400 mt-1">+ KSh 800 Flat Bonus</div>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <div className="flex gap-2">
                   <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold text-gray-400">TikTok</span>
                </div>
                <button onClick={() => setShowApplyModal(true)} className="bg-white hover:bg-[#F97316] text-black hover:text-white px-5 py-2 rounded-full font-bold text-sm transition-colors">Apply</button>
              </div>
            </div>

             {/* Fake Campaign Card 3 */}
             <div className="bg-[#141414] border border-[#222] rounded-[24px] p-6 hover:-translate-y-1 hover:border-[#F97316] transition-all group shadow-lg">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-black border border-[#333] rounded-xl flex items-center justify-center font-display text-xl">NA</div>
                 <span className="bg-white/5 text-gray-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-white/10">CLIPPING</span>
              </div>
              <h3 className="text-xl font-bold mb-4 font-sans text-white group-hover:text-[#F97316] transition-colors">Naivas Festive Deals</h3>
              <div className="bg-[#050505] rounded-xl p-4 border border-[#333] mb-5">
                <div className="font-display text-4xl text-[#F97316]">KSh 280 <span className="text-sm text-gray-500 font-sans tracking-normal lowercase">/ 1k views</span></div>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <div className="flex gap-2">
                   <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold text-gray-400">IG Reels</span>
                </div>
                <button onClick={() => setShowApplyModal(true)} className="bg-white hover:bg-[#F97316] text-black hover:text-white px-5 py-2 rounded-full font-bold text-sm transition-colors">Apply</button>
              </div>
            </div>
          </div>

          <div className="mt-12">
             <Link href="/discover" className="inline-block border border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white px-8 py-3 rounded-full font-bold uppercase transition text-sm">
                View All Campaigns
             </Link>
          </div>
        </div>
      </section>

      {/* MPESA INTEGRATION */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto rounded-[40px] bg-[#141414] border border-[#10B981]/20 p-8 sm:p-16 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_50px_rgba(16,185,129,0.05)]">
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
             <div>
                <div className="inline-flex items-center gap-2 bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-[#10B981]/20 mb-6">
                    <ShieldCheck className="w-4 h-4" /> M-Pesa Integrated
                </div>
                <h2 className="font-display text-5xl sm:text-6xl mb-6 leading-[0.9]">GET PAID DIRECTLY TO YOUR M-PESA</h2>
                <p className="text-gray-400 text-lg mb-10 font-medium">No bank account needed. No delays. Earnings land in your M-Pesa within minutes.</p>

                <ul className="space-y-6">
                  {["Hit your assigned views milestone", "Request payout from your dashboard", "Receive M-Pesa prompt on your phone", "Confirm PIN and the money is yours"].map((step, i) => (
                    <li key={i} className="flex items-center gap-4 text-white font-medium">
                       <CheckCircle className="w-6 h-6 text-[#10B981]" /> {step}
                    </li>
                  ))}
                </ul>
             </div>

             <div className="flex justify-center md:justify-end">
                {/* Phone Simulator Node */}
                <div className="w-[320px] h-[640px] bg-black border-[8px] border-[#222] rounded-[40px] relative shadow-2xl flex flex-col p-6">
                    {/* Notch */}
                    <div className="w-32 h-6 bg-[#222] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>

                    {/* App Screen inside phone */}
                    <div className="mt-8 flex-1 flex flex-col">
                      <h3 className="text-2xl font-bold mb-2">Withdraw Earnings</h3>
                      <p className="text-gray-400 text-sm mb-8 border-b border-[#333] pb-4">Available Balance: KSh 12,500</p>
                      
                      <div className="space-y-6 mb-8">
                        <div>
                          <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">M-Pesa Number</label>
                          <input type="tel" value={mpesaPhone} onChange={e=>setMpesaPhone(e.target.value)} className="w-full bg-[#111] border border-[#333] focus:border-[#10B981] rounded-xl px-4 py-3 outline-none text-white font-mono" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">Amount (KSh)</label>
                          <input type="number" defaultValue="5000" className="w-full bg-[#111] border border-[#333] focus:border-[#10B981] rounded-xl px-4 py-3 outline-none text-white font-mono" />
                        </div>
                      </div>

                      <button onClick={triggerSTK} disabled={stkStatus !== "idle"} className="mt-auto w-full bg-[#10B981] hover:bg-emerald-600 active:scale-95 text-white font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50">
                        {stkStatus === "idle" ? "Request Payout" : stkStatus === "loading" ? "Processing..." : "Prompt Sent"}
                      </button>
                    </div>

                    {/* STK Overlay */}
                    {stkStatus === "active" && (
                       <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-8 rounded-[32px]">
                          <div className="bg-[#e2e8f0] w-full rounded-[24px] p-6 shadow-2xl text-[#0f172a]">
                             <h3 className="font-bold mb-3 flex items-center gap-2"><Smartphone className="w-5 h-5" /> SIM Toolkit</h3>
                             <p className="font-medium text-sm mb-4 leading-snug">Do you want to receive Ksh 5,000 from SK KENYA? Enter M-PESA PIN</p>
                             <input type="password" placeholder="PIN" className="w-full bg-white border border-gray-300 rounded p-2 mb-4" />
                             <div className="flex justify-end gap-5 font-bold text-sm">
                               <button onClick={()=>setStkStatus("idle")} className="text-red-600">Cancel</button>
                               <button onClick={()=>setStkStatus("success")} className="text-sky-600">OK</button>
                             </div>
                          </div>
                       </div>
                    )}

                    {stkStatus === "success" && (
                       <div className="absolute inset-0 bg-[#0A0A0A] border border-[#10B981] z-30 flex flex-col justify-center items-center p-6 text-center rounded-[32px]">
                          <div className="w-16 h-16 rounded-full bg-[#10B981]/20 flex items-center justify-center mb-6 border border-[#10B981]">
                             <CheckCircle className="w-8 h-8 text-[#10B981]" />
                          </div>
                          <h3 className="text-2xl font-bold mb-2">Sent Successfully</h3>
                          <p className="text-gray-400 text-sm mb-8">KSh 5,000 has been deposited to your M-Pesa account.</p>
                          <button onClick={()=>setStkStatus("idle")} className="text-[#10B981] font-bold uppercase text-sm">Done</button>
                       </div>
                    )}
                </div>
             </div>
          </div>

          {/* Background Glows within the container */}
          <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_60%)] rounded-full pointer-events-none z-0"></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#222] py-20 px-6 relative overflow-hidden bg-black">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 relative z-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#F97316] rounded flex items-center justify-center font-display text-white shadow-lg">SK</div>
              <span className="font-display text-2xl tracking-widest text-white mt-1">SK KENYA</span>
            </Link>
            <p className="text-gray-400 font-medium max-w-sm mb-6 leading-relaxed">
              Create, post and earn real money for posting clips on YouTube, TikTok & X in Kenya.
            </p>
          </div>
          <div>
             <h4 className="font-display text-xl tracking-wider text-white mb-6">Navigation</h4>
             <ul className="space-y-4 text-sm font-medium text-gray-400">
               <li><Link href="/discover" className="hover:text-[#F97316] transition">Discover Campaigns</Link></li>
               <li><Link href="/register/creator" className="hover:text-[#F97316] transition">For Creators</Link></li>
               <li><Link href="/register/brand" className="hover:text-[#F97316] transition">For Brands</Link></li>
             </ul>
          </div>
          <div>
            <h4 className="font-display text-xl tracking-wider text-white mb-6">Socials</h4>
             <ul className="space-y-4 text-sm font-medium text-gray-400">
               <li><a href="#" className="hover:text-[#F97316] transition">Twitter / X</a></li>
               <li><a href="#" className="hover:text-[#F97316] transition">Instagram</a></li>
               <li><a href="#" className="hover:text-[#F97316] transition">LinkedIn</a></li>
             </ul>
          </div>
        </div>
        
        {/* Giant Watermark */}
        <div className="absolute -bottom-[8vw] left-0 right-0 text-center font-display text-[26vw] leading-none text-[#F97316]/5 pointer-events-none select-none z-0 whitespace-nowrap overflow-hidden">
           SK KENYA
        </div>
      </footer>

      {/* Demo Modal for Apply Buttons */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-[#141414] border border-[#333] w-full max-w-lg rounded-[24px] p-8 relative animate-in zoom-in-95 duration-200 shadow-2xl">
              <button onClick={() => setShowApplyModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 rounded-full p-2 transition"><X className="w-5 h-5"/></button>
              <h3 className="font-display text-4xl mb-2 text-white">Join Campaign</h3>
              <p className="text-gray-400 mb-6 font-medium">Create an account to start submitting content and earning money.</p>
              
              <Link href="/register/creator" className="flex items-center justify-center gap-2 w-full bg-[#F97316] hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                Create Creator Account
              </Link>
              <div className="text-center mt-6">
                <span className="text-gray-500">Already joined? </span><Link href="/login" className="text-white font-bold hover:text-[#F97316] underline-offset-4 hover:underline">Log in</Link>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
