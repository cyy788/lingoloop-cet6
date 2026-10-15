import { useState } from 'react'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getExam } from '@/data/exams'
import { useAppStore, todayStr } from '@/hooks/useAppStore'
import { BilingualParagraphs, McAnalysis, McOptions, ResultBanner } from '@/components/quiz-shared'

export default function CarefulRunner({ examId, passageIdx, onExit }: { examId: string; passageIdx: 0 | 1; onExit: () => void }) {
  const exam = getExam(examId)!
  const passage = exam.careful[passageIdx]
  const { recordQuiz } = useAppStore()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const moduleKey = passageIdx === 0 ? 'careful1' : 'careful2'
  const answered = Object.keys(answers).length
  const score = passage.questions.filter((q) => answers[q.num] === q.answer).length

  const handleSubmit = () => {
    setSubmitted(true)
    recordQuiz({
      refId: `${examId}:${moduleKey}`,
      kind: moduleKey as 'careful1' | 'careful2',
      date: todayStr(),
      score,
      total: passage.questions.length,
      wrongQuestionIds: passage.questions.filter((q) => answers[q.num] !== q.answer).map((q) => String(q.num)),
    })
    toast.success(`提交成功：${score}/${passage.questions.length}，已自动打卡`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> 返回试卷
        </Button>
        <h2 className="text-lg font-bold">{exam.label} · 仔细阅读 {passageIdx === 0 ? '第一篇' : '第二篇'}</h2>
        <Badge variant="secondary">
          {passage.questions[0].num}–{passage.questions[passage.questions.length - 1].num} 题
        </Badge>
      </div>

      {submitted && <ResultBanner score={score} total={passage.questions.length} onExit={onExit} />}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="lg:max-h-[75vh] lg:overflow-y-auto">
          <CardHeader className="pb-2 sticky top-0 bg-card z-10 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> 阅读原文
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <BilingualParagraphs paragraphs={passage.paragraphs} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {passage.questions.map((q) => (
            <Card key={q.num}>
              <CardContent className="pt-4">
                <div className="font-medium text-[15px]">{q.num}. {q.prompt}</div>
                <McOptions q={q} chosen={answers[q.num]} onChoose={(l) => setAnswers((p) => ({ ...p, [q.num]: l }))} submitted={submitted} />
                {submitted && <McAnalysis q={q} />}
              </CardContent>
            </Card>
          ))}
          {!submitted && (
            <div className="flex items-center gap-4">
              <Button onClick={handleSubmit} disabled={answered < passage.questions.length}>提交答案</Button>
              <span className="text-sm text-muted-foreground">已答 {answered}/{passage.questions.length} 题</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
