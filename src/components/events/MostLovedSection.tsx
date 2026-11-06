'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Sparkles, Search, Check, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem } from '@/types';

export interface MostLovedCategory {
  id: string;
  name: string;
  alt: string;
  image?: string;
  categoryFilter?: string;
  keywords?: string[];
  isCustom?: boolean;
}

// 1. Primary 10 Carousel / Grid Categories
export const MOST_LOVED_CATEGORIES: MostLovedCategory[] = [
  {
    id: 'music',
    name: 'Music',
    alt: 'Music',
    image: '/site-assets/93b82224d173105b.webp',
    categoryFilter: 'Music',
    keywords: ['music', 'gig', 'acoustic', 'sitar', 'band', 'live', 'techno', 'dj', 'synth', 'orchestra', 'singer'],
  },
  {
    id: 'concerts',
    name: 'Concerts',
    alt: 'Concerts',
    image: '/site-assets/39053defbb43a63c.webp',
    categoryFilter: 'Music',
    keywords: ['concert', 'live music', 'gig', 'live performance', 'orchestra', 'band', 'acoustic', 'sitar', 'symphony'],
  },
  {
    id: 'parties',
    name: 'Parties & Nightlife',
    alt: 'Parties & Nightlife',
    image: '/site-assets/2b0ccf40e274f844.webp',
    categoryFilter: 'Social',
    keywords: ['party', 'nightlife', 'dj', 'club', 'mixer', 'soirée', 'soiree', 'cocktail', 'celebration', 'dance', 'electronic', 'rooftop'],
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    alt: 'Food & Drinks',
    image: '/site-assets/546d76e37ce0d8e0.webp',
    categoryFilter: 'Food',
    keywords: ['food', 'dining', 'dinner', 'culinary', 'drinks', 'tasting', 'chai', 'coffee', 'bakery', 'brunch', 'cafe', 'sarafa', 'chhappan'],
  },
  {
    id: 'crafts',
    name: 'Crafts & Workshops',
    alt: 'Crafts & Workshops',
    image: '/site-assets/8f9bebffbc7bf57d.webp',
    categoryFilter: 'Workshops',
    keywords: ['workshop', 'craft', 'pottery', 'painting', 'masterclass', 'bootcamp', 'hands-on', 'learn', 'art'],
  },
  {
    id: 'festivals',
    name: 'Festivals',
    alt: 'Festivals',
    image: '/site-assets/d0af47ed09716286.webp',
    categoryFilter: 'Arts',
    keywords: ['festival', 'fest', 'carnival', 'cultural', 'celebration', 'fair', 'mela', 'gathering'],
  },
  {
    id: 'kids',
    name: 'Kids & Family',
    alt: 'Kids & Family',
    image: '/site-assets/57fa7e9248221a5f.webp',
    categoryFilter: 'Social',
    keywords: ['kids', 'family', 'children', 'all ages', 'parent', 'kid-friendly'],
  },
  {
    id: 'photography',
    name: 'Photography',
    alt: 'Photography',
    image: '/site-assets/930522db410623d7.webp',
    categoryFilter: 'Arts',
    keywords: ['photo', 'photography', 'camera', 'photowalk', 'portrait', 'visual', 'shoot'],
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    alt: 'Sports & Fitness',
    image: '/site-assets/bc422fd976b63917.webp',
    categoryFilter: 'Sports',
    keywords: ['sport', 'fitness', 'cricket', 'run', 'padel', 'football', 'badminton', 'marathon', 'turf', 'tennis', 'workout'],
  },
  {
    id: 'all',
    name: 'All Categories',
    alt: 'All Categories',
    image: '/site-assets/9117ecf9f3919d0f.webp',
    categoryFilter: 'All',
    keywords: [],
  },
];

