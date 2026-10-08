export interface RibbonConfig {
  frontColor: string; // e.g. '#5227ff'
  backColor: string;  // e.g. '#e0409a'
  width: number;      // 8 - 60, default 28
  trail: number;      // 0.5 - 4.0, default 1.9 (slider 19)
  bounce: number;     // 0 - 1.0, default 0.4 (slider 40)
  angle: number;      // -90 to 90, default -35
}

export const DEFAULT_RIBBON_CONFIG: RibbonConfig = {
  frontColor: '#5227ff',
  backColor: '#e0409a',
  width: 28,
  trail: 1.9,
  bounce: 0.4,
  angle: -35,
};

export const RIBBON_PRESETS = [
  { name: 'Violet & Pink (Original)', front: '#5227ff', back: '#e0409a' },
  { name: 'Vibe Sunset', front: '#FF5500', back: '#E0409A' },
  { name: 'Cyber Neon', front: '#00F0FF', back: '#7000FF' },
  { name: 'Acid Emerald', front: '#10B981', back: '#3B82F6' },
  { name: 'Gold & Noir', front: '#F59E0B', back: '#8B5CF6' },
];

export const RIBBON_STORAGE_KEY = 'vibe_ribbon_cursor_config';

export function getStoredRibbonConfig(): RibbonConfig {
  if (typeof window === 'undefined') return DEFAULT_RIBBON_CONFIG;
  try {
    const raw = localStorage.getItem(RIBBON_STORAGE_KEY);
    if (!raw) return DEFAULT_RIBBON_CONFIG;
    return { ...DEFAULT_RIBBON_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RIBBON_CONFIG;
  }
}

export function saveRibbonConfig(config: RibbonConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RIBBON_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('vibe:ribbon-config-changed', { detail: config }));
  } catch {
    // ignore
  }
}

export function triggerRibbonFlick() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('vibe:ribbon-flick'));
}
