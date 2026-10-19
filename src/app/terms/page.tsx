'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { FileText, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/20 text-[#FF5500] text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Terms & Conditions<span className="text-[#FF5500]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Last Updated: October 2026 · Governing Access to Vibe by Swaniki
          </p>
        </div>

        {/* Content Body */}
        <div className="pt-8 space-y-10 text-xs sm:text-sm text-white/80 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>1. Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, registering an account, creating an event, or reserving a pass on <strong>Vibe by Swaniki</strong> (accessible via vibe.swaniki.com or our mobile web applications), you agree to be bound by these Terms and Conditions (&quot;Terms&quot;) and our Privacy Policy. If you do not agree to these Terms, you must discontinue using our services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>2. Eligibility & Account Responsibilities</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>You must be at least 18 years of age to register as an independent event organizer or book age-restricted experiences.</li>
              <li>You agree to provide accurate, truthful details (including name, email, and contact information) when creating profiles or RSVP passes.</li>
              <li>You are responsible for maintaining the confidentiality of your session tokens and credentials. Notify Vibe immediately if you suspect unauthorized access.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>3. Event Creation & Organizer Obligations</span>
            </h2>
            <p>
              When hosting an event through Vibe (via web wizard, AI generator, WhatsApp bot, or Telegram bot), you warrant and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>The event does not promote hate speech, illegal substances, unlawful gambling, violence, or dangerous activities.</li>
              <li>You possess the legal authority to book the venue, conduct the activity, and enforce safety guidelines.</li>
              <li>You will honor all confirmed attendee RSVPs within the designated venue capacity limit.</li>
              <li>You will not misrepresent ticket prices or charge unauthorized gate fees for events listed as &quot;Free RSVP&quot;.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>4. Digital Passes & Ticketing</span>
            </h2>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>
                <strong>Vibe Native Passes:</strong> Passes issued via Vibe QR verification represent admission confirmation subject to host approval and venue capacity. Free RSVP passes do not guarantee entry if attendees arrive past designated cut-off times.
              </li>
              <li>
                <strong>Partner Ticketing Links:</strong> For third-party events listed on Vibe (such as District, BookMyShow, or Paytm Insider), ticketing transactions occur directly on the partner platform under the partner&apos;s contractual terms.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>5. Intellectual Property</span>
            </h2>
            <p>
              All trademarks, logos, interface designs, algorithms, AI vibe extraction pipelines, and codebases associated with Vibe and Swaniki remain the exclusive intellectual property of Swaniki. Users retain ownership of user-generated posters and photographs uploaded to event pages, granting Vibe a non-exclusive license to display and distribute such content for discovery purposes.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>6. Limitation of Liability</span>
            </h2>
            <p>
              To the maximum extent permitted by Indian law, Vibe by Swaniki and its affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages arising from: (a) personal injury, property loss, or accidents occurring at host venues; (b) cancellations or delays initiated by event organizers; or (c) interruptions in internet access or third-party ticketing platforms.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
              <span>7. Governing Law & Dispute Resolution</span>
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Mumbai, Maharashtra, India</strong>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