// 2. Comprehensive Explore Categories Catalog (Matching screenshot & extra categories)
export const ALL_EXPLORE_CATEGORIES: MostLovedCategory[] = [
  {
    id: 'music',
    name: 'Music',
    alt: 'Music',
    image: '/site-assets/93b82224d173105b.webp',
    categoryFilter: 'Music',
    keywords: ['music', 'gig', 'acoustic', 'sitar', 'band', 'live', 'techno', 'dj', 'synth', 'orchestra', 'singer'],
  },
  {
    id: 'concerts',
    name: 'Concerts',
    alt: 'Concerts',
    image: '/site-assets/39053defbb43a63c.webp',
    categoryFilter: 'Music',
    keywords: ['concert', 'live music', 'gig', 'live performance', 'orchestra', 'band', 'acoustic', 'sitar', 'symphony'],
  },
  {
    id: 'parties',
    name: 'Parties & Nightlife',
    alt: 'Parties & Nightlife',
    image: '/site-assets/2b0ccf40e274f844.webp',
    categoryFilter: 'Social',
    keywords: ['party', 'nightlife', 'dj', 'club', 'mixer', 'soirée', 'soiree', 'cocktail', 'celebration', 'dance', 'electronic', 'rooftop'],
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    alt: 'Food & Drinks',
    image: '/site-assets/546d76e37ce0d8e0.webp',
    categoryFilter: 'Food',
    keywords: ['food', 'dining', 'dinner', 'culinary', 'drinks', 'tasting', 'chai', 'coffee', 'bakery', 'brunch', 'cafe', 'sarafa', 'chhappan'],
  },
  {
    id: 'crafts',
    name: 'Crafts & Workshops',
    alt: 'Crafts & Workshops',
    image: '/site-assets/8f9bebffbc7bf57d.webp',
    categoryFilter: 'Workshops',
    keywords: ['workshop', 'craft', 'pottery', 'painting', 'masterclass', 'bootcamp', 'hands-on', 'learn', 'art'],
  },
  {
    id: 'festivals',
    name: 'Festivals',
    alt: 'Festivals',
    image: '/site-assets/d0af47ed09716286.webp',
    categoryFilter: 'Arts',
    keywords: ['festival', 'fest', 'carnival', 'cultural', 'celebration', 'fair', 'mela', 'gathering'],
  },
  {
    id: 'kids',
    name: 'Kids & Family',
    alt: 'Kids & Family',
    image: '/site-assets/57fa7e9248221a5f.webp',
    categoryFilter: 'Social',
    keywords: ['kids', 'family', 'children', 'all ages', 'parent', 'kid-friendly'],
  },
  {
    id: 'photography',
    name: 'Photography',
    alt: 'Photography',
    image: '/site-assets/930522db410623d7.webp',
    categoryFilter: 'Arts',
    keywords: ['photo', 'photography', 'camera', 'photowalk', 'portrait', 'visual', 'shoot'],
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    alt: 'Sports & Fitness',
    image: '/site-assets/bc422fd976b63917.webp',
    categoryFilter: 'Sports',
    keywords: ['sport', 'fitness', 'cricket', 'run', 'padel', 'football', 'badminton', 'marathon', 'turf', 'tennis'],
  },
  {
    id: 'business',
    name: 'Business & Networking',
    alt: 'Business & Networking',
    image: '/site-assets/cat-business.webp',
    categoryFilter: 'Social',
    keywords: ['business', 'networking', 'founders', 'startup', 'mixer', 'professional', 'connect', 'investor', 'pitch', 'tech'],
  },
  {
    id: 'arts',
    name: 'Arts & Theatre',
    alt: 'Arts & Theatre',
    image: '/site-assets/cat-arts.webp',
    categoryFilter: 'Arts',
    keywords: ['art', 'theatre', 'drama', 'play', 'acting', 'gallery', 'exhibition', 'sculpture', 'paint'],
  },
  {
    id: 'comedy',
    name: 'Comedy',
    alt: 'Comedy',
    image: '/site-assets/cat-comedy.webp',
    categoryFilter: 'Social',
    keywords: ['comedy', 'standup', 'stand-up', 'comic', 'open mic', 'humour', 'humor', 'jokes', 'laugh'],
  },
  {
    id: 'wellness',
    name: 'Health & Wellness',
    alt: 'Health & Wellness',
    image: '/site-assets/cat-wellness.webp',
    categoryFilter: 'Sports',
    keywords: ['health', 'wellness', 'mindfulness', 'meditation', 'healing', 'mental health', 'breathwork', 'wellness'],
  },
  {
    id: 'yoga',
    name: 'Yoga',
    alt: 'Yoga',
    image: '/site-assets/cat-yoga.webp',
    categoryFilter: 'Sports',
    keywords: ['yoga', 'asana', 'pranayama', 'stretch', 'flow', 'vinyasa', 'morning yoga'],
  },
  {
    id: 'tech',
    name: 'Tech & Startups',
    alt: 'Tech & Startups',
    image: '/site-assets/cat-tech.webp',
    categoryFilter: 'Technology',
    keywords: ['tech', 'startup', 'ai', 'hacker', 'software', 'developer', 'code', 'founder', 'build', 'web3', 'saas'],
  },
];

