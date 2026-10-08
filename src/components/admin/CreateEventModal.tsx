'use client';

import React, { useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { CATEGORIES } from './types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateEventModalProps) {
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    city: 'Mumbai',
    venue_name: '',
    category: 'Tech & AI',
    price_text: 'Free Entry',
    cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    external_ticket_url: '',
    status: 'live',
  });

  if (!isOpen) return null;

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setCreateForm({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          time: '18:00',
          city: 'Mumbai',
          venue_name: '',
          category: 'Tech & AI',
          price_text: 'Free Entry',
          cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
          external_ticket_url: '',
          status: 'live',
        });
        onClose();
        await onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create event');
      }
    } catch (err: any) {
      alert(`Create event error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#E2E8F0] shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="font-bold text-sm text-[#0A0A0A]">Create Event Manually</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0A0A0A] cursor-pointer">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Pune Tech Founders Mixer"
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">Date</label>
              <input
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">Time</label>
              <input
                type="time"
                value={createForm.time}
                onChange={(e) => setCreateForm((p) => ({ ...p, time: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">City</label>
              <input
                type="text"
                value={createForm.city}
                onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">Venue Name</label>
              <input
                type="text"
                value={createForm.venue_name}
                onChange={(e) => setCreateForm((p) => ({ ...p, venue_name: e.target.value }))}
                placeholder="WeWork / Cafe"
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">Category</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">Price</label>
              <input
                type="text"
                value={createForm.price_text}
                onChange={(e) => setCreateForm((p) => ({ ...p, price_text: e.target.value }))}
                placeholder="Free Entry or ₹499"
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Cover Image URL</label>
            <input
              type="url"
              value={createForm.cover_image_url}
              onChange={(e) => setCreateForm((p) => ({ ...p, cover_image_url: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">External Ticket URL (Optional)</label>
            <input
              type="url"
              value={createForm.external_ticket_url}
              onChange={(e) => setCreateForm((p) => ({ ...p, external_ticket_url: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Description</label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Event overview..."
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create & Publish Event</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
