import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { DictEntry, QuizResult, StoreData, WordBookItem } from '@/types'

const STORAGE_KEY = 'lingoloop-cet6-v1'

// Ebbinghaus review intervals in days, by level
export const REVIEW_INTERVALS = [0, 1, 2, 4, 7, 15]

export function todayStr(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(base: Date, n: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return todayStr(d)
}

function load(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoreData>
      return {
        checkins: parsed.checkins ?? [],
        words: parsed.words ?? [],
        quizResults: parsed.quizResults ?? [],
        drafts: parsed.drafts ?? {},
      }
    }
  } catch {
    // corrupted storage — start fresh
  }
  return { checkins: [], words: [], quizResults: [], drafts: {} }
}

interface AppStore {
  data: StoreData
  checkedToday: boolean
  streak: number
  checkIn: () => void
  autoCheckIn: () => void
  addWord: (entry: DictEntry) => boolean
  removeWord: (word: string) => void
  reviewWord: (word: string, remembered: boolean) => void
  recordQuiz: (result: QuizResult) => void
  saveDraft: (key: string, text: string) => void
  clearHistory: () => void
}

const Ctx = createContext<AppStore | null>(null)

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StoreData>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const today = todayStr()
  const checkedToday = data.checkins.includes(today)

  // consecutive-day streak ending today (or yesterday if not yet checked in)
  const streak = useMemo(() => {
    const set = new Set(data.checkins)
    let count = 0
    const cursor = new Date()
    if (!set.has(todayStr(cursor))) cursor.setDate(cursor.getDate() - 1)
    while (set.has(todayStr(cursor))) {
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [data.checkins])

  const checkIn = useCallback(() => {
    setData((prev) =>
      prev.checkins.includes(todayStr())
        ? prev
        : { ...prev, checkins: [...prev.checkins, todayStr()].sort() },
    )
  }, [])

  // silent check-in on meaningful activity (quiz / review), keeps streak alive
  const autoCheckIn = useCallback(() => {
    setData((prev) =>
      prev.checkins.includes(todayStr())
        ? prev
        : { ...prev, checkins: [...prev.checkins, todayStr()].sort() },
    )
  }, [])

  const addWord = useCallback((entry: DictEntry) => {
    const word = entry.word.trim().toLowerCase()
    if (!word) return false
    let added = false
    setData((prev) => {
      if (prev.words.some((w) => w.word === word)) return prev
      added = true
      const item: WordBookItem = {
        ...entry,
        word,
        addedAt: todayStr(),
        level: 0,
        nextReview: todayStr(), // due immediately
        reviewCount: 0,
        mastered: false,
      }
      return { ...prev, words: [...prev.words, item] }
    })
    return added
  }, [])

  const removeWord = useCallback((word: string) => {
    setData((prev) => ({ ...prev, words: prev.words.filter((w) => w.word !== word) }))
  }, [])

  const reviewWord = useCallback((word: string, remembered: boolean) => {
    setData((prev) => ({
      ...prev,
      checkins: prev.checkins.includes(todayStr())
        ? prev.checkins
        : [...prev.checkins, todayStr()].sort(),
      words: prev.words.map((w) => {
        if (w.word !== word) return w
        const level = remembered ? Math.min(w.level + 1, REVIEW_INTERVALS.length - 1) : Math.max(w.level - 1, 0)
        const mastered = remembered && w.level >= REVIEW_INTERVALS.length - 1 ? true : w.mastered
        const nextReview = mastered
          ? addDays(new Date(), 30)
          : addDays(new Date(), REVIEW_INTERVALS[level])
        return { ...w, level, mastered, nextReview, reviewCount: w.reviewCount + 1 }
      }),
    }))
  }, [])

  const recordQuiz = useCallback((result: QuizResult) => {
    setData((prev) => ({
      ...prev,
      checkins: prev.checkins.includes(todayStr())
        ? prev.checkins
        : [...prev.checkins, todayStr()].sort(),
      quizResults: [...prev.quizResults, result],
    }))
  }, [])

  const saveDraft = useCallback((key: string, text: string) => {
    setData((prev) => ({ ...prev, drafts: { ...prev.drafts, [key]: text } }))
  }, [])

  const clearHistory = useCallback(() => {
    setData({ checkins: [], words: [], quizResults: [], drafts: {} })
  }, [])

  const value = useMemo(
    () => ({ data, checkedToday, streak, checkIn, autoCheckIn, addWord, removeWord, reviewWord, recordQuiz, saveDraft, clearHistory }),
    [data, checkedToday, streak, checkIn, autoCheckIn, addWord, removeWord, reviewWord, recordQuiz, saveDraft, clearHistory],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
