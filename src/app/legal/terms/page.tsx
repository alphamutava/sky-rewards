import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-white font-sans">
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 font-bold">
        DRAFT FOR LEGAL REVIEW. DO NOT USE IN PRODUCTION WITHOUT COUNSEL APPROVAL.
      </div>
      
      <h1 className="text-4xl font-display mb-8">Terms of Service</h1>
      <p className="text-gray-400 mb-8">Last Updated: [Date]</p>

      <section className="space-y-6 text-gray-300">
        <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
        <p>By accessing Sky Kenya, you agree to these Terms of Service. If you disagree, do not use our platform.</p>

        <h2 className="text-2xl font-bold text-white">2. Creator Responsibilities</h2>
        <p>Creators must submit original content. Fraudulent views, botting, or copyright infringement will result in immediate account termination and forfeiture of pending wallet balances.</p>

        <h2 className="text-2xl font-bold text-white">3. Advertiser Responsibilities</h2>
        <p>Advertisers must fund campaigns upfront. Sky Kenya acts as an escrow service. Unused funds from expired campaigns will be refunded to the advertiser's wallet minus platform fees.</p>

        <h2 className="text-2xl font-bold text-white">4. Payments & M-Pesa</h2>
        <p>All payouts are processed via Safaricom M-Pesa. Sky Kenya is not liable for delays caused by the telecom provider.</p>

        <h2 className="text-2xl font-bold text-white">5. Limitation of Liability</h2>
        <p>Sky Kenya is provided "as is" without warranty. We are not liable for lost profits or data.</p>
      </section>
    </div>
  );
}
