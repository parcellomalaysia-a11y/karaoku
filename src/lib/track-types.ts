// ============================================================
// VIDEO TRACK TYPE
// Platform only deals with user-provided YouTube video references.
// No curated song lists are distributed by the platform.
// ============================================================

export interface VideoTrack {
  id: string        // YouTube video ID
  title: string
  artist: string    // YouTube channel title
  duration: string
  thumb: string
}

// Backward-compatibility alias (do NOT remove until all imports migrated)
export type KaraokeSong = VideoTrack
