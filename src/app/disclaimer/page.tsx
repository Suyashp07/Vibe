'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { ShieldAlert, ArrowLeft, ExternalLink, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function DisclaimerPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Platform Disclaimer</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Disclaimer & Partner Advisory<span className="text-[#FF5500]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Last Updated: October 2026 · Vibe by Swaniki Platform Governance
          </p>
        </div>

        {/* Content Body */}
        <div className="pt-8 space-y-10 text-xs sm:text-sm text-white/80 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>1. Nature of the Platform & Intermediary Role</span>
            </h2>
            <p>
              <strong>Vibe by Swaniki</strong> operates as a digital discovery, networking, and event management platform. We act as an intermediary under Section 79 of the Information Technology Act, 2000 and applicable intermediary guidelines. While we provide technology for community hosts to organize gatherings and for attendees to discover experiences, Vibe is not the direct creator, producer, or promoter of third-party events listed on the service unless explicitly stated otherwise.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>2. Third-Party Ticketing & Partner Listed Events</span>
            </h2>
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Important Notice Regarding External Bookings</span>
              </div>
              <p className="text-white/70">
                Certain experiences featured on Vibe are curated from or ticketing-fulfilled by external partners including <strong>District</strong>, <strong>BookMyShow</strong>, <strong>Paytm Insider</strong>, <strong>Unstop</strong>, <strong>Luma</strong>, or individual venue websites.
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-white/60 text-xs pt-1">
                <li>
                  When you tap <strong>&quot;Book Tickets&quot;</strong>, you are redirected securely to the official ticketing partner&apos;s site.
                </li>
                <li>
                  Ticket payment processing, seat allocation, delivery, cancellation, refunds, and chargebacks are governed entirely by the terms and privacy policy of that respective ticketing partner.
                </li>
                <li>
                  Vibe collects no ticketing commission, holds no ticket inventory for external events, and assumes no liability for disputes arising from external ticketing gateways.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>3. Host Responsibility, Venue Safety & Permissions</span>
            </h2>
            <p>
              Event organizers, venue managers, and community leaders who list events on Vibe are solely responsible for:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/70">
              <li>Securing all requisite civic, municipal, police, performance, and copyright licenses (including PPL/IPRS permissions where required by Indian law).</li>
              <li>Ensuring premises safety, fire safety compliance, first aid provision, and venue crowd capacity limits.</li>
              <li>Enforcing local age restrictions (e.g. 18+ or 21+ policies for nightlife venues serving alcohol) under state excise regulations.</li>
              <li>Adhering to anti-harassment, non-discrimination, and attendee welfare standards.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>4. Participant Assumption of Risk (Sports, Fitness & Outdoor Gatherings)</span>
            </h2>
            <p>
              Participation in flash vibes, box cricket, badminton, padel tournaments, runs, treks, and outdoor gatherings involves inherent physical activity. Attendees voluntarily assume all risks of participation, including personal property loss, physical injury, or fatigue. Vibe advises all participants to assess their physical fitness, wear appropriate safety gear (such as non-marking court shoes), and exercise sound judgment.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>5. Information Accuracy & Event Changes</span>
            </h2>
            <p>
              Event timings, artist lineups, and venue arrangements are subject to change by hosts or due to unforeseen conditions (such as inclement weather). While Vibe utilizes AI verification pipelines and editor reviews to maintain accurate listings, we recommend verifying exact details with the host via pass chat or official announcement channels before traveling.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>6. Reporting Content & Grievance Contact</span>
            </h2>
            <p>
              If you identify an event listing that violates community guidelines, infringes intellectual property, or presents fraudulent details, please report it immediately to our trust & safety desk at:
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white/80 space-y-1">
              <div>Trust & Safety: safety@swaniki.com</div>
              <div>Legal & Grievances: legal@swaniki.com</div>
              <div>Response Timeline: Within 24 hours pursuant to Indian Intermediary Guidelines</div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
