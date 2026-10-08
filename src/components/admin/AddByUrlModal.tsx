'use client';

import React, { useState } from 'react';
import {
  XCircle,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface AddByUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function AddByUrlModal({
  isOpen,
  onClose,
  onSuccess,
}: AddByUrlModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [urlResult, setUrlResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleAddByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = urlInput
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      setUrlResult({ ok: false, message: 'Please enter at least one URL.' });
      return;
    }
    const invalid = urls.find((u) => !/^https?:\/\//i.test(u));
    if (invalid) {
      setUrlResult({ ok: false, message: `Invalid link (must start with http:// or https://): ${invalid}` });
      return;
    }

    setAddingUrl(true);
    setUrlResult(null);

    let created = 0;
    let duplicates = 0;
    let failed = 0;

    for (const u of urls.slice(0, 8)) {
      try {
        const res = await fetch('/api/admin/events/from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: u }),
        });
        const data = await res.json();
        if (res.ok && (data.success || data.ok)) {
          if (data.isDuplicate) duplicates++;
          else created++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setAddingUrl(false);
    setUrlResult({
      ok: failed === 0,
      message: `Ingested ${created} new event(s), flagged ${duplicates} duplicate(s), ${failed} failed.`,
    });
    if (created > 0 || duplicates > 0) {
      await onSuccess();
    }
  };

  const handleClose = () => {
    onClose();
    setUrlResult(null);
    setUrlInput('');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#E2E8F0] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-[#0A0A0A]">Add Event by URL</h2>
            <p className="text-[11px] text-[#64748B]">Batch ingest up to 8 links at once</p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#94A3B8] hover:text-[#0A0A0A] cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleAddByUrl} className="p-6 space-y-4">
          <div>
            <p className="text-xs text-[#64748B] mb-2 leading-relaxed">
              Paste event links from BookMyShow, Luma, District, etc. (one per line). AI will scrape full details, posters, and queue them for review.
            </p>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              rows={5}
              placeholder={'https://in.bookmyshow.com/events/...\nhttps://lu.ma/...\nhttps://www.district.in/events/...'}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] font-mono transition-colors placeholder:text-[#94A3B8]"
            />
          </div>

          {urlResult && (
            <div
              className={`flex items-start gap-2 p-3 rounded-xl text-xs whitespace-pre-wrap ${
                urlResult.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {urlResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{urlResult.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={addingUrl || !urlInput.trim()}
            className="w-full py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {addingUrl ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting & Queueing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Ingest URLs to Review Queue</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
