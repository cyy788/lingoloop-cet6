import { useMemo, useState } from 'react'
import { ArrowLeft, Languages } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getExam } from '@/data/exams'
import { useAppStore, todayStr } from '@/hooks/useAppStore'
import { ResultBanner } from '@/components/quiz-shared'

const PARA_LETTERS = 'ABCDEFGHIJKLMNOPQRST'.split('')

export default function MatchRunner({ examId, onExit }: { examId: string; onExit: () => void }) {
  const exam = getExam(examId)!
  const match = exam.match
  const { recordQuiz } = useAppStore()
  const [picks, setPicks] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showCn, setShowCn] = useState(false)

  const letters = useMemo(() => PARA_LETTERS.filter((l) => match.paragraphs[l]), [match])
  const answeredCount = Object.keys(picks).filter((k) => picks[Number(k)]).length
  const score = match.statements.filter((s) => picks[s.num] === s.answer).length

  const handleSubmit = () => {
    setSubmitted(true)
    recordQuiz({
      refId: `${examId}:match`,
      kind: 'match',
      date: todayStr(),
      score,
      total: match.statements.length,
      wrongQuestionIds: match.statements.filter((s) => picks[s.num] !== s.answer).map((s) => String(s.num)),
    })
    toast.success(`提交成功：${score}/${match.statements.length}，已自动打卡`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> 返回试卷
        </Button>
        <h2 className="text-lg font-bold">{exam.label} · 长篇阅读</h2>
        <Badge variant="secondary">36–45 题 · 段落信息匹配</Badge>
      </div>

      {submitted && <ResultBanner score={score} total={match.statements.length} onExit={onExit} />}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* paragraphs */}
        <Card className="lg:max-h-[75vh] lg:overflow-y-auto">
          <CardHeader className="pb-2 sticky top-0 bg-card z-10 border-b">
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span className="flex-1 min-w-0 leading-6">{match.title}</span>
              <Button variant="ghost" size="sm" className="gap-1 text-xs shrink-0" onClick={() => setShowCn((v) => !v)}>
                <Languages className="h-3.5 w-3.5" /> {showCn ? '隐藏译文' : '显示译文'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {letters.map((l) => {
              const p = match.paragraphs[l]
              return (
                <div key={l}>
                  <p className="leading-7 text-[14px]">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 mr-1.5">{l}.</span>
                    {p.en}
                  </p>
                  {showCn && p.cn && <p className="text-[13px] text-muted-foreground leading-6 mt-1">{p.cn}</p>}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* statements */}
        <div className="space-y-3">
          {match.statements.map((s) => {
            const chosen = picks[s.num]
            const right = submitted && chosen === s.answer
            const wrong = submitted && chosen !== s.answer
            return (
              <Card key={s.num} className={right ? 'border-emerald-300 bg-emerald-50/40' : wrong ? 'border-red-300 bg-red-50/40' : ''}>
                <CardContent className="pt-3 pb-3">
                  <div className="text-sm leading-6">
                    <span className="font-semibold mr-1.5">{s.num}.</span>
                    {s.text}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {letters.map((l) => {
                      const isChosen = chosen === l
                      const isAns = submitted && s.answer === l
                      return (
                        <button
                          key={l}
                          disabled={submitted}
                          onClick={() => setPicks((p) => ({ ...p, [s.num]: p[s.num] === l ? '' : l }))}
                          className={`h-7 w-7 rounded-md border text-xs font-medium transition-colors ${
                            isAns ? 'bg-emerald-600 text-white border-emerald-600'
                            : isChosen && wrong ? 'bg-red-500 text-white border-red-500'
                            : isChosen ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:border-primary/60 text-muted-foreground'
                          }`}
                        >
                          {l}
                        </button>
                      )
                    })}
                  </div>
                  {submitted && (
                    <div className="mt-2.5 rounded-lg bg-muted/50 border p-2.5 text-[13px] space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 hover:bg-emerald-600">答案 {s.answer} 段</Badge>
                        {s.anchor && <span className="text-xs text-muted-foreground">锚点：{s.anchor}</span>}
                      </div>
                      {s.locateEn && (
                        <div>
                          <div className="leading-6">{s.locateEn}</div>
                          {s.locateCn && <div className="text-muted-foreground text-xs leading-5 mt-0.5">{s.locateCn}</div>}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {!submitted && (
            <div className="flex items-center gap-4 pt-1">
              <Button onClick={handleSubmit} disabled={answeredCount < match.statements.length}>提交答案</Button>
              <span className="text-sm text-muted-foreground">已答 {answeredCount}/{match.statements.length} 题</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
