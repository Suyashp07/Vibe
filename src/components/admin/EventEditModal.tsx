'use client';

import React, { useState } from 'react';
import { X, Save, AlertCircle, Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface EventEditModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFields: Record<string, any>) => Promise<void>;
}

export default function EventEditModal({
  event,
  isOpen,
  onClose,
  onSave,
}: EventEditModalProps) {
  if (!isOpen || !event) return null;

  const [title, setTitle] = useState(event.title || '');
  const [tagline, setTagline] = useState(event.tagline || '');
  const [description, setDescription] = useState(event.description || '');
  const [date, setDate] = useState(event.date || '');
  const [time, setTime] = useState(event.time || '');
  const [venueName, setVenueName] = useState(event.venue_name || '');
  const [venueAddress, setVenueAddress] = useState(event.venue_address || '');
  const [city, setCity] = useState(event.city || 'Delhi');
  const [priceInr, setPriceInr] = useState(event.price_inr ?? (event.price ?? 0));
  const [ticketType, setTicketType] = useState(event.ticket_type || 'free');
  const [isExternal, setIsExternal] = useState(Boolean(event.is_external));
  const [platform, setPlatform] = useState(event.platform || 'vibe');
  const [ticketLink, setTicketLink] = useState(event.ticket_link || event.external_url || '');
  const [coverImage, setCoverImage] = useState(event.cover_image || '');
  const [status, setStatus] = useState(event.status || 'draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave({
        title,
        tagline,
        description,
        date,
        time,
        venue_name: venueName,
        venue_address: venueAddress,
        city,
        price_inr: Number(priceInr),
        price: Number(priceInr),
        ticket_type: ticketType,
        is_external: isExternal,
        platform: isExternal ? platform : 'vibe',
        ticket_link: ticketLink.trim() || null,
        external_url: ticketLink.trim() || null,
        cover_image: coverImage.trim(),
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save event updates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F131E] border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0B0F19]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8621A]/20 border border-[#E8621A]/30 flex items-center justify-center text-[#FF8442]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Edit Event Metadata & Pricing</h2>
              <p className="text-[11px] text-zinc-400 font-mono">ID: {event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Tagline */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
              />
            </div>
          </div>

          {/* Date, Time & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Date</label>
              <input
                type="text"
                value={date}
                placeholder="e.g. 26 Sept 2026"
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Time</label>
              <input
                type="text"
                value={time}
                placeholder="e.g. 7:00 PM"
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
              />
            </div>
          </div>

          {/* Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Venue Name</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Venue Address</label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
              />
            </div>
          </div>

          {/* Pricing & Ticket Rules */}
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-orange-300 font-mono uppercase tracking-wider">
              Pricing & Ingestion Controls
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Price (₹ INR)</label>
                <input
                  type="number"
                  min="0"
                  value={priceInr}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPriceInr(val);
                    if (val === 0) setTicketType('free');
                    else setTicketType('paid');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Ticket Type</label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
                >
                  <option value="free">Free RSVP</option>
                  <option value="paid">Paid Ticket</option>
                  <option value="approval">Approval Required</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Publication Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
                >
                  <option value="draft">Draft (Unpublished)</option>
                  <option value="published">Published (Live)</option>
                </select>
              </div>
            </div>

            {/* External Platform Toggle */}
            <div className="pt-2 border-t border-zinc-800 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isExternal}
                  onChange={(e) => setIsExternal(e.target.checked)}
                  className="rounded border-zinc-700 text-[#E8621A] focus:ring-0 w-4 h-4 bg-zinc-950"
                />
                <span className="text-xs font-medium text-zinc-200">
                  External Event (District, BookMyShow, Luma, Unstop redirect)
                </span>
              </label>

              {isExternal && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
                    >
                      <option value="district">District</option>
                      <option value="bookmyshow">BookMyShow</option>
                      <option value="luma">Luma</option>
                      <option value="unstop">Unstop</option>
                      <option value="insider">Paytm Insider</option>
                      <option value="external">Other External</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Direct Ticket / Booking Link
                    </label>
                    <input
                      type="url"
                      value={ticketLink}
                      placeholder="https://district.in/events/..."
                      onChange={(e) => setTicketLink(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Cover Image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A]"
              />
              {coverImage && (
                <a
                  href={coverImage}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-[#E8621A] resize-y"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E8621A] to-[#FF8442] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
