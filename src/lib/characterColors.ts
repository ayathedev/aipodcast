import { Character } from '../types';

export interface CharacterColorTheme {
  id: string;
  name: string;
  stripeBg: string;       // Tailwind bg class for side stripe (e.g., bg-amber-500)
  stripeHex: string;      // Raw hex code for inline styles/SVG/canvas
  badgeBg: string;        // Light badge background
  badgeText: string;      // Badge text color
  badgeBorder: string;    // Badge border color
  glowBg: string;         // Faint background tint for active line highlight
}

export const CHARACTER_COLOR_PALETTES: CharacterColorTheme[] = [
  {
    id: 'amber',
    name: 'Amber Gold',
    stripeBg: 'bg-amber-500',
    stripeHex: '#F59E0B',
    badgeBg: 'bg-amber-100/80',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    glowBg: 'bg-amber-50/50',
  },
  {
    id: 'teal',
    name: 'Emerald Teal',
    stripeBg: 'bg-teal-500',
    stripeHex: '#14B8A6',
    badgeBg: 'bg-teal-100/80',
    badgeText: 'text-teal-900',
    badgeBorder: 'border-teal-300',
    glowBg: 'bg-teal-50/50',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    stripeBg: 'bg-sky-500',
    stripeHex: '#0EA5E9',
    badgeBg: 'bg-sky-100/80',
    badgeText: 'text-sky-900',
    badgeBorder: 'border-sky-300',
    glowBg: 'bg-sky-50/50',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    stripeBg: 'bg-purple-500',
    stripeHex: '#A855F7',
    badgeBg: 'bg-purple-100/80',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300',
    glowBg: 'bg-purple-50/50',
  },
  {
    id: 'rose',
    name: 'Rose Crimson',
    stripeBg: 'bg-rose-500',
    stripeHex: '#F43F5E',
    badgeBg: 'bg-rose-100/80',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    glowBg: 'bg-rose-50/50',
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    stripeBg: 'bg-indigo-500',
    stripeHex: '#6366F1',
    badgeBg: 'bg-indigo-100/80',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-300',
    glowBg: 'bg-indigo-50/50',
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    stripeBg: 'bg-[#C85A32]',
    stripeHex: '#C85A32',
    badgeBg: 'bg-[#C85A32]/15',
    badgeText: 'text-[#2E2623]',
    badgeBorder: 'border-[#C85A32]/30',
    glowBg: 'bg-[#C85A32]/5',
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    stripeBg: 'bg-emerald-600',
    stripeHex: '#059669',
    badgeBg: 'bg-emerald-100/80',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    glowBg: 'bg-emerald-50/50',
  },
];

/**
 * Get a deterministic color theme for a character based on index or character ID/Name
 */
export function getCharacterColorTheme(
  characterIdOrName?: string,
  characterIndex?: number,
  charactersList?: Character[]
): CharacterColorTheme {
  if (!characterIdOrName && characterIndex === undefined) {
    return CHARACTER_COLOR_PALETTES[0];
  }

  if (charactersList && charactersList.length > 0) {
    const foundIndex = charactersList.findIndex(
      (c) =>
        c.id === characterIdOrName ||
        c.name.toLowerCase() === (characterIdOrName || '').toLowerCase()
    );
    if (foundIndex >= 0) {
      return CHARACTER_COLOR_PALETTES[foundIndex % CHARACTER_COLOR_PALETTES.length];
    }
  }

  if (typeof characterIndex === 'number' && characterIndex >= 0) {
    return CHARACTER_COLOR_PALETTES[characterIndex % CHARACTER_COLOR_PALETTES.length];
  }

  // Hash character string to get consistent index
  let hash = 0;
  const str = characterIdOrName || 'default';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CHARACTER_COLOR_PALETTES.length;
  return CHARACTER_COLOR_PALETTES[index];
}
