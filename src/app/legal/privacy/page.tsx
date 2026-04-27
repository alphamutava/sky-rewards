import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-white font-sans">
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-8 font-bold">
        DRAFT FOR LEGAL REVIEW. DO NOT USE IN PRODUCTION WITHOUT COUNSEL APPROVAL.
      </div>
      
      <h1 className="text-4xl font-display mb-8">Privacy Policy</h1>
      <p className="text-gray-400 mb-8">Last Updated: [Date]</p>

      <section className="space-y-6 text-gray-300">
        <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
        <p>We collect personal information necessary to operate the Sky Kenya platform, including but not limited to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Identity Data: Name, National ID, Phone Number (encrypted at rest).</li>
          <li>Financial Data: M-Pesa transaction records, wallet balances.</li>
          <li>Content Data: Videos and media submitted to campaigns.</li>
          <li>Usage Data: IP addresses, device identifiers, and engagement metrics.</li>
        </ul>

        <h2 className="text-2xl font-bold text-white">2. How We Use Your Information</h2>
        <p>We use your data strictly to facilitate payments, prevent fraud, and match creators with relevant campaigns.</p>

        <h2 className="text-2xl font-bold text-white">3. Data Sharing</h2>
        <p>We do not sell your personal data. We share data only with trusted partners (e.g., Safaricom for payments) strictly as required to fulfill our services.</p>

        <h2 className="text-2xl font-bold text-white">4. Your Rights (GDPR & Kenya Data Protection Act)</h2>
        <p>You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact privacy@skykenya.co.ke.</p>
      </section>
    </div>
  );
}
