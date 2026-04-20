import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const probe = searchParams.get('probe')
  const key = process.env.YOUTUBE_API_KEY

  // Probe endpoint — lets client check if API is available
  if (probe) {
    return NextResponse.json({ enabled: !!key })
  }

  if (!key) {
    return NextResponse.json({ enabled: false, items: [] })
  }

  if (!q) {
    return NextResponse.json({ items: [] })
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('q', q)
    url.searchParams.set('type', 'video')
    url.searchParams.set('videoEmbeddable', 'true')
    url.searchParams.set('maxResults', '15')
    url.searchParams.set('key', key)

    const res = await fetch(url.toString())
    const data = await res.json()

    if (!data.items) {
      return NextResponse.json({ items: [] })
    }

    const items = data.items.map((it: any) => ({
      id: it.id.videoId,
      title: it.snippet.title,
      artist: it.snippet.channelTitle,
      duration: '',
      thumb: it.snippet.thumbnails.medium.url,
    }))

    return NextResponse.json({ enabled: true, items })
  } catch (err: any) {
    console.error('[youtube search] error', err)
    return NextResponse.json({ items: [], error: err.message }, { status: 500 })
  }
}
