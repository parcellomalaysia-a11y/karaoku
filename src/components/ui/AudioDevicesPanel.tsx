'use client'

import { useState, useEffect, useRef } from 'react'
import { s } from '@/types'

interface AudioDevice {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput'
}

export default function AudioDevicesPanel() {
  const [mics, setMics] = useState<AudioDevice[]>([])
  const [speakers, setSpeakers] = useState<AudioDevice[]>([])
  const [selectedMicId, setSelectedMicId] = useState<string>('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [testing, setTesting] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordCountdown, setRecordCountdown] = useState(0)
  const [micLevel, setMicLevel] = useState(0)
  const [toast, setToast] = useState('')

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load devices + saved preference
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('karaoku_mic_id') : null
    if (saved) setSelectedMicId(saved)
    loadDevices()

    // Listen to device changes (user pairs/unpairs BT)
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      const handler = () => loadDevices()
      navigator.mediaDevices.addEventListener('devicechange', handler)
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handler)
        cleanup()
      }
    }
  }, [])

  const cleanup = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const loadDevices = async () => {
    try {
      setRefreshing(true)
      const devices = await navigator.mediaDevices.enumerateDevices()

      const inputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || 'Microphone (permission needed)',
          kind: 'audioinput' as const,
        }))

      const outputs = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || 'Speaker',
          kind: 'audiooutput' as const,
        }))

      // Deduplicate by label (sometimes browsers list same device multiple times)
      const seen = new Set()
      const uniqueInputs = inputs.filter((d) => {
        if (seen.has(d.label)) return false
        seen.add(d.label)
        return true
      })

      setMics(uniqueInputs)
      setSpeakers(outputs)
      setPermissionGranted(uniqueInputs.length > 0 && uniqueInputs[0].label !== 'Microphone (permission needed)')

      if (!selectedMicId && uniqueInputs.length > 0) {
        setSelectedMicId(uniqueInputs[0].deviceId)
      }
    } catch (err) {
      console.error('[devices]', err)
    } finally {
      setRefreshing(false)
    }
  }

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      await loadDevices()
      showToast('Microphone permission granted ✓')
    } catch (err) {
      showToast('Permission denied. Enable in browser settings.')
    }
  }

  const pickMic = (deviceId: string) => {
    setSelectedMicId(deviceId)
    localStorage.setItem('karaoku_mic_id', deviceId)
    setDropdownOpen(false)
    const mic = mics.find((m) => m.deviceId === deviceId)
    if (mic) showToast(`Switched to: ${friendlyLabel(mic.label)}`)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (!permissionGranted) {
      await requestPermission()
    } else {
      await loadDevices()
      showToast('Devices refreshed')
    }
  }

  const startTest = async () => {
    if (!selectedMicId) return
    setTesting(true)
    setRecordedBlob(null)
    recordedChunksRef.current = []

    try {
      // Get the stream for selected device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedMicId },
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      mediaStreamRef.current = stream

      // Setup analyser for waveform
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioContextRef.current = audioCtx
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length
        setMicLevel(Math.min(100, (avg / 120) * 100))
        animFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      // Setup MediaRecorder
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        cleanup()
        setMicLevel(0)
        setTesting(false)
      }
      recorder.start()

      // Countdown 3 seconds
      setRecordCountdown(3)
      const interval = setInterval(() => {
        setRecordCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval)
            if (recorder.state === 'recording') recorder.stop()
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch (err: any) {
      showToast(err.message || 'Failed to access mic')
      setTesting(false)
    }
  }

  const playback = () => {
    if (!recordedBlob) return
    const url = URL.createObjectURL(recordedBlob)
    if (audioRef.current) {
      audioRef.current.src = url
      audioRef.current.play()
    }
  }

  // Helper: friendly label
  const friendlyLabel = (label: string) => {
    if (!label) return 'Unknown'
    // Strip trailing hex IDs that browsers add
    return label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '').trim()
  }

  const detectType = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('bluetooth') || l.includes('airpod') || l.includes('boya') || l.includes('rode')) return 'bluetooth'
    if (l.includes('usb')) return 'usb'
    if (l.includes('headset') || l.includes('earphone') || l.includes('earbud')) return 'headset'
    if (l.includes('default')) return 'default'
    return 'builtin'
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'bluetooth': return '🎙️'
      case 'usb': return '🔌'
      case 'headset': return '🎧'
      default: return '📱'
    }
  }

  const typeName = (type: string) => {
    switch (type) {
      case 'bluetooth': return 'Bluetooth'
      case 'usb': return 'USB'
      case 'headset': return 'Headset'
      default: return 'Built-in'
    }
  }

  const selectedMic = mics.find((m) => m.deviceId === selectedMicId)
  const selectedLabel = selectedMic ? friendlyLabel(selectedMic.label) : 'No mic selected'
  const selectedType = selectedMic ? detectType(selectedMic.label) : 'default'

  return (
    <div style={{ background: s.dark, borderRadius: 12, padding: 14, position: 'relative' }}>
      {/* MICROPHONE */}
      <div
        style={{
          fontSize: 10,
          color: s.redLight,
          letterSpacing: 1.5,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        🎤 MICROPHONE
      </div>

      {!permissionGranted ? (
        <div style={{ textAlign: 'center', padding: 16, background: '#0a0a0a', borderRadius: 8, border: `1px dashed ${s.gray}` }}>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>
            Grant mic permission to see your devices
          </div>
          <button
            onClick={requestPermission}
            style={{
              background: s.red,
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 3px 0 ${s.redDark}`,
              letterSpacing: 0.5,
              fontFamily: 'inherit',
            }}
          >
            ⚡ GRANT PERMISSION
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {/* Dropdown button */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div
                onClick={() => !testing && setDropdownOpen(!dropdownOpen)}
                style={{
                  background: '#0a0a0a',
                  border: `1px solid ${dropdownOpen ? s.red : '#333'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  opacity: testing ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: '#4ade80',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {selectedLabel}
                    </div>
                    <div style={{ fontSize: 9, color: '#888' }}>
                      {typeName(selectedType)} · {mics.length} available
                    </div>
                  </div>
                </div>
                <span style={{ color: '#888', fontSize: 10, flexShrink: 0 }}>
                  {dropdownOpen ? '▲' : '▼'}
                </span>
              </div>

              {/* Dropdown options */}
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#0a0a0a',
                    border: `1px solid ${s.red}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                    zIndex: 20,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                  }}
                >
                  {mics.map((mic) => {
                    const type = detectType(mic.label)
                    const active = mic.deviceId === selectedMicId
                    return (
                      <div
                        key={mic.deviceId}
                        onClick={() => pickMic(mic.deviceId)}
                        style={{
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          background: active ? 'rgba(230,0,18,0.12)' : 'transparent',
                          borderBottom: '1px solid #1a1a1a',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.background = '#1a1a1a'
                        }}
                        onMouseLeave={(e) => {
                          if (!active) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{typeIcon(type)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: active ? 'white' : '#ccc' }}>
                            {friendlyLabel(mic.label)}
                          </div>
                          <div style={{ fontSize: 9, color: '#666' }}>{typeName(type)}</div>
                        </div>
                        {active && (
                          <span style={{ color: '#4ade80', fontSize: 10 }}>●</span>
                        )}
                      </div>
                    )
                  })}
                  <div
                    onClick={handleRefresh}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      fontSize: 10,
                      color: '#aaa',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    🔄 Refresh · Pair new in phone Settings
                  </div>
                </div>
              )}
            </div>

            {/* Test button */}
            <button
              onClick={startTest}
              disabled={testing || !selectedMicId}
              style={{
                background: testing ? '#666' : s.red,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '0 14px',
                fontSize: 10,
                fontWeight: 800,
                cursor: testing ? 'not-allowed' : 'pointer',
                boxShadow: `0 3px 0 ${testing ? '#444' : s.redDark}`,
                letterSpacing: 0.5,
                fontFamily: 'inherit',
                minWidth: 70,
              }}
            >
              {testing ? `${recordCountdown}s` : 'TEST'}
            </button>
          </div>

          {/* Mic level meter (shown during test) */}
          {testing && (
            <div
              style={{
                background: '#0a0a0a',
                borderRadius: 6,
                padding: 10,
                marginBottom: 10,
                border: `1px solid ${s.red}`,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: s.redLight,
                  letterSpacing: 1,
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                ● RECORDING — SPEAK NOW
              </div>
              <div
                style={{
                  height: 8,
                  background: '#1a1a1a',
                  borderRadius: 100,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${micLevel}%`,
                    background: `linear-gradient(90deg, ${s.red}, #ff9f43)`,
                    transition: 'width 0.05s',
                    borderRadius: 100,
                  }}
                />
              </div>
            </div>
          )}

          {/* Playback recorded */}
          {recordedBlob && !testing && (
            <div
              style={{
                background: 'rgba(74, 222, 128, 0.08)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 11, color: '#86efac' }}>
                ✓ Recording ready. Play it back to check your mic.
              </div>
              <button
                onClick={playback}
                style={{
                  background: '#4ade80',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ▶ PLAY
              </button>
              <audio ref={audioRef} style={{ display: 'none' }} />
            </div>
          )}
        </>
      )}

      {/* SPEAKER INFO */}
      <div
        style={{
          fontSize: 10,
          color: s.redLight,
          letterSpacing: 1.5,
          fontWeight: 700,
          marginTop: 12,
          marginBottom: 8,
        }}
      >
        🔊 SPEAKER
      </div>
      <div
        style={{
          background: '#0a0a0a',
          border: `1px solid #333`,
          borderRadius: 8,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>📱</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700 }}>Phone output (follows OS)</div>
          <div style={{ fontSize: 9, color: '#888' }}>
            Pair Bluetooth speaker in phone Settings
          </div>
        </div>
      </div>

      {/* BOYA HELPER */}
      <div
        style={{
          marginTop: 10,
          padding: '8px 10px',
          background: 'rgba(230,0,18,0.08)',
          border: '1px solid rgba(230,0,18,0.2)',
          borderRadius: 7,
        }}
      >
        <div style={{ fontSize: 9, color: '#ff9fa5', lineHeight: 1.5 }}>
          <b style={{ color: s.redLight }}>💡 Can&apos;t see your BOYA?</b> Pair first
          in phone Settings → Bluetooth, then tap ▼ dropdown → Refresh.
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'absolute',
            bottom: -48,
            left: '50%',
            transform: 'translateX(-50%)',
            background: s.dark,
            border: `1px solid ${s.red}`,
            color: 'white',
            padding: '8px 14px',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 50,
            boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
