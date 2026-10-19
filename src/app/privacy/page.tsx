'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { ShieldCheck, ArrowLeft, Lock, CheckCircle2, UserCheck, Trash2, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#F3F4F6] font-sans selection:bg-[#FF5500] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3 pb-8 border-b border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DPDP Act 2023 Compliant</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Privacy Policy<span className="text-[#FF5500]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Last Updated: October 2026 · Digital Personal Data Protection Governance
          </p>
        </div>

        {/* Content Body */}
        <div className="pt-8 space-y-10 text-xs sm:text-sm text-white/80 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>1. Commitment to Personal Data Protection</span>
            </h2>
            <p>
              <strong>Swaniki (&quot;Vibe&quot;, &quot;we&quot;, &quot;our&quot;)</strong> operates as a Data Fiduciary under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> of India. We are committed to transparency, purpose limitation, and robust safeguards regarding the personal information you entrust to us when discovering events, generating AI vibes, and attending gatherings.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>2. Data We Collect & Lawful Grounds</span>
            </h2>
            <p>We process personal data solely with your explicit consent for specified, legitimate purposes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-[#0D0D10] border border-white/10 space-y-1.5">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Profile Information</span>
                </div>
                <p className="text-white/60 text-xs">
                  Name, email address, bio, and avatar for organizer branding and attendee identification.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D0D10] border border-white/10 space-y-1.5">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Pass & Ticketing Data</span>
                </div>
                <p className="text-white/60 text-xs">
                  Mobile number for WhatsApp/SMS pass QR delivery, gate check-in verification, and host broadcasts.
                </p>
              </div>
            </div>
            <p className="text-xs text-white/50 pt-1">
              Location coordinates are accessed ephemerally only with your browser/device permission to compute distance from nearby experiences. Location is never stored without your explicit consent.
            </p>
          </section>

          {/* Section 3: Data Principal Rights under DPDP Act */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>3. Your Rights as a Data Principal (Section 11, 12 & 13)</span>
            </h2>
            <p>Under the DPDP Act 2023, you enjoy statutory rights regarding your personal digital data:</p>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Right to Access & Summary:</strong> You can review all personal data, active passes, and hosting history directly from your profile dashboard.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Right to Correction & Updating:</strong> You can edit your name, contact email, and profile details anytime via{' '}
                  <Link href="/profile" className="text-[#FF5500] hover:underline">
                    Edit Profile
                  </Link>.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Right to Erasure (Data Deletion):</strong> You have the right to erase your account and all associated personal data from our active databases with 1-click execution in your Profile settings.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Right to Withdraw Consent:</strong> You may withdraw your consent for event notifications or pass communication at any time without penalty.
                </div>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>4. Data Sharing & Third-Party Gateways</span>
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/70">
              <li>
                <strong>Event Hosts:</strong> When you RSVP for an event, the host receives your name and contact info solely for admission management and safety coordination.
              </li>
              <li>
                <strong>Partner Platforms:</strong> If you book a partner-listed event (e.g., District, BookMyShow), your information is handled by the respective partner once you redirect to their checkout.
              </li>
              <li>
                <strong>Zero Commercial Sale:</strong> Vibe does not sell, trade, or rent personal data to third-party advertising brokers under any circumstances.
              </li>
            </ul>
          </section>

          {/* Section 5: Grievance Officer */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>5. Grievance Redressal Officer (Section 13)</span>
            </h2>
            <p>
              In accordance with the DPDP Act 2023 and the Information Technology Rules, our designated Grievance Officer is reachable for any questions, consent revocations, or complaints:
            </p>
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-2 text-xs font-mono text-white/80">
              <div><strong>Designated Grievance Officer:</strong> Data Protection Cell, Swaniki</div>
              <div><strong>Email:</strong> privacy@swaniki.com / grievance@swaniki.com</div>
              <div><strong>Address:</strong> Swaniki Technologies, Mumbai, Maharashtra 400050, India</div>
              <div><strong>Resolution SLA:</strong> Acknowledgment within 24 hours, resolution within 7 working days.</div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
