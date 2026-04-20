'use client'

import { useState, useEffect, useRef } from 'react'
import { s } from '@/types'
import { MicManager, detectDeviceType } from '@/lib/mic'

interface AudioDevice {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput'
}

export default function AudioDevicesPanel() {
  const [mics, setMics] = useState<AudioDevice[]>([])
  const [speakers, setSpeakers] = useState<AudioDevice[]>([])
  const [selectedMicId, setSelectedMicId] = useState<string>('')
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('')
  const [micDropdown, setMicDropdown] = useState(false)
  const [spkDropdown, setSpkDropdown] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [testing, setTesting] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordCountdown, setRecordCountdown] = useState(0)
  const [micLevel, setMicLevel] = useState(0)
  const [toast, setToast] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const supportsSpeakerSelection = MicManager.isOutputSelectionSupported()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedMic = localStorage.getItem('karaoku_mic_id')
    const savedSpk = localStorage.getItem('karaoku_speaker_id')
    if (savedMic) setSelectedMicId(savedMic)
    if (savedSpk) setSelectedSpeakerId(savedSpk)
    loadDevices()

    if (navigator.mediaDevices) {
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

      const inputs = devices.filter((d) => d.kind === 'audioinput').map((d) => ({
        deviceId: d.deviceId,
        label: d.label || 'Microphone (grant permission)',
        kind: 'audioinput' as const,
      }))

      const outputs = devices.filter((d) => d.kind === 'audiooutput').map((d) => ({
        deviceId: d.deviceId,
        label: d.label || 'Speaker',
        kind: 'audiooutput' as const,
      }))

      // Dedupe by label
      const seenIn = new Set<string>(), seenOut = new Set<string>()
      const uniqIn = inputs.filter((d) => { if (seenIn.has(d.label)) return false; seenIn.add(d.label); return true })
      const uniqOut = outputs.filter((d) => { if (seenOut.has(d.label)) return false; seenOut.add(d.label); return true })

      setMics(uniqIn)
      setSpeakers(uniqOut)
      setPermissionGranted(uniqIn.length > 0 && uniqIn[0].label !== 'Microphone (grant permission)')

      if (!selectedMicId && uniqIn.length > 0) setSelectedMicId(uniqIn[0].deviceId)
      if (supportsSpeakerSelection && !selectedSpeakerId && uniqOut.length > 0) {
        setSelectedSpeakerId(uniqOut[0].deviceId)
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
    } catch {
      showToast('Permission denied. Enable in browser settings.')
    }
  }

  const pickMic = (deviceId: string) => {
    setSelectedMicId(deviceId)
    localStorage.setItem('karaoku_mic_id', deviceId)
    setMicDropdown(false)
    const mic = mics.find((m) => m.deviceId === deviceId)
    if (mic) showToast(`Mic: ${friendlyLabel(mic.label)}`)
  }

  const pickSpeaker = (deviceId: string) => {
    setSelectedSpeakerId(deviceId)
    localStorage.setItem('karaoku_speaker_id', deviceId)
    setSpkDropdown(false)
    const spk = speakers.find((m) => m.deviceId === deviceId)
    if (spk) showToast(`Speaker: ${friendlyLabel(spk.label)}`)
  }

  const handleRefresh = async () => {
    if (!permissionGranted) { await requestPermission(); return }
    await loadDevices()
    showToast('Devices refreshed')
  }

  const startTest = async () => {
    if (!selectedMicId) return
    setTesting(true)
    setRecordedBlob(null)
    recordedChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedMicId },
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      mediaStreamRef.current = stream

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

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        cleanup()
        setMicLevel(0)
        setTesting(false)
      }
      recorder.start()

      setRecordCountdown(3)
      const interval = setInterval(() => {
        setRecordCountdown((c) => {
          if (c <= 1) { clearInterval(interval); if (recorder.state === 'recording') recorder.stop(); return 0 }
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

  const friendlyLabel = (label: string) => {
    if (!label) return 'Unknown'
    return label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '').trim()
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'bluetooth': return '🎙️'
      case 'usb': return '🔌'
      case 'wired': return '🎧'
      default: return '📱'
    }
  }

  const typeName = (type: string) => {
    switch (type) {
      case 'bluetooth': return 'Bluetooth'
      case 'usb': return 'USB'
      case 'wired': return 'Wired'
      case 'default': return 'Default'
      default: return 'Built-in'
    }
  }

  const selectedMic = mics.find((m) => m.deviceId === selectedMicId)
  const selectedMicLabel = selectedMic ? friendlyLabel(selectedMic.label) : 'No mic selected'
  const selectedMicType = selectedMic ? detectDeviceType(selectedMic.label) : 'default'

  const selectedSpk = speakers.find((m) => m.deviceId === selectedSpeakerId)
  const selectedSpkLabel = selectedSpk ? friendlyLabel(selectedSpk.label) : 'Phone output (OS default)'
  const selectedSpkType = selectedSpk ? detectDeviceType(selectedSpk.label) : 'default'

  // Detect risky combo: phone mic + phone speaker = feedback risk
  const feedbackRisk =
    (selectedMicType === 'builtin' || selectedMicType === 'default') &&
    (selectedSpkType === 'builtin' || selectedSpkType === 'default')

  return (
    <div style={{ background: s.dark, borderRadius: 12, padding: 14, position: 'relative' }}>
      {/* MIC */}
      <div style={{ fontSize: 10, color: s.redLight, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>
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
              background: s.red, color: 'white', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 3px 0 ${s.redDark}`, letterSpacing: 0.5, fontFamily: 'inherit',
            }}
          >
            ⚡ GRANT PERMISSION
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div
                onClick={() => !testing && setMicDropdown(!micDropdown)}
                style={{
                  background: '#0a0a0a', border: `1px solid ${micDropdown ? s.red : '#333'}`,
                  borderRadius: 8, padding: '10px 12px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  cursor: testing ? 'not-allowed' : 'pointer', opacity: testing ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedMicLabel}
                    </div>
                    <div style={{ fontSize: 9, color: '#888' }}>
                      {typeName(selectedMicType)} · {mics.length} available
                    </div>
                  </div>
                </div>
                <span style={{ color: '#888', fontSize: 10, flexShrink: 0 }}>{micDropdown ? '▲' : '▼'}</span>
              </div>

              {micDropdown && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: '#0a0a0a', border: `1px solid ${s.red}`, borderRadius: 8,
                  overflow: 'hidden', zIndex: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                }}>
                  {mics.map((mic) => {
                    const type = detectDeviceType(mic.label)
                    const active = mic.deviceId === selectedMicId
                    return (
                      <div
                        key={mic.deviceId}
                        onClick={() => pickMic(mic.deviceId)}
                        style={{
                          padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
                          cursor: 'pointer', background: active ? 'rgba(230,0,18,0.12)' : 'transparent',
                          borderBottom: '1px solid #1a1a1a',
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{typeIcon(type)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: active ? 'white' : '#ccc' }}>
                            {friendlyLabel(mic.label)}
                          </div>
                          <div style={{ fontSize: 9, color: '#666' }}>{typeName(type)}</div>
                        </div>
                        {active && <span style={{ color: '#4ade80', fontSize: 10 }}>●</span>}
                      </div>
                    )
                  })}
                  <div
                    onClick={handleRefresh}
                    style={{
                      padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
                      fontSize: 10, color: '#aaa', textAlign: 'center', cursor: 'pointer',
                    }}
                  >
                    🔄 Refresh · Pair new in phone Settings
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={startTest}
              disabled={testing || !selectedMicId}
              style={{
                background: testing ? '#666' : s.red, color: 'white', border: 'none',
                borderRadius: 8, padding: '0 14px', fontSize: 10, fontWeight: 800,
                cursor: testing ? 'not-allowed' : 'pointer',
                boxShadow: `0 3px 0 ${testing ? '#444' : s.redDark}`,
                letterSpacing: 0.5, fontFamily: 'inherit', minWidth: 70,
              }}
            >
              {testing ? `${recordCountdown}s` : 'TEST'}
            </button>
          </div>

          {testing && (
            <div style={{
              background: '#0a0a0a', borderRadius: 6, padding: 10, marginBottom: 10,
              border: `1px solid ${s.red}`,
            }}>
              <div style={{ fontSize: 9, color: s.redLight, letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>
                ● RECORDING — SPEAK NOW
              </div>
              <div style={{ height: 8, background: '#1a1a1a', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${micLevel}%`,
                  background: `linear-gradient(90deg, ${s.red}, #ff9f43)`,
                  transition: 'width 0.05s', borderRadius: 100,
                }} />
              </div>
            </div>
          )}

          {recordedBlob && !testing && (
            <div style={{
              background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.3)',
              borderRadius: 8, padding: 10, marginBottom: 10,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
            }}>
              <div style={{ fontSize: 11, color: '#86efac' }}>
                ✓ Recording ready. Play to check mic.
              </div>
              <button
                onClick={playback}
                style={{
                  background: '#4ade80', color: '#0a0a0a', border: 'none', borderRadius: 6,
                  padding: '5px 10px', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ▶ PLAY
              </button>
              <audio ref={audioRef} style={{ display: 'none' }} />
            </div>
          )}
        </>
      )}

      {/* SPEAKER */}
      <div style={{ fontSize: 10, color: s.redLight, letterSpacing: 1.5, fontWeight: 700, marginTop: 12, marginBottom: 8 }}>
        🔊 SPEAKER
      </div>

      {supportsSpeakerSelection && speakers.length > 0 ? (
        // Desktop Chrome: show dropdown
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div
            onClick={() => setSpkDropdown(!spkDropdown)}
            style={{
              background: '#0a0a0a', border: `1px solid ${spkDropdown ? s.red : '#333'}`,
              borderRadius: 8, padding: '10px 12px', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 14 }}>{typeIcon(selectedSpkType)}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedSpkLabel}
                </div>
                <div style={{ fontSize: 9, color: '#888' }}>
                  {typeName(selectedSpkType)} · {speakers.length} available
                </div>
              </div>
            </div>
            <span style={{ color: '#888', fontSize: 10, flexShrink: 0 }}>{spkDropdown ? '▲' : '▼'}</span>
          </div>

          {spkDropdown && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: '#0a0a0a', border: `1px solid ${s.red}`, borderRadius: 8,
              overflow: 'hidden', zIndex: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            }}>
              {speakers.map((spk) => {
                const type = detectDeviceType(spk.label)
                const active = spk.deviceId === selectedSpeakerId
                return (
                  <div
                    key={spk.deviceId}
                    onClick={() => pickSpeaker(spk.deviceId)}
                    style={{
                      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
                      cursor: 'pointer', background: active ? 'rgba(230,0,18,0.12)' : 'transparent',
                      borderBottom: '1px solid #1a1a1a',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{typeIcon(type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: active ? 'white' : '#ccc' }}>
                        {friendlyLabel(spk.label)}
                      </div>
                      <div style={{ fontSize: 9, color: '#666' }}>{typeName(type)}</div>
                    </div>
                    {active && <span style={{ color: '#4ade80', fontSize: 10 }}>●</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        // Mobile or unsupported: show info
        <div style={{
          background: '#0a0a0a', border: `1px solid #333`, borderRadius: 8,
          padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 14 }}>📱</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700 }}>Phone output (follows OS)</div>
            <div style={{ fontSize: 9, color: '#888' }}>
              Pair speaker in phone Settings → Bluetooth
            </div>
          </div>
        </div>
      )}

      {/* Feedback warning */}
      {feedbackRisk && permissionGranted && (
        <div style={{
          padding: '8px 10px', background: 'rgba(251, 191, 36, 0.12)',
          border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 7, marginBottom: 8,
        }}>
          <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 800, marginBottom: 3 }}>⚠️ FEEDBACK RISK</div>
          <div style={{ fontSize: 10, color: '#fde68a', lineHeight: 1.5 }}>
            Phone mic + phone speaker can cause echo/feedback loop. Pair Bluetooth speaker or use headphones.
          </div>
        </div>
      )}

      {/* Setup Guide toggle */}
      <button
        onClick={() => setShowGuide(!showGuide)}
        style={{
          width: '100%', background: 'transparent',
          border: `1px solid ${s.gray}`, color: 'rgba(255,255,255,0.7)',
          borderRadius: 7, padding: '8px 10px', fontSize: 11, cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 600, textAlign: 'left',
          marginTop: 4,
        }}
      >
        {showGuide ? '▼' : '▶'} 📖 Audio setup guide (best results)
      </button>

      {showGuide && (
        <div style={{
          marginTop: 8, padding: 12, background: 'rgba(0,0,0,0.3)',
          borderRadius: 8, fontSize: 11, lineHeight: 1.7,
        }}>
          <div style={{ color: '#4ade80', fontWeight: 800, marginBottom: 6 }}>
            ✅ BEST SETUP (no echo)
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>
            📱 Phone + Bluetooth speaker<br />
            🎤 Wired mic (3.5mm or USB-C)<br />
            → Turn ON Karaoke mode
          </div>

          <div style={{ color: '#fbbf24', fontWeight: 800, marginBottom: 6 }}>
            🟡 OK SETUP
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>
            📱 Phone + BT speaker<br />
            🎤 Phone built-in mic<br />
            → Keep echo cancellation ON
          </div>

          <div style={{ color: '#ff6b6b', fontWeight: 800, marginBottom: 6 }}>
            ❌ AVOID
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>
            🎤 BT mic + 📱 phone speaker<br />
            → Feedback loop likely<br /><br />
            🎤 BT mic + 🔊 BT speaker (different devices)<br />
            → OS may not handle well
          </div>

          <div style={{ color: s.redLight, fontWeight: 800, marginBottom: 6 }}>
            💡 PAIR BLUETOOTH SPEAKER
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)' }}>
            1. Phone Settings → Bluetooth<br />
            2. Connect speaker<br />
            3. ALL audio auto-routes there<br />
            4. App follows phone default
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'absolute', bottom: -48, left: '50%',
          transform: 'translateX(-50%)', background: s.dark,
          border: `1px solid ${s.red}`, color: 'white',
          padding: '8px 14px', borderRadius: 100, fontSize: 11,
          fontWeight: 600, whiteSpace: 'nowrap', zIndex: 50,
          boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
