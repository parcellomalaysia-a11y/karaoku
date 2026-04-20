// Curated karaoke library with real YouTube video IDs.
// Used as fallback when YouTube Data API isn't configured.

export interface KaraokeSong {
  id: string
  title: string
  artist: string
  duration: string
  thumb: string
}

export const KARAOKE_LIBRARY: KaraokeSong[] = [
  { id: 'RBumgq5yVrA', title: 'Perfect (Karaoke)', artist: 'Ed Sheeran', duration: '4:23', thumb: 'https://i.ytimg.com/vi/RBumgq5yVrA/mqdefault.jpg' },
  { id: 'lp-EO5I60KA', title: 'Thinking Out Loud (Karaoke)', artist: 'Ed Sheeran', duration: '4:41', thumb: 'https://i.ytimg.com/vi/lp-EO5I60KA/mqdefault.jpg' },
  { id: 'Zi_XLOBDo_Y', title: 'Billie Jean (Karaoke)', artist: 'Michael Jackson', duration: '4:54', thumb: 'https://i.ytimg.com/vi/Zi_XLOBDo_Y/mqdefault.jpg' },
  { id: '1k8craCGpgs', title: 'Bohemian Rhapsody (Karaoke)', artist: 'Queen', duration: '5:55', thumb: 'https://i.ytimg.com/vi/1k8craCGpgs/mqdefault.jpg' },
  { id: '-QguXVTdu-k', title: 'Shape of You (Karaoke)', artist: 'Ed Sheeran', duration: '3:53', thumb: 'https://i.ytimg.com/vi/-QguXVTdu-k/mqdefault.jpg' },
  { id: 'YkgkThdzX-8', title: 'Let It Be (Karaoke)', artist: 'The Beatles', duration: '4:03', thumb: 'https://i.ytimg.com/vi/YkgkThdzX-8/mqdefault.jpg' },
  { id: 'iRiiHB9Qo8s', title: 'Hello (Karaoke)', artist: 'Adele', duration: '4:55', thumb: 'https://i.ytimg.com/vi/iRiiHB9Qo8s/mqdefault.jpg' },
  { id: 'bQeHjGpz5a8', title: 'Someone Like You (Karaoke)', artist: 'Adele', duration: '4:45', thumb: 'https://i.ytimg.com/vi/bQeHjGpz5a8/mqdefault.jpg' },
  { id: 'HdVHCTKVy3E', title: 'Wonderwall (Karaoke)', artist: 'Oasis', duration: '4:18', thumb: 'https://i.ytimg.com/vi/HdVHCTKVy3E/mqdefault.jpg' },
  { id: 'eGxRMFHnmUs', title: 'Despacito (Karaoke)', artist: 'Luis Fonsi', duration: '3:47', thumb: 'https://i.ytimg.com/vi/eGxRMFHnmUs/mqdefault.jpg' },
  { id: 'XXYlFuWEuKI', title: 'Dynamite (Karaoke)', artist: 'BTS', duration: '3:19', thumb: 'https://i.ytimg.com/vi/XXYlFuWEuKI/mqdefault.jpg' },
  { id: '9aJZrS7Rtw0', title: 'Pokemon Theme (Karaoke)', artist: 'Pokemon', duration: '2:55', thumb: 'https://i.ytimg.com/vi/9aJZrS7Rtw0/mqdefault.jpg' },
]