export const WHEN_OPTIONS = [
  { id: 'anytime', label: 'Anytime' },
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'month', label: 'This month' },
] as const;

export interface MostLovedSectionProps {
  cityName?: string;
  selectedCategories: string[];
  dateFilter: string;
  onToggleCategory: (catId: string) => void;
  onResetToAll: () => void;
  onApplyFilters: (categories: string[], when: string) => void;
  activeFiltersCount: number;
  events?: EventItem[];
}

export default function MostLovedSection({
  cityName = 'Indore',
  selectedCategories,
  dateFilter,
  onToggleCategory,
  onResetToAll,
  onApplyFilters,
  activeFiltersCount,
  events = [],
}: MostLovedSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftCategories, setDraftCategories] = useState<string[]>(selectedCategories);
  const [draftWhen, setDraftWhen] = useState<string>(dateFilter);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // Sync draft state when modal opens & strictly lock background scroll
  useEffect(() => {
    if (isModalOpen) {
      setDraftCategories(selectedCategories);
      setDraftWhen(dateFilter);

      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyOverscroll = document.body.style.overscrollBehavior;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;

      // Lock background scrolling completely on window, html, and body
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'contain';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'contain';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.overscrollBehavior = originalBodyOverscroll;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
      };
    } else {
      setSearchQuery('');
    }
  }, [isModalOpen, selectedCategories, dateFilter]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Dynamically aggregate custom categories created by hosts
  const dynamicHostCategories = useMemo(() => {
    const presetNames = new Set(ALL_EXPLORE_CATEGORIES.map((c) => c.name.toLowerCase()));
    presetNames.add('all');

    const customItems: MostLovedCategory[] = [];

    events.forEach((e) => {
      if (e.category && typeof e.category === 'string') {
        const raw = e.category.trim();
        const lower = raw.toLowerCase();
        if (raw && !presetNames.has(lower)) {
          presetNames.add(lower);
          customItems.push({
            id: `host-${lower.replace(/\s+/g, '-')}`,
            name: raw,
            alt: raw,
            isCustom: true,
            keywords: [lower],
          });
        }
      }

      // Check flash tags or custom tags added by hosts
      if (e.theme && Array.isArray(e.theme.flash_tags)) {
        e.theme.flash_tags.forEach((tag) => {
          if (tag && typeof tag === 'string') {
            const rawTag = tag.trim();
            const lowerTag = rawTag.toLowerCase();
            if (rawTag.length >= 3 && rawTag.length <= 24 && !presetNames.has(lowerTag) && !lowerTag.includes('vibe')) {
              if (['meetup', 'jam', 'league', 'dance', 'hackathon', 'gaming', 'poetry', 'books', 'cycling', 'running'].some(w => lowerTag.includes(w))) {
                presetNames.add(lowerTag);
                customItems.push({
                  id: `host-tag-${lowerTag.replace(/\s+/g, '-')}`,
                  name: rawTag,
                  alt: rawTag,
                  isCustom: true,
                  keywords: [lowerTag],
                });
              }
            }
          }
        });
      }
    });

    return customItems;
  }, [events]);

  // Combined full catalog of categories
  const allCategoriesList = useMemo(() => {
    return [...ALL_EXPLORE_CATEGORIES, ...dynamicHostCategories];
  }, [dynamicHostCategories]);

  // Filtered categories in search modal
  const filteredModalCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategoriesList;
    const q = searchQuery.toLowerCase().trim();
    return allCategoriesList.filter((cat) => {
      if (cat.name.toLowerCase().includes(q)) return true;
      if (cat.keywords && cat.keywords.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [allCategoriesList, searchQuery]);

  const isAllEventsActive = selectedCategories.length === 0 && dateFilter === 'anytime';

  const handleToggleDraftCategory = (catId: string) => {
    setDraftCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleResetDraft = () => {
    setDraftCategories([]);
    setDraftWhen('anytime');
  };

  const handleApplyDraft = () => {
    onApplyFilters(draftCategories, draftWhen);
    setIsModalOpen(false);
  };

  return (
    <>
      <section id="vt-categories" className="v2-cat-list-section w-full my-6 sm:my-8" aria-labelledby="most-loved-title">
        <div className="fold">
          <div className="row-fluid bgstyle-0">
            <div className="container mx-auto px-0">
              {/* Header with "Choose your vibe" and two right-aligned buttons */}
              <div className="most-loved-header flex items-center justify-between gap-3 mb-4 sm:mb-5">
                <h2 id="most-loved-title" className="headstyle-1 acolor font-extrabold text-2xl sm:text-3xl text-[#07133A] dark:text-white tracking-tight">
                  Choose your vibe
                </h2>

                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  {/* "All events" pill button (default active/highlighted) */}
                  <button
                    type="button"
                    onClick={onResetToAll}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                      isAllEventsActive
                        ? 'bg-[#07133A] text-white border-[#07133A] shadow-sm dark:bg-white dark:text-[#07133A] dark:border-white'
                        : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                    }`}
                    style={
                      isAllEventsActive
                        ? {
                            backgroundColor: '#07133A',
                            borderColor: '#07133A',
                            color: '#FFFFFF',
                            WebkitTextFillColor: '#FFFFFF',
                          }
                        : undefined
                    }
                  >
                    All events
                  </button>

                  {/* Search Icon button (replaces old Filter button) */}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border hover:scale-105 active:scale-95 ${
                      activeFiltersCount > 0
                        ? 'bg-[#07133A] text-white border-[#07133A] shadow-sm dark:bg-white dark:text-[#07133A] dark:border-white'
                        : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                    }`}
                    style={
                      activeFiltersCount > 0
                        ? {
                            backgroundColor: '#07133A',
                            borderColor: '#07133A',
                            color: '#FFFFFF',
                            WebkitTextFillColor: '#FFFFFF',
                          }
                        : undefined
                    }
                    title="Search categories & events"
                    aria-label="Search categories & events"
                  >
                    <Search className={`w-4 h-4 ${activeFiltersCount > 0 ? 'text-white dark:text-[#07133A]' : 'text-slate-700 dark:text-slate-200'}`} />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold bg-[#0038A8] text-white flex items-center justify-center shadow-xs">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Category Items Grid (2 columns on mobile, 5 on desktop) */}
              <div id="vt-categories-grid" className="v2-cat-items-wrapper">
                {MOST_LOVED_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (cat.id === 'all') {
                          setIsModalOpen(true);
                        } else {
                          onToggleCategory(cat.id);
                        }
                      }}
                      className={`v2-cat-item track ${isSelected ? 'v2-cat-item-active' : ''}`}
                      aria-label={`${cat.name} events in ${cityName}`}
                      aria-pressed={isSelected}
                    >
                      <img
                        src={cat.image}
                        alt={cat.alt}
                        className="v2-cat-img"
                        loading="lazy"
                      />
                      {isSelected && (
                        <span className="absolute top-2 right-2 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0038A8] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0038A8]"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FILTERS MODAL (Bottom Sheet on Mobile, Centered Dialog on Desktop)        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs overscroll-contain"
            onClick={() => setIsModalOpen(false)}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-[#0B0F19] w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl h-[88dvh] sm:h-[84vh] max-h-[88dvh] sm:max-h-[84vh] flex flex-col shadow-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden text-slate-900 dark:text-white overscroll-contain"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="filters-modal-title"
            >
              {/* Mobile bottom sheet drag pill */}
              <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-2.5 shrink-0" />

              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 shrink-0">
                <div>
                  <h3
                    id="filters-modal-title"
                    className="font-black text-lg sm:text-xl text-[#07133A] dark:text-white uppercase tracking-tight"
                  >
                    EXPLORE CATEGORIES IN {cityName.toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select multiple vibes and dates to filter upcoming events
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer shrink-0"
                  aria-label="Close filters modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Single Unified Scrollable Container */}
              <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 touch-pan-y"
                style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                onWheel={(e) => e.stopPropagation()}
              >
                {/* 1. "When" Date Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0038A8] dark:text-sky-300" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      When
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {WHEN_OPTIONS.map((opt) => {
                      const isSelected = draftWhen === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDraftWhen(opt.id)}
                          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#07133A] text-white border-[#07133A] shadow-sm dark:bg-white dark:text-[#07133A] dark:border-white'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 border-slate-200 dark:border-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. "Categories" Multi-Select Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#0038A8] dark:text-sky-300" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Categories {draftCategories.length > 0 && `(${draftCategories.length} selected)`}
                      </span>
                    </div>
                    {draftCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDraftCategories([])}
                        className="text-xs font-bold text-[#0038A8] dark:text-sky-300 hover:underline cursor-pointer"
                      >
                        Clear categories
                      </button>
                    )}
                  </div>

                  {/* Search Bar Input - Sticky with backdrop */}
                  <div className="sticky top-0 z-10 bg-white dark:bg-[#0B0F19] pt-1 pb-1">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        ref={modalInputRef}
                        type="text"
                        placeholder="Search categories"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0038A8]/40 focus:border-[#0038A8] transition-all"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Categories 2-Column Grid (Freely flowing inside single scroll container) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2">
                    {filteredModalCategories.length > 0 ? (
                      filteredModalCategories.map((cat) => {
                        const isSelected = draftCategories.includes(cat.id);

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleToggleDraftCategory(cat.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group text-left ${
                              isSelected
                                ? 'border-[#0038A8] bg-blue-50/70 dark:bg-[#0038A8]/15 ring-2 ring-[#0038A8]/30 shadow-sm'
                                : 'border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0E1526] hover:border-[#0038A8]/60 hover:shadow-xs'
                            }`}
                          >
                            {/* Left Part: Thumbnail / Sparkle Icon + Title */}
                            <div className="flex items-center gap-3 min-w-0">
                              {cat.image ? (
                                <div className="relative w-12 sm:w-14 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-white/5 bg-slate-100">
                                  <Image
                                    src={cat.image}
                                    alt={cat.name}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-8 rounded-lg flex items-center justify-center shrink-0">
                                  <Sparkles className="w-5 h-5 text-[#0038A8] dark:text-sky-300" />
                                </div>
                              )}

                              <div className="min-w-0">
                                <span className={`font-bold text-sm truncate block transition-colors ${
                                  isSelected
                                    ? 'text-[#0038A8] dark:text-sky-300'
                                    : 'text-slate-800 dark:text-slate-100 group-hover:text-[#0038A8] dark:group-hover:text-sky-300'
                                }`}>
                                  {cat.name}
                                </span>
                                {cat.isCustom && (
                                  <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                                    Host Category
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right Part: Selection indicator */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'bg-[#0038A8] text-white shadow-xs'
                                : 'border border-slate-300 dark:border-white/20 group-hover:border-[#0038A8]'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-1 sm:col-span-2 py-8 text-center text-slate-400">
                        <p className="text-sm font-medium">No categories found matching &quot;{searchQuery}&quot;</p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-xs font-bold text-[#0038A8] dark:text-sky-300 underline cursor-pointer"
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="p-4 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-white dark:bg-[#0B0F19] shrink-0">
                <button
                  type="button"
                  onClick={handleResetDraft}
                  className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleApplyDraft}
                  className="px-6 sm:px-8 py-2.5 rounded-full bg-[#0038A8] hover:bg-[#173DAA] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Show events
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
