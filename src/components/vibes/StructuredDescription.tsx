'use client';

import React from 'react';
import { ExternalLink, MapPin, FileText, Link as LinkIcon } from 'lucide-react';

interface StructuredDescriptionProps {
  description: string;
  className?: string;
}

export function splitIntoStructuredLines(raw: string): string[] {
  if (!raw) return [];
  let s = raw.trim();

  // Normalize all newline formats
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Separate leading celebration/party banners
  s = s.replace(/^(🎃[^\n]+?🎃)\s*/g, '$1\n\n');

  // Insert newlines before bullet emojis or metadata icons if jammed without linebreaks
  s = s.replace(
    /([^\n])\s*(🗓️|📅|📍|⏰|🕒|🎮|🏆|🤝|⚠️|🎟️|🎫|📌|⚡|🔥|✨|💡|👉|•|▪️|▫️)/g,
    '$1\n$2'
  );

  // Separate sentence endings before key guidelines
  s = s.replace(
    /([.!?])\s*(Cosplays are welcome|If you['’]re cosplaying|Spots are limited)/gi,
    '$1\n\n$2'
  );

  // Insert double newlines before major section labels
  s = s.replace(
    /([^\n])\s*(Venue Link:|Registration link:|Register here:|Register now:|Register:|Tickets?:|RSVP:|Note:|Guidelines:|Location:|Price:|Entry Fee:)/gi,
    '$1\n\n$2'
  );

  // Ensure URLs after colons are placed on their own line for prominent tapping
  s = s.replace(/(:\s*)(https?:\/\/[^\s]+)/gi, '$1\n$2');

  return s
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function renderFormattedLine(line: string, index: number) {
  // Check if line is purely a URL
  const urlRegex = /^(https?:\/\/[^\s]+)$/i;
  const matchPureUrl = line.match(urlRegex);

  if (matchPureUrl) {
    const url = matchPureUrl[1];
    const isMapUrl = url.includes('maps.app.goo.gl') || url.includes('google.com/maps') || url.includes('goo.gl/maps');
    const isFormUrl = url.includes('forms.gle') || url.includes('docs.google.com/forms');

    return (
      <div key={index} className="py-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#FF8542] hover:text-[#FFA066] transition-all break-all max-w-full group shadow-xs cursor-pointer"
        >
          {isMapUrl ? (
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : isFormUrl ? (
            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          ) : (
            <LinkIcon className="w-3.5 h-3.5 text-[#FF8542] shrink-0" />
          )}
          <span className="truncate max-w-[240px] sm:max-w-xs">{url}</span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0 transition-opacity" />
        </a>
      </div>
    );
  }

  // Check if line contains a label like "Registration link:" or "Venue Link:"
  const labelMatch = line.match(/^([A-Za-z\s]+:)\s*(.*)$/);
  if (labelMatch) {
    const label = labelMatch[1];
    const rest = labelMatch[2];

    return (
      <div key={index} className="py-0.5">
        <span className="text-white/90 font-bold uppercase tracking-wide text-[11px] block text-[#FF8542]">
          {label}
        </span>
        {rest && <span className="text-neutral-300 text-xs block mt-0.5">{rest}</span>}
      </div>
    );
  }

  // Check if line starts with an emoji bullet
  const bulletEmojiRegex = /^(🗓️|📅|📍|⏰|🕒|🎮|🏆|🤝|⚠️|🎟️|🎫|📌|⚡|🔥|✨|💡|👉|•|▪️)\s*(.*)$/;
  const bulletMatch = line.match(bulletEmojiRegex);

  if (bulletMatch) {
    const emoji = bulletMatch[1];
    const text = bulletMatch[2];

    return (
      <div key={index} className="flex items-start gap-2 py-0.5 text-neutral-300">
        <span className="shrink-0 select-none text-sm">{emoji}</span>
        <span className="text-xs sm:text-sm leading-relaxed">{text}</span>
      </div>
    );
  }

  // Regular paragraph line
  return (
    <p key={index} className="text-xs sm:text-sm text-neutral-300 leading-relaxed py-0.5">
      {line}
    </p>
  );
}

export default function StructuredDescription({
  description,
  className = '',
}: StructuredDescriptionProps) {
  if (!description || !description.trim()) {
    return (
      <p className="text-xs sm:text-sm text-neutral-400 italic">
        A small, easy-going gathering. Come solo or bring friends.
      </p>
    );
  }

  const lines = splitIntoStructuredLines(description);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {lines.map((line, idx) => renderFormattedLine(line, idx))}
    </div>
  );
}
