// ---------- 单词本 ----------
export interface DictEntry {
  word: string
  phonetic?: string
  pos: string
  meaning: string
  example?: string
}

export interface WordBookItem extends DictEntry {
  addedAt: string // yyyy-mm-dd
  level: number // ebbinghaus stage 0..5
  nextReview: string // yyyy-mm-dd
  reviewCount: number
  mastered: boolean
}

// ---------- 六级真题数据 ----------
export interface MCQuestion {
  num: number
  prompt: string
  translation?: string
  options: string[]
  answer: string // 'A' | 'B' | 'C' | 'D'
  qtype: string
  locateEn: string
  locateCn: string
  signal?: string
}

export interface TranscriptSegment {
  speaker: string // 'W' | 'M' | ''
  en: string
  cn: string
}

export interface ListeningPiece {
  kind: 'conversation' | 'passage' | 'lecture'
  segments: TranscriptSegment[]
  questions: MCQuestion[]
}

export interface ClozeAnswer {
  letter: string
  word: string
  pos: string
  explanation: string
}

export interface ClozeData {
  passage: string // contains __26__ ... __35__ markers
  bank: Record<string, string> // letter -> word
  answers: Record<string, ClozeAnswer> // '26' -> ...
}

export interface MatchParagraph {
  en: string
  cn: string
}

export interface MatchStatement {
  num: number
  text: string
  answer: string // paragraph letter
  anchor: string
  locateEn: string
  locateCn: string
}

export interface MatchData {
  title: string
  paragraphs: Record<string, MatchParagraph>
  statements: MatchStatement[]
}

export interface CarefulPassage {
  paragraphs: { en: string; cn: string }[]
  questions: MCQuestion[]
}

export interface ExamSet {
  id: string
  label: string
  writing: { modelEssay: string; modelCn: string }
  translation: { source: string; reference: string }
  cloze: ClozeData
  match: MatchData
  careful: CarefulPassage[]
  listening?: ListeningPiece[]
  listeningRef?: string // id of the set whose listening this set shares
}

// ---------- 练习记录 ----------
export type ModuleKind = 'listening' | 'cloze' | 'match' | 'careful1' | 'careful2'

export interface QuizResult {
  refId: string // `${examId}:${module}` or `${examId}:listening:${pieceIdx}`
  kind: ModuleKind | 'listening-piece'
  date: string // yyyy-mm-dd
  score: number
  total: number
  wrongQuestionIds: string[]
}

export interface StoreData {
  checkins: string[]
  words: WordBookItem[]
  quizResults: QuizResult[]
  drafts: Record<string, string> // writing / translation self drafts
}
