// Browser speechSynthesis player for listening transcripts.
// No audio files needed — the transcript is synthesized locally, so the app
// works fully offline and can be shared as static files.

export interface TtsSegment {
  speaker: string // 'W' | 'M' | ''
  en: string
}

export interface TtsCallbacks {
  onSegment?: (index: number) => void
  onEnd?: () => void
}

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  cachedVoices = window.speechSynthesis?.getVoices() ?? []
  return cachedVoices
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = () => loadVoices()
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickEnglishVoices(): { female?: SpeechSynthesisVoice; male?: SpeechSynthesisVoice; any?: SpeechSynthesisVoice } {
  if (cachedVoices.length === 0) loadVoices()
  const en = cachedVoices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const prefer = (names: string[]) => en.find((v) => names.some((n) => v.name.toLowerCase().includes(n)))
  const female =
    prefer(['samantha', 'zira', 'female', 'susan', 'karen', 'moira', 'tessa', 'serena', 'allison', 'ava']) ??
    en.find((v) => /female/i.test(v.name))
  const male =
    prefer(['alex', 'david', 'daniel', 'male', 'fred', 'aaron', 'arthur', 'guy', 'james', 'george']) ??
    en.find((v) => /male/i.test(v.name) && v !== female)
  const any = female ?? male ?? en.find((v) => v.lang === 'en-US') ?? en[0]
  return { female: female ?? any, male: male ?? any, any }
}

export class TtsPlayer {
  private cancelled = false
  private queue: SpeechSynthesisUtterance[] = []
  playing = false

  play(segments: TtsSegment[], rate: number, cb: TtsCallbacks = {}) {
    this.stop()
    if (!ttsSupported()) {
      cb.onEnd?.()
      return
    }
    this.cancelled = false
    this.playing = true
    const voices = pickEnglishVoices()
    const synth = window.speechSynthesis

    this.queue = segments.map((seg, idx) => {
      const u = new SpeechSynthesisUtterance(seg.en)
      const isW = seg.speaker === 'W'
      const isM = seg.speaker === 'M'
      u.voice = (isW ? voices.female : isM ? voices.male : voices.any) ?? null
      u.rate = rate
      u.pitch = isW ? 1.05 : isM ? 0.9 : 1.0
      u.onstart = () => cb.onSegment?.(idx)
      u.onend = () => {
        if (!this.cancelled && idx === segments.length - 1) {
          this.playing = false
          cb.onEnd?.()
        }
      }
      u.onerror = () => {
        if (!this.cancelled && idx === segments.length - 1) {
          this.playing = false
          cb.onEnd?.()
        }
      }
      return u
    })

    // Chrome occasionally stalls on long queues; cancel then speak serially.
    synth.cancel()
    for (const u of this.queue) synth.speak(u)
  }

  pause() {
    if (ttsSupported()) window.speechSynthesis.pause()
  }

  resume() {
    if (ttsSupported()) window.speechSynthesis.resume()
  }

  stop() {
    this.cancelled = true
    this.playing = false
    this.queue = []
    if (ttsSupported()) window.speechSynthesis.cancel()
  }
}
