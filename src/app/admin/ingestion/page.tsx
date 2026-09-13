'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Send,
  Users,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  Code2,
  Calendar,
  MapPin,
  Tag,
  Radio
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function AdminIngestionPage() {
  const { isSuperAdmin } = useAuth();

  // Test Scraper State
  const [testUrl, setTestUrl] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [creatingFromTest, setCreatingFromTest] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Curator Management State
  const [curators, setCurators] = useState<any[]>([]);
  const [curatorsLoading, setCuratorsLoading] = useState(true);
  const [curatorError, setCuratorError] = useState<string | null>(null);

  // New Curator Form State
  const [newChatId, setNewChatId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('curator');
  const [newNotes, setNewNotes] = useState('');
  const [addingCurator, setAddingCurator] = useState(false);

  const fetchCurators = async () => {
    setCuratorsLoading(true);
    setCuratorError(null);
    try {
      const res = await fetch('/api/admin/curators');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch curators');
      setCurators(data.curators || []);
    } catch (err: any) {
      setCuratorError(err.message);
    } finally {
      setCuratorsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurators();
  }, []);

  const handleTestScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim()) return;

    setTestLoading(true);
    setTestError(null);
    setTestResult(null);
    setCreateSuccess(null);

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

  const handleAddCurator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatId.trim()) return;

    setAddingCurator(true);
    try {
      const res = await fetch('/api/admin/curators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: newChatId.trim(),
          username: newUsername.trim(),
          name: newName.trim(),
          role: newRole,
          notes: newNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add curator');

      setNewChatId('');
      setNewUsername('');
      setNewName('');
      setNewNotes('');
      await fetchCurators();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingCurator(false);
    }
  };

  const handleRevokeCurator = async (chatId: string) => {
    if (!confirm(`Are you sure you want to revoke bot curator access for Chat ID ${chatId}?`)) return;

    try {
      const res = await fetch(`/api/admin/curators?chat_id=${chatId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke curator');
      await fetchCurators();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight font-display">
          Link Ingestion & Telegram Curators
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Dry-run web scraping tests and dynamically manage authorized Telegram bot curators
        </p>
      </div>

      {/* Module 1: Scraper Testing Console */}
      <div className="rounded-2xl bg-[#0B0F19] border border-zinc-800/90 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-[#E8621A]/20 border border-[#E8621A]/30 flex items-center justify-center text-[#FF8442]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Live Ingestion Diagnostic Bench</h2>
            <p className="text-xs text-zinc-400">
              Test how District, BookMyShow, Luma, or Unstop links parse without saving to database
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8621A]"
          />
          <button
            type="submit"
            disabled={testLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E8621A] to-[#FF8442] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{testLoading ? 'Testing...' : 'Test Ingestion'}</span>
          </button>
        </form>

        {testError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{testError}</span>
          </div>
        )}

        {/* Results view */}
        {testResult && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Extraction Diagnostic Passed
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Platform: <strong className="text-zinc-200">{testResult.scraped?.platform}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Parsed Summary Card */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                <h3 className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider">
                  Extracted Event Entity
                </h3>
                {testResult.extracted ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-zinc-500">Title:</span>{' '}
                      <span className="text-white font-bold">{testResult.extracted.title}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Venue:</span>{' '}
                      <span className="text-zinc-300">{testResult.extracted.venue_name}, {testResult.extracted.city}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Price Text:</span>{' '}
                      <span className="text-emerald-400 font-mono font-semibold">
                        {testResult.extracted.price_text || 'None detected'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Source Platform:</span>{' '}
                      <span className="text-cyan-400 font-mono">
                        {testResult.extracted.source_platform}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Suggested Category:</span>{' '}
                      <span className="text-orange-400 font-mono">
                        {testResult.extracted.category}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500">
                    No structured extraction generated ({testResult.aiError || 'Unknown'})
                  </div>
                )}
              </div>

              {/* Scraped Poster Preview */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider mb-2">
                    Scraped Poster Image
                  </h3>
                  {testResult.scraped?.image ? (
                    <div className="h-32 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                      <img
                        src={testResult.scraped.image}
                        alt="Scraped Poster"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 rounded-lg border border-dashed border-zinc-800 flex items-center justify-center text-xs text-zinc-600 font-mono">
                      No poster image tag found
                    </div>
                  )}
                </div>
                {testResult.scraped?.image && (
                  <a
                    href={testResult.scraped.image}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#FF8442] hover:underline mt-2 flex items-center gap-1"
                  >
                    <span>Inspect Raw Image</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Raw JSON Accordion */}
            <details className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs">
              <summary className="cursor-pointer font-mono text-zinc-400 font-semibold flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5" />
                <span>View Full Extraction JSON Payload</span>
              </summary>
              <pre className="mt-3 p-3 rounded-lg bg-black/60 text-[11px] text-zinc-300 font-mono overflow-x-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Module 2: Dynamic Telegram Curator Management */}
      <div className="rounded-2xl bg-[#0B0F19] border border-zinc-800/90 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Authorized Telegram Curators</h2>
              <p className="text-xs text-zinc-400">
                Manage who is permitted to send flyers or link drops to the Telegram ingestion bot
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            Fallback: env.TELEGRAM_ADMIN_CHAT_ID
          </span>
        </div>

        {/* Add Curator Form (Super Admin Only) */}
        {isSuperAdmin ? (
          <form
            onSubmit={handleAddCurator}
            className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3"
          >
            <span className="text-xs font-bold text-zinc-200 uppercase font-mono tracking-wider">
              Whitelist New Telegram Curator
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Telegram Chat ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5293819401"
                  value={newChatId}
                  onChange={(e) => setNewChatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8621A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Telegram @handle
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8621A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Curator Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suyash Pandey"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8621A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#E8621A]"
                >
                  <option value="curator">Curator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <input
                type="text"
                placeholder="Optional notes or affiliation (e.g. Delhi Music Curator)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-2/3 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8621A]"
              />
              <button
                type="submit"
                disabled={addingCurator}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addingCurator ? 'Authorizing...' : 'Authorize Curator'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400">
            Super administrator privileges are required to add or revoke Telegram curators.
          </div>
        )}

        {/* Curators Table */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          {curatorsLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono">
              Loading authorized curators...
            </div>
          ) : curators.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No database curators yet. The bot currently permits your environment variable ID (TELEGRAM_ADMIN_CHAT_ID).
            </div>
          ) : (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/60 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Chat ID</th>
                  <th className="py-3 px-4 font-semibold">Curator</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Notes</th>
                  <th className="py-3 px-4 font-semibold">Added By</th>
                  {isSuperAdmin && <th className="py-3 px-4 font-semibold text-right">Revoke</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {curators.map((c) => (
                  <tr key={c.id || c.chat_id} className="hover:bg-zinc-800/20 transition">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {c.chat_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-200">{c.name || 'Unnamed'}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {c.username ? `@${c.username}` : 'No username'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        c.role === 'super_admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {c.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-[11px]">
                      {c.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-[11px] font-mono">
                      {c.added_by || 'system'}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRevokeCurator(c.chat_id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Revoke curator authorization"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
