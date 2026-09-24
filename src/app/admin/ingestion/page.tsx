'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Sparkles,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Code2,
  ArrowLeft,
  Loader2
} from 'lucide-react';

export default function AdminIngestionPage() {
  // Test Scraper State
  const [testUrl, setTestUrl] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim()) return;

    setTestLoading(true);
    setTestError(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/ingest-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scraping failed');
      setTestResult(data);
    } catch (err: any) {
      setTestError(err.message || 'Error occurred while testing link scraping');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back Link & Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#0A0A0A] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Queue</span>
            </Link>
          </div>
          <h1 className="text-xl font-black text-[#0A0A0A] tracking-tight">
            Live Ingestion Diagnostic Bench
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Test how District, BookMyShow, Luma, or Unstop links parse without saving to database.
          </p>
        </div>
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
          Telegram Bot: Open to All Users
        </span>
      </div>

      {/* Scraper Testing Console */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E8621A]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0A0A0A]">URL Parser Test</h2>
            <p className="text-xs text-[#64748B]">
              Simulate real-time scraping & AI entity extraction for any event link
            </p>
          </div>
        </div>

        <form onSubmit={handleTestScrape} className="flex gap-2">
          <input
            type="url"
            required
            placeholder="Paste event link (e.g. https://district.in/events/..., https://in.bookmyshow.com/...)"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#0A0A0A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0A0A0A]"
          />
          <button
            type="submit"
            disabled={testLoading}
            className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 shrink-0"
          >
            {testLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Ingestion</span>
              </>
            )}
          </button>
        </form>

        {testError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{testError}</span>
          </div>
        )}

        {/* Results view */}
        {testResult && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Extraction Diagnostic Passed
              </span>
              <span className="text-[11px] text-[#64748B] font-mono">
                Platform: <strong className="text-[#0A0A0A]">{testResult.scraped?.platform || 'Unknown'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Parsed Summary Card */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <h3 className="text-xs font-bold text-[#0A0A0A] font-mono uppercase tracking-wider">
                  Extracted Event Entity
                </h3>
                {testResult.extracted ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[#64748B]">Title:</span>{' '}
                      <span className="text-[#0A0A0A] font-bold">{testResult.extracted.title}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Venue:</span>{' '}
                      <span className="text-[#0A0A0A]">{testResult.extracted.venue_name}, {testResult.extracted.city}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Price Text:</span>{' '}
                      <span className="text-emerald-700 font-mono font-semibold">
                        {testResult.extracted.price_text || 'None detected'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Source Platform:</span>{' '}
                      <span className="text-blue-600 font-mono">
                        {testResult.extracted.source_platform}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Suggested Category:</span>{' '}
                      <span className="text-orange-600 font-mono font-semibold">
                        {testResult.extracted.category}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#94A3B8]">
                    No structured extraction generated ({testResult.aiError || 'Unknown'})
                  </div>
                )}
              </div>

              {/* Scraped Poster Preview */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#0A0A0A] font-mono uppercase tracking-wider mb-2">
                    Scraped Poster Image
                  </h3>
                  {testResult.scraped?.image ? (
                    <div className="h-32 rounded-lg overflow-hidden border border-[#E2E8F0] bg-white">
                      <img
                        src={testResult.scraped.image}
                        alt="Scraped Poster"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 rounded-lg border border-dashed border-[#CBD5E1] flex items-center justify-center text-xs text-[#94A3B8] font-mono">
                      No poster image tag found
                    </div>
                  )}
                </div>
                {testResult.scraped?.image && (
                  <a
                    href={testResult.scraped.image}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#2563EB] hover:underline mt-2 flex items-center gap-1"
                  >
                    <span>Inspect Raw Image</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Raw JSON Accordion */}
            <details className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs">
              <summary className="cursor-pointer font-mono text-[#64748B] font-semibold flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5" />
                <span>View Full Extraction JSON Payload</span>
              </summary>
              <pre className="mt-3 p-3 rounded-lg bg-white border border-[#E2E8F0] text-[11px] text-[#0A0A0A] font-mono overflow-x-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
