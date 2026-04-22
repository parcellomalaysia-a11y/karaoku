'use client'

import { useEffect, useRef } from 'react'

interface Props {
  videoId: string
  playing: boolean
  volume?: number
  onEnded?: () => void
  onReady?: () => void
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

let apiLoaded = false
let apiLoadingPromise: Promise<void> | null = null

function loadYTApi(): Promise<void> {
  if (apiLoaded) return Promise.resolve()
  if (apiLoadingPromise) return apiLoadingPromise

  apiLoadingPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      apiLoaded = true
      resolve()
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)

    const existing = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true
      if (existing) existing()
      resolve()
    }
  })

  return apiLoadingPromise
}

export default function YTPlayer({ videoId, playing, volume = 100, onEnded, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false

    loadYTApi().then(() => {
      if (cancelled || !containerRef.current) return
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            try { e.target.setVolume(volume) } catch {}
            if (playing) e.target.playVideo()
            onReady?.()
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) onEnded?.()
          },
        },
      })
    })

    return () => {
      cancelled = true
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
        playerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  useEffect(() => {
    if (!playerRef.current) return
    try {
      if (playing) playerRef.current.playVideo()
      else playerRef.current.pauseVideo()
    } catch {}
  }, [playing])

  useEffect(() => {
    if (!playerRef.current) return
    try {
      playerRef.current.setVolume(Math.max(0, Math.min(100, volume)))
    } catch {}
  }, [volume])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
