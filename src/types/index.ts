// ============================================================
// KARAOKU TYPES
// ============================================================

export type Plan = 'free' | 'day' | 'month' | 'year'
export type Language = 'en' | 'bm'

export interface Profile {
  id: string
  email: string
  name: string | null
  plan: Plan
  plan_upgraded_at: string | null
  plan_expires_at: string | null
  language: Language
  created_at: string
}

export interface Party {
  id: string
  host_id: string
  code: string
  name: string
  party_type: string
  is_active: boolean
  current_song_id: string | null
  current_song_title: string | null
  current_song_artist: string | null
  current_song_thumb: string | null
  current_song_started_at: string | null
  is_playing: boolean
  created_at: string
  ended_at: string | null
}

export interface QueueItem {
  id: string
  party_id: string
  video_id: string
  title: string
  artist: string | null
  duration: string | null
  thumb_url: string | null
  added_by_name: string | null
  added_by_id: string | null
  position: number
  vote_count: number
  played: boolean
  added_at: string
}

export interface PartyGuest {
  id: string
  party_id: string
  name: string
  fingerprint: string
  joined_at: string
}

export interface Favorite {
  id: string
  user_id: string
  video_id: string
  title: string
  artist: string | null
  thumb_url: string | null
  added_at: string
}

export interface PlayHistoryEntry {
  id: string
  user_id: string | null
  party_id: string | null
  video_id: string
  title: string
  artist: string | null
  thumb_url: string | null
  played_at: string
}

export interface PromoCode {
  id: string
  code: string
  discount_percent: number
  max_uses: number
  used_count: number
  expires_at: string | null
  is_active: boolean
  description: string | null
  created_at: string
}

// ============================================================
// PLAN LIMITS (Memoir pattern: locked at creation, paid users only counted after plan_upgraded_at)
// ============================================================
export const PLANS = {
  free: {
    label: 'Free',
    price: 'RM0',
    priceNum: 0,
    period: 'forever',
    queue: 3,
    micSongs: 1,
    party: false,
    features: ['3 songs in queue', '1 mic song', 'Basic player'],
    featuresBm: ['3 lagu dalam queue', '1 lagu mic', 'Player asas'],
  },
  day: {
    label: 'Day Pass',
    labelBm: 'Pas Harian',
    price: 'RM9',
    priceNum: 9,
    period: '24 hours',
    periodBm: '24 jam',
    queue: 999,
    micSongs: 999,
    party: true,
    features: ['Unlimited queue', 'Unlimited mic', 'Party mode', 'QR invites'],
    featuresBm: ['Queue tanpa had', 'Mic tanpa had', 'Mod party', 'Jemputan QR'],
    durationHours: 24,
  },
  month: {
    label: 'Monthly',
    labelBm: 'Bulanan',
    price: 'RM39',
    priceNum: 39,
    period: '/month',
    periodBm: '/bulan',
    queue: 999,
    micSongs: 999,
    party: true,
    features: ['Everything in Day Pass', 'Playback history', 'Save favorites'],
    featuresBm: ['Semua dalam Pas Harian', 'Sejarah main', 'Simpan kegemaran'],
    durationHours: 24 * 30,
  },
  year: {
    label: 'Yearly',
    labelBm: 'Tahunan',
    price: 'RM199',
    priceNum: 199,
    period: '/year',
    periodBm: '/tahun',
    queue: 999,
    micSongs: 999,
    party: true,
    features: ['Everything in Monthly', 'Cafe/vendor license', 'Priority support', 'Save 58%'],
    featuresBm: ['Semua dalam Bulanan', 'Lesen kafe/vendor', 'Sokongan utama', 'Jimat 58%'],
    durationHours: 24 * 365,
  },
} as const

// ============================================================
// DESIGN TOKENS (Nintendo red theme — the Memoir-equivalent for Karaoku)
// ============================================================
export const s = {
  red: '#E60012',
  redDark: '#B00010',
  redLight: '#FF3347',
  black: '#0A0A0A',
  dark: '#1A1A1A',
  gray: '#2A2A2A',
  grayLight: '#444',
  white: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.5)',
  textSubtle: 'rgba(255,255,255,0.7)',
  border: 'rgba(255,255,255,0.1)',
  borderStrong: 'rgba(255,255,255,0.15)',
  green: '#22c55e',
  greenBg: 'rgba(34,197,94,0.2)',
  yellow: '#ffeb3b',
  purple: '#9b4dca',
  gold: '#d4af37',
} as const

export const ADMIN_EMAILS = ['danielnordin53@gmail.com'] // same as Memoir
