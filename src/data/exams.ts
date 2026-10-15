import rawData from './exams.json'
import type { ExamSet } from '@/types'

const data = rawData as unknown as Record<string, ExamSet>

// Fixed display order: newest first
export const EXAM_ORDER = ['2026-06-3', '2026-06-2', '2025-12-3', '2025-12-2', '2025-12-1']

export const EXAMS: ExamSet[] = EXAM_ORDER.map((id) => data[id]).filter(Boolean)

export function getExam(id: string): ExamSet | undefined {
  return data[id]
}

/** Resolve the listening pieces for a set, following listeningRef for shared audio sets. */
export function getListening(exam: ExamSet): { pieces: ListeningPieceList; sharedFrom?: string } {
  if (exam.listening) return { pieces: exam.listening }
  if (exam.listeningRef) {
    const ref = data[exam.listeningRef]
    if (ref?.listening) {
      return { pieces: ref.listening, sharedFrom: ref.label }
    }
  }
  return { pieces: [] }
}

type ListeningPieceList = NonNullable<ExamSet['listening']>

export const MODULE_LABELS: Record<string, string> = {
  listening: '听力理解',
  cloze: '选词填空',
  match: '长篇阅读 · 信息匹配',
  careful1: '仔细阅读 · 第一篇',
  careful2: '仔细阅读 · 第二篇',
  writing: '写作',
  translation: '翻译',
}

export const PIECE_KIND_LABELS: Record<string, string> = {
  conversation: '长对话',
  passage: '听力篇章',
  lecture: '讲座/讲话',
}
