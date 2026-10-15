import { useMemo, useState } from 'react'
import { ArrowLeft, BookOpenCheck, FileText, Headphones, Languages, ListChecks, PenLine, Rows3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EXAMS, getExam, getListening, MODULE_LABELS } from '@/data/exams'
import { useAppStore } from '@/hooks/useAppStore'
import type { ExamSet } from '@/types'
import ListeningRunner from './ListeningRunner'
import ClozeRunner from './ClozeRunner'
import MatchRunner from './MatchRunner'
import CarefulRunner from './CarefulRunner'
import WritingTranslation from './WritingTranslation'

type ModuleId = 'listening' | 'cloze' | 'match' | 'careful1' | 'careful2' | 'writing'

const MODULE_ICONS: Record<ModuleId, typeof Headphones> = {
  listening: Headphones,
  cloze: Rows3,
  match: ListChecks,
  careful1: BookOpenCheck,
  careful2: BookOpenCheck,
  writing: PenLine,
}

const MODULE_DESC: Record<ModuleId, string> = {
  listening: '25 题 · 7 篇录音 · 合成语音播放',
  cloze: '10 空 · 15 词备选',
  match: '10 句 · 段落匹配',
  careful1: '5 题 · 四选一',
  careful2: '5 题 · 四选一',
  writing: '写作 + 汉译英 · 范文对照',
}

/** best percentage per module for one exam, aggregated from history */
function useBestScores(examId: string) {
  const { data } = useAppStore()
  return useMemo(() => {
    const map: Record<string, number> = {}
    const take = (key: string, pct: number) => {
      map[key] = Math.max(map[key] ?? 0, pct)
    }
    for (const r of data.quizResults) {
      if (!r.refId.startsWith(examId + ':')) continue
      const rest = r.refId.slice(examId.length + 1)
      const pct = r.score / r.total
      if (rest.startsWith('listening:')) {
        // accumulate per-piece into a combined listening best
        const prev = map['listening:_sum']
        const prevN = map['listening:_n'] ?? 0
        map['listening:_sum'] = (prev ?? 0) + pct
        map['listening:_n'] = prevN + 1
      } else {
        take(rest, pct)
      }
    }
    if (map['listening:_n']) map['listening'] = map['listening:_sum'] / map['listening:_n']
    return map
  }, [data.quizResults, examId])
}

function ExamDetail({ exam, onBack, onOpen }: { exam: ExamSet; onBack: () => void; onOpen: (m: ModuleId) => void }) {
  const best = useBestScores(exam.id)
  const { pieces } = getListening(exam)
  const modules: ModuleId[] = ['listening', 'cloze', 'match', 'careful1', 'careful2', 'writing']

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> 全部试卷
        </Button>
        <h2 className="text-xl font-bold">{exam.label}</h2>
        <Badge variant="secondary">CET-6 真题</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const Icon = MODULE_ICONS[m]
          const b = best[m]
          const disabled = m === 'listening' && pieces.length === 0
          return (
            <Card
              key={m}
              className={`transition-colors ${disabled ? 'opacity-50' : 'hover:border-primary/40 cursor-pointer'}`}
              onClick={() => !disabled && onOpen(m)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{MODULE_LABELS[m]}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{MODULE_DESC[m]}</div>
                  </div>
                  {b !== undefined && (
                    <Badge variant="outline" className={b === 1 ? 'text-emerald-600 border-emerald-300' : ''}>
                      最佳 {Math.round(b * 100)}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" />
        题目、原文、答案与解析均来自该套真题卷；听力和阅读提交后自动评分并打卡。
      </p>
    </div>
  )
}

export default function Exams() {
  const [examId, setExamId] = useState<string | null>(null)
  const [module, setModule] = useState<ModuleId | null>(null)
  const { data } = useAppStore()

  // per-exam completion summary
  const summaries = useMemo(() => {
    const map: Record<string, { done: number; bestAvg: number | null }> = {}
    for (const exam of EXAMS) {
      const mods = new Set<string>()
      let sum = 0
      let n = 0
      for (const r of data.quizResults) {
        if (!r.refId.startsWith(exam.id + ':')) continue
        const rest = r.refId.slice(exam.id.length + 1).replace(/:\d+$/, '')
        mods.add(rest)
        sum += r.score / r.total
        n += 1
      }
      map[exam.id] = { done: mods.size, bestAvg: n ? sum / n : null }
    }
    return map
  }, [data.quizResults])

  if (examId && module === 'listening') return <ListeningRunner examId={examId} onExit={() => setModule(null)} />
  if (examId && module === 'cloze') return <ClozeRunner examId={examId} onExit={() => setModule(null)} />
  if (examId && module === 'match') return <MatchRunner examId={examId} onExit={() => setModule(null)} />
  if (examId && module === 'careful1') return <CarefulRunner examId={examId} passageIdx={0} onExit={() => setModule(null)} />
  if (examId && module === 'careful2') return <CarefulRunner examId={examId} passageIdx={1} onExit={() => setModule(null)} />
  if (examId && module === 'writing') return <WritingTranslation examId={examId} onExit={() => setModule(null)} />
  if (examId) {
    const exam = getExam(examId)!
    return <ExamDetail exam={exam} onBack={() => setExamId(null)} onOpen={setModule} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">六级真题题库</h2>
        <p className="text-sm text-muted-foreground mt-1">
          收录 2025年12月（第 1–3 套）与 2026年6月（第 2、3 套）共 5 套真题，含听力（合成语音）、阅读三大题型、写作与翻译范文。
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {EXAMS.map((exam) => {
          const s = summaries[exam.id]
          return (
            <Card key={exam.id} className="hover:border-primary/40 transition-colors cursor-pointer group" onClick={() => setExamId(exam.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge>CET-6</Badge>
                  {s.done > 0 && <Badge variant="outline" className="text-emerald-600 border-emerald-300">已练 {s.done} 个模块</Badge>}
                </div>
                <CardTitle className="text-base leading-snug pt-1 group-hover:text-primary transition-colors">{exam.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Headphones className="h-3 w-3" /> 听力 25 题</span>
                  <span className="flex items-center gap-1"><BookOpenCheck className="h-3 w-3" /> 阅读 30 题</span>
                  <span className="flex items-center gap-1"><Languages className="h-3 w-3" /> 写译 2 篇</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
