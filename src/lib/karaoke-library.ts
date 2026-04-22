// ============================================================
// DEPRECATED FILE NAME — kept for backward compat with existing imports.
// Use track-types.ts instead going forward.
//
// Platform does NOT distribute any curated song list.
// Users bring their own YouTube video references.
// ============================================================

export interface KaraokeSong {
  id: string        // YouTube video ID
  title: string
  artist: string
  duration: string
  thumb: string
}

// Empty array kept for type compatibility.
// Platform does not ship any pre-curated content.
export const KARAOKE_LIBRARY: KaraokeSong[] = []
