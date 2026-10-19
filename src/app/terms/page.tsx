'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import {
  FileText,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Ticket,
  Users,
  AlertCircle,
  HelpCircle,
  Mail
} from 'lucide-react';

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'guidelines'>('terms');

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#F3F4F6] font-sans selection:bg-[#FF5500] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 w-full space-y-8">
        {/* Navigation & Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to explore</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="space-y-2 border-b border-white/[0.08] pb-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 block">
            LEGAL &amp; COMPLIANCE
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline">
            Terms of Service<span className="text-[#FF5500]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Last updated: October 2026 · Governing access and ticketing on Vibe by Swaniki
          </p>

          {/* Tab Navigation (District / Modern Product Style) */}
          <div className="flex items-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Terms of Service
            </button>
            <Link
              href="/privacy"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition"
            >
              Privacy Policy
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('guidelines')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'guidelines'
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Community Guidelines
            </button>
          </div>
        </div>

        {/* Executive Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-1">
            <Ticket className="w-4 h-4 text-[#FF5500]" />
            <h3 className="text-xs font-bold text-white">Genuine Passes</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Tamper-proof digital QR entry codes for every confirmed guest.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">DPDP 2023 Compliant</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              We never sell your data and process info solely for verified entry.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-1">
            <Users className="w-4 h-4 text-[#FF5500]" />
            <h3 className="text-xs font-bold text-white">Fair Community</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Zero tolerance for scalping, harassment, or unlawful conduct.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-1">
            <Mail className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white">48h SLA Support</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Dedicated grievance officer response for any ticketing queries.
            </p>
          </div>
        </div>

        {/* Structured Terms Content */}
        {activeTab === 'terms' && (
          <div className="space-y-8 text-xs sm:text-sm text-white/70 leading-relaxed">
            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
                <span>1. Overview &amp; Agreement</span>
              </h2>
              <p>
                Welcome to <strong>Vibe by Swaniki</strong> (&quot;Vibe&quot;, &quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;). By accessing or using vibe.swaniki.com, booking passes, creating events, or interacting with our mobile services, you agree to these Terms. If you do not agree with any provision, please refrain from using the platform.
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
                <span>2. Ticketing, Passes &amp; Gate Entry</span>
              </h2>
              <div className="space-y-2">
                <p>
                  • <strong>Digital Passes:</strong> All RSVPs and tickets generate a verifiable cryptographic QR code. Passes must be presented at the venue gate for check-in.
                </p>
                <p>
                  • <strong>Partner Ticketing:</strong> For events hosted on partner platforms (such as District, BookMyShow, or Paytm Insider), ticket purchases and refund rules are governed by the respective partner&apos;s checkout terms.
                </p>
                <p>
                  • <strong>Venue Admission:</strong> Event hosts and venues retain the right of admission subject to statutory age verification (e.g. 18+ or 21+ for nightlife) and venue capacity.
                </p>
              </div>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
                <span>3. Organizer &amp; Host Obligations</span>
              </h2>
              <p>
                When creating or publishing an event on Vibe, organizers warrant that:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-white/60">
                <li>They possess valid permissions and licenses required by local authorities for their gathering.</li>
                <li>All details (date, timings, venue address, and pricing) are authentic and accurately stated.</li>
                <li>Confirmed ticket holders will be accommodated within the designated venue limits.</li>
              </ul>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
                <span>4. Intermediary Status &amp; Liability</span>
              </h2>
              <p>
                Vibe operates as an intermediary under Section 79 of the Information Technology Act, 2000. We do not organize or control physical venues. To the extent permitted by Indian law, Vibe and Swaniki are not liable for third-party venue disruptions, personal property damage, or unauthorized attendee actions.
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
                <span>5. Governing Law &amp; Grievance Redressal</span>
              </h2>
              <p>
                These Terms are governed by the laws of India. In accordance with the Information Technology (Intermediary Guidelines) Rules, 2021 and India&apos;s Digital Personal Data Protection Act, 2023, the Grievance Redressal Officer can be contacted at:
              </p>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/80 space-y-1">
                <p><strong>Grievance Officer:</strong> Swaniki Legal &amp; Compliance</p>
                <p><strong>Email:</strong> <a href="mailto:grievance@swaniki.com" className="text-[#FF5500] hover:underline">grievance@swaniki.com</a></p>
                <p><strong>Jurisdiction:</strong> Mumbai, Maharashtra, India</p>
              </div>
            </section>
          </div>
        )}

        {/* Community Guidelines Tab */}
        {activeTab === 'guidelines' && (
          <div className="space-y-6 text-xs sm:text-sm text-white/70 leading-relaxed">
            <div className="p-4 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-3">
              <h2 className="text-sm font-bold text-white">Community Code of Conduct</h2>
              <p className="text-xs text-white/60">
                Vibe is built for good people and real connections. We ask every attendee and host to honor these shared principles:
              </p>
              <ul className="space-y-2 text-xs text-white/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Respect &amp; Inclusivity:</strong> Treat fellow attendees, artists, and event staff with dignity. Hate speech, discrimination, and uninvited harassment are strictly prohibited.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Safe Spaces:</strong> Never bring prohibited substances, weapons, or cause disorderly disturbances at gatherings.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Authentic Identity:</strong> Do not impersonate other creators, event producers, or community members.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
