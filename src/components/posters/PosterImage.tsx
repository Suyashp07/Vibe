'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, ImageOff } from 'lucide-react';

export interface PosterImageProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  containerRatio?: number; // e.g. 4/5 (0.8) for cards, 16/9 (1.78) for banners
  ratio?: 'card' | 'hero' | 'thumb' | 'auto';
  blurDataURL?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  dominantColor?: string;
  isLowRes?: boolean;
  sizes?: string;
  badge?: React.ReactNode;
  categoryName?: string;
}

export default function PosterImage({
  src,
  alt,
  width,
  height,
  containerRatio,
  ratio = 'auto',
  blurDataURL,
  priority = false,
  className = '',
  imageClassName = '',
  dominantColor = '#07133A',
  isLowRes = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  badge,
  categoryName,
}: PosterImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // If source is missing or broken, display a rich branded fallback placeholder
  if (!src || hasError) {
    return (
      <div
        className={`relative w-full h-full min-h-[160px] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden bg-gradient-to-br from-[#07133A] via-[#091D4C] to-[#002570] text-white ${className}`}
        style={{ backgroundColor: dominantColor }}
      >
        <div className="absolute -inset-10 opacity-30 bg-[radial-gradient(circle_at_center,rgba(8,185,245,0.4)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-2 max-w-[85%]">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#08B9F5] shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-white/70 line-clamp-1">
            {categoryName || 'Vibe Event'}
          </span>
          <p className="text-sm font-black line-clamp-2 leading-snug drop-shadow-sm">
            {alt || 'Exclusive Event'}
          </p>
        </div>
        {badge && <div className="absolute top-3 left-3 z-20 pointer-events-none">{badge}</div>}
      </div>
    );
  }

  // Determine aspect ratio of original poster
  const posterRatio = width && height && height > 0 ? width / height : undefined;

  // Determine container target aspect ratio
  let targetRatio = containerRatio;
  if (!targetRatio) {
    if (ratio === 'card') targetRatio = 4 / 5; // 0.8
    else if (ratio === 'hero') targetRatio = 16 / 9; // 1.777
    else if (ratio === 'thumb') targetRatio = 1; // 1.0
  }

  // Near-match optimization: if poster ratio is within 10% of container ratio,
  // cropping is visually negligible, so object-cover looks pristine.
  // Otherwise, strictly object-contain with blurred backdrop to prevent ANY text cut-off!
  const isNearMatch = Boolean(
    targetRatio &&
    posterRatio &&
    Math.abs(posterRatio - targetRatio) / targetRatio <= 0.10
  );

  const isTransparent = src.toLowerCase().endsWith('.png');

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-[#050A18] ${className}`}
      style={{
        backgroundColor: dominantColor,
      }}
    >
      {/* ===================================================================== */}
      {/* LAYER 1: BACKDROP (Blurred & darkened ambient poster glow)            */}
      {/* ===================================================================== */}
      {!isNearMatch && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <Image
            src={src}
            alt=""
            fill
            sizes="80px"
            unoptimized={src.startsWith('data:')}
            className="object-cover scale-125 blur-2xl brightness-50 saturate-125 opacity-70 transform-gpu"
            priority={false}
          />
          {/* Subtle dark vignette scrim */}
          <div className="absolute inset-0 bg-black/35" />
        </div>
      )}

      {/* ===================================================================== */}
      {/* LAYER 2: FOREGROUND POSTER (Full artwork, NEVER cropped)              */}
      {/* ===================================================================== */}
      <div className="relative w-full h-full flex items-center justify-center p-1 sm:p-2">
        {/* Subtle dark base panel for transparent PNGs */}
        {isTransparent && (
          <div className="absolute inset-2 rounded-2xl bg-black/40 backdrop-blur-xs pointer-events-none" />
        )}

        <div
          className={`relative w-full h-full flex items-center justify-center ${
            isLowRes ? 'max-w-[360px] max-h-[360px]' : ''
          }`}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            unoptimized={src.startsWith('data:')}
            placeholder={blurDataURL ? 'blur' : 'empty'}
            blurDataURL={blurDataURL}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoaded(true)}
            className={`transition-all duration-500 ease-out ${
              isNearMatch ? 'object-cover' : 'object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]'
            } ${!isLoaded && !blurDataURL ? 'opacity-0 scale-98' : 'opacity-100 scale-100'} ${imageClassName}`}
          />
        </div>
      </div>

      {/* Optional Badge Overlay (Source, Category, etc.) */}
      {badge && <div className="absolute top-3 left-3 z-20 pointer-events-none">{badge}</div>}
    </div>
  );
}

