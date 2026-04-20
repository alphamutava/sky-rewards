import Link from "next/link";
import { ArrowRight, Users, Building2, Wallet, TrendingUp, Star, ChevronDown, Zap } from "lucide-react";

function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0D1B2A]/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          Sky <span className="text-[#E63946]">Kenya</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/about" className="text-gray-300 hover:text-white text-sm">About</Link>
          <Link href="/the-100" className="text-gray-300 hover:text-white text-sm">The 100</Link>
          <Link href="/login" className="text-gray-300 hover:text-white text-sm">Login</Link>
          <Link href="/register" className="bg-[#E63946] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition">
            Get Started
          </Link>
        </div>
        <Link href="/register" className="md:hidden bg-[#E63946] text-white px-4 py-2 rounded-lg text-sm font-medium">
          Get Started
        </Link>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center gradient-primary pt-16">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-[#E9C46A]" />
            <span className="text-sm text-gray-300">Kenya&apos;s #1 Content Rewards Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Get Paid to Create Content for{" "}
            <span className="text-[#E63946]">Kenya&apos;s Biggest Brands</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl">
            Create short-form videos, earn per 1,000 views, and get paid directly to your M-Pesa.
            Join thousands of Kenyan creators already earning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register/creator" className="inline-flex items-center justify-center gap-2 bg-[#E63946] text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-red-600 transition">
              Start Earning <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/register/brand" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-white/20 transition border border-white/20">
              <Building2 className="w-5 h-5" /> I&apos;m a Brand
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { label: "Creators", value: "2,500+", icon: Users },
    { label: "Brands", value: "150+", icon: Building2 },
    { label: "Paid Out", value: "KES 8M+", icon: Wallet },
    { label: "Avg Views/Creator", value: "250K+", icon: TrendingUp },
  ];

  return (
    <section className="bg-white border-y border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-6 h-6 text-[#E63946] mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-bold text-[#0D1B2A] tabular-nums">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksCreator() {
  const steps = [
    { num: "01", title: "Browse & Join Campaigns", desc: "Find brands that match your niche. Join campaigns with a single tap." },
    { num: "02", title: "Create & Post Content", desc: "Make short-form videos. Post on TikTok, Instagram Reels, YouTube Shorts, or X." },
    { num: "03", title: "Earn & Withdraw via M-Pesa", desc: "Views are tracked automatically. Earnings go to your wallet — withdraw to M-Pesa instantly." },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1B2A] mb-4">How Creators Earn</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Three simple steps to start earning from your content</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-5xl font-bold text-gray-100 mb-4">{step.num}</div>
              <h3 className="text-xl font-semibold text-[#0D1B2A] mb-2">{step.title}</h3>
              <p className="text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksBrand() {
  const steps = [
    { num: "01", title: "Create a Campaign", desc: "Set your budget, target platforms, reward rate per 1,000 views, and content guidelines." },
    { num: "02", title: "Creators Make Content", desc: "Thousands of Kenyan creators compete to make the best clips and UGC for your brand." },
    { num: "03", title: "Pay Only for Results", desc: "Pay per verified view. 100% transparent. See every view, every creator, every shilling." },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1B2A] mb-4">How Brands Grow</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Reach millions of Kenyans through authentic creator content</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-md transition">
              <div className="text-5xl font-bold text-gray-200 mb-4">{step.num}</div>
              <h3 className="text-xl font-semibold text-[#0D1B2A] mb-2">{step.title}</h3>
              <p className="text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CostComparison() {
  const channels = [
    { name: "Sky Kenya", costPer1k: "KES 50-200", reach: "Targeted Gen-Z & Millennials", highlight: true },
    { name: "Billboards", costPer1k: "KES 500-2,000", reach: "Random passersby", highlight: false },
    { name: "TV Ads", costPer1k: "KES 1,000-5,000", reach: "Broad, untargeted", highlight: false },
    { name: "Radio", costPer1k: "KES 300-1,500", reach: "Audio only", highlight: false },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1B2A] mb-4">Why Sky Kenya Wins</h2>
          <p className="text-gray-500 text-lg">Cost per 1,000 impressions compared</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-sm overflow-hidden">
            <thead>
              <tr className="bg-[#0D1B2A] text-white">
                <th className="text-left py-4 px-6 font-semibold">Channel</th>
                <th className="text-left py-4 px-6 font-semibold">Cost / 1K Impressions</th>
                <th className="text-left py-4 px-6 font-semibold">Audience</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch) => (
                <tr key={ch.name} className={ch.highlight ? "bg-green-50 font-medium" : "border-t border-gray-100"}>
                  <td className="py-4 px-6 flex items-center gap-2">
                    {ch.highlight && <Star className="w-4 h-4 text-[#E9C46A]" />}
                    {ch.name}
                  </td>
                  <td className="py-4 px-6 tabular-nums">{ch.costPer1k}</td>
                  <td className="py-4 px-6 text-gray-500">{ch.reach}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function The100Section() {
  return (
    <section className="py-20 gradient-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
          <Star className="w-4 h-4 text-[#E9C46A]" />
          <span className="text-sm text-gray-300">Elite Creator Collective</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">The 100</h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          Kenya&apos;s top 100 content creators. One collective goal: <span className="text-[#E9C46A] font-bold">KES 100,000,000</span> in combined revenue.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/the-100" className="inline-flex items-center gap-2 bg-white text-[#0D1B2A] px-8 py-3.5 rounded-lg font-semibold hover:bg-gray-100 transition">
            Learn More <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "How do I get paid?", a: "All payments are made via M-Pesa. Minimum withdrawal is KES 500. Withdrawals are processed within minutes." },
    { q: "What type of content do I need to create?", a: "Short-form video content — TikTok videos, Instagram Reels, YouTube Shorts, or X posts. Each campaign has specific guidelines." },
    { q: "How are views verified?", a: "Views are tracked over a 30-day verification period. We use platform APIs where available, plus manual screenshot verification." },
    { q: "What's the platform commission?", a: "Sky Kenya takes a 15% commission on creator earnings. Brands pay the full campaign budget upfront." },
    { q: "How much can I earn?", a: "Earnings depend on your views. At KES 150/1,000 views, 100K views earns you KES 12,750 after commission." },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1B2A] text-center mb-12">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="group bg-gray-50 rounded-xl border border-gray-100">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-[#0D1B2A]">
                {faq.q}
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6 text-gray-500">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1B2A] mb-4">Ready to Start Earning?</h2>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          Join thousands of Kenyan creators who are turning their content into real income.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register/creator" className="inline-flex items-center justify-center gap-2 bg-[#E63946] text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-red-600 transition">
            Create Account <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/register/brand" className="inline-flex items-center justify-center gap-2 bg-[#0D1B2A] text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-[#1B263B] transition">
            <Building2 className="w-5 h-5" /> Register as Brand
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0D1B2A] text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-xl font-bold text-white mb-4">Sky <span className="text-[#E63946]">Kenya</span></div>
            <p className="text-sm">Kenya&apos;s content rewards marketplace. Empowering creators, amplifying brands.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Creators</h4>
            <div className="space-y-2 text-sm">
              <div><Link href="/register/creator" className="hover:text-white transition">Sign Up</Link></div>
              <div><Link href="/discover" className="hover:text-white transition">Browse Campaigns</Link></div>
              <div><Link href="/the-100" className="hover:text-white transition">The 100</Link></div>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Brands</h4>
            <div className="space-y-2 text-sm">
              <div><Link href="/register/brand" className="hover:text-white transition">Get Started</Link></div>
              <div><Link href="/about" className="hover:text-white transition">How It Works</Link></div>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <div className="space-y-2 text-sm">
              <div><a href="mailto:support@skykenya.co.ke" className="hover:text-white transition">support@skykenya.co.ke</a></div>
              <div><a href="https://wa.me/254700000000" className="hover:text-white transition">WhatsApp Support</a></div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} Sky Kenya. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <StatsBar />
      <HowItWorksCreator />
      <HowItWorksBrand />
      <CostComparison />
      <The100Section />
      <FAQSection />
      <CTASection />
      <Footer />
    </>
  );
}
