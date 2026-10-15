import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getExam } from '@/data/exams'
import { useAppStore, todayStr } from '@/hooks/useAppStore'
import { ResultBanner } from '@/components/quiz-shared'

const BANK_LETTERS = 'ABCDEFGHIJKLMNO'.split('')

export default function ClozeRunner({ examId, onExit }: { examId: string; onExit: () => void }) {
  const exam = getExam(examId)!
  const cloze = exam.cloze
  const { recordQuiz } = useAppStore()
  const [picks, setPicks] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [activeBlank, setActiveBlank] = useState<number | null>(26)

  const nums = useMemo(() => Object.keys(cloze.answers).map(Number).sort((a, b) => a - b), [cloze])
  const usedLetters = useMemo(() => new Set(Object.values(picks)), [picks])
  const answeredCount = Object.keys(picks).filter((k) => picks[Number(k)]).length
  const score = nums.filter((n) => picks[n] === cloze.answers[String(n)].letter).length

  const choose = (letter: string) => {
    if (activeBlank === null || submitted) return
    setPicks((prev) => {
      const next = { ...prev }
      // free the letter from wherever it was used
      for (const k of Object.keys(next)) if (next[Number(k)] === letter) delete next[Number(k)]
      next[activeBlank] = letter
      return next
    })
    const idx = nums.indexOf(activeBlank)
    setActiveBlank(nums[idx + 1] ?? activeBlank)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    recordQuiz({
      refId: `${examId}:cloze`,
      kind: 'cloze',
      date: todayStr(),
      score,
      total: nums.length,
      wrongQuestionIds: nums.filter((n) => picks[n] !== cloze.answers[String(n)].letter).map(String),
    })
    toast.success(`提交成功：${score}/${nums.length}，已自动打卡`)
  }

  // render passage with blank chips
  const rendered = useMemo(() => {
    const parts = cloze.passage.split(/__(\d{2})__/)
    const out: React.ReactNode[] = []
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        out.push(<span key={i}>{parts[i]}</span>)
      } else {
        const num = Number(parts[i])
        const letter = picks[num]
        const ans = cloze.answers[String(num)]
        const isRight = submitted && letter === ans?.letter
        const isWrong = submitted && letter !== ans?.letter
        out.push(
          <button
            key={i}
            disabled={submitted}
            onClick={() => setActiveBlank(num)}
            className={`inline-flex items-center justify-center min-w-14 mx-0.5 px-1.5 rounded border text-[13px] font-medium align-baseline leading-5 transition-colors ${
              isRight ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : isWrong ? 'border-red-300 bg-red-50 text-red-600 line-through'
              : activeBlank === num ? 'border-primary bg-primary/10 text-primary'
              : letter ? 'border-emerald-300 bg-emerald-50/60 text-emerald-800 dark:text-emerald-300'
              : 'border-dashed border-muted-foreground/50 text-muted-foreground'
            }`}
          >
            {letter ? `${letter}. ${cloze.bank[letter] ?? ''}` : num}
          </button>,
        )
        if (isWrong) {
          out.push(
            <span key={`${i}-corr`} className="inline-flex mx-0.5 px-1.5 rounded bg-emerald-100 text-emerald-700 text-[13px] font-medium leading-5">
              {ans.letter}. {ans.word}
            </span>,
          )
        }
      }
    }
    return out
  }, [cloze, picks, submitted, activeBlank])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> 返回试卷
        </Button>
        <h2 className="text-lg font-bold">{exam.label} · 选词填空</h2>
        <Badge variant="secondary">26–35 题</Badge>
      </div>

      {submitted && <ResultBanner score={score} total={nums.length} onExit={onExit} />}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">阅读原文 · 点击空格后从下方词库选词</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-8 text-[15px]">{rendered}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="text-xs text-muted-foreground mb-2">
            {activeBlank !== null && !submitted ? `正在为第 ${activeBlank} 空选词（每个词只能选一次，点击空格可清除重选）` : submitted ? '已提交，绿色为正确答案' : '先点击一个空格'}
          </div>
          <div className="flex flex-wrap gap-2">
            {BANK_LETTERS.map((letter) => {
              const word = cloze.bank[letter]
              if (!word) return null
              const used = usedLetters.has(letter)
              return (
                <button
                  key={letter}
                  disabled={submitted || (used && picks[activeBlank ?? -1] !== letter)}
                  onClick={() => choose(letter)}
                  className={`px-2.5 py-1 rounded-md border text-sm transition-colors ${
                    used ? 'opacity-35 line-through cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5 cursor-pointer'
                  }`}
                >
                  <span className="font-semibold mr-1">{letter}</span>
                  {word}
                </button>
              )
            })}
          </div>
          {!submitted && activeBlank !== null && picks[activeBlank] && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setPicks((p) => { const n = { ...p }; delete n[activeBlank]; return n })}>
              清除第 {activeBlank} 空
            </Button>
          )}
        </CardContent>
      </Card>

      {!submitted ? (
        <div className="flex items-center gap-4">
          <Button onClick={handleSubmit} disabled={answeredCount < nums.length}>提交答案</Button>
          <span className="text-sm text-muted-foreground">已填 {answeredCount}/{nums.length} 空</span>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold">逐空解析</h3>
          {nums.map((n) => {
            const a = cloze.answers[String(n)]
            const right = picks[n] === a.letter
            return (
              <Card key={n} className={right ? 'border-emerald-200' : 'border-red-200'}>
                <CardContent className="pt-3 pb-3 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    {right ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="font-medium">第 {n} 空</span>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">{a.letter}. {a.word}</Badge>
                    {a.pos && <Badge variant="secondary">{a.pos}</Badge>}
                    {!right && picks[n] && <span className="text-xs text-red-500 line-through">你选了 {picks[n]}. {cloze.bank[picks[n]]}</span>}
                  </div>
                  {a.explanation && <p className="text-muted-foreground mt-1.5 leading-6">{a.explanation}</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
