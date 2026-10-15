import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpenText, Headphones, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getExam, getListening, PIECE_KIND_LABELS } from '@/data/exams'
import { TtsPlayer, ttsSupported } from '@/lib/tts'
import { useAppStore, todayStr } from '@/hooks/useAppStore'
import { McAnalysis, McOptions, ResultBanner } from '@/components/quiz-shared'
import type { ListeningPiece } from '@/types'

const RATES = [0.75, 1, 1.25, 1.5]

function PlayerBar({
  piece,
  onSegment,
  playerRef,
}: {
  piece: ListeningPiece
  onSegment: (idx: number) => void
  playerRef: React.MutableRefObject<TtsPlayer | null>
}) {
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [rate, setRate] = useState(1)

  useEffect(() => () => playerRef.current?.stop(), [playerRef])

  const start = () => {
    if (!ttsSupported()) {
      toast.error('当前浏览器不支持语音合成，请使用 Chrome / Edge / Safari 打开')
      return
    }
    if (!playerRef.current) playerRef.current = new TtsPlayer()
    playerRef.current.play(piece.segments, rate, {
      onSegment,
      onEnd: () => setState('idle'),
    })
    setState('playing')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap rounded-xl border bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30 px-4 py-3">
      {state === 'idle' ? (
        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={start}>
          <Play className="h-4 w-4" /> 播放录音
        </Button>
      ) : state === 'playing' ? (
        <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => { playerRef.current?.pause(); setState('paused') }}>
          <Pause className="h-4 w-4" /> 暂停
        </Button>
      ) : (
        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => { playerRef.current?.resume(); setState('playing') }}>
          <Play className="h-4 w-4" /> 继续
        </Button>
      )}
      {state !== 'idle' && (
        <Button size="sm" variant="ghost" className="gap-1" onClick={() => { playerRef.current?.stop(); setState('idle'); onSegment(-1) }}>
          <Square className="h-3.5 w-3.5" /> 停止
        </Button>
      )}
      <Button size="sm" variant="ghost" className="gap-1" onClick={start}>
        <RotateCcw className="h-3.5 w-3.5" /> 重听
      </Button>
      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        语速
        {RATES.map((r) => (
          <button
            key={r}
            onClick={() => setRate(r)}
            className={`px-1.5 py-0.5 rounded ${rate === r ? 'bg-emerald-600 text-white' : 'hover:bg-muted'}`}
          >
            {r}x
          </button>
        ))}
      </div>
    </div>
  )
}

function PieceRunner({ examId, pieceIdx, onExit }: { examId: string; pieceIdx: number; onExit: () => void }) {
  const exam = getExam(examId)!
  const { pieces } = getListening(exam)
  const piece = pieces[pieceIdx]
  const { recordQuiz } = useAppStore()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [activeSeg, setActiveSeg] = useState(-1)
  const playerRef = useRef<TtsPlayer | null>(null)

  const answered = Object.keys(answers).length
  const score = piece.questions.filter((q) => answers[q.num] === q.answer).length

  const handleSubmit = () => {
    setSubmitted(true)
    setShowScript(true)
    recordQuiz({
      refId: `${examId}:listening:${pieceIdx}`,
      kind: 'listening-piece',
      date: todayStr(),
      score,
      total: piece.questions.length,
      wrongQuestionIds: piece.questions.filter((q) => answers[q.num] !== q.answer).map((q) => String(q.num)),
    })
    toast.success(`提交成功：${score}/${piece.questions.length}，已自动打卡`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => { playerRef.current?.stop(); onExit() }} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> 返回
        </Button>
        <h2 className="text-lg font-bold">{exam.label} · 听力</h2>
        <Badge variant="secondary">{PIECE_KIND_LABELS[piece.kind]} · 第 {piece.questions[0].num}–{piece.questions[piece.questions.length - 1].num} 题</Badge>
      </div>

      {submitted && <ResultBanner score={score} total={piece.questions.length} onExit={onExit} />}

      <PlayerBar piece={piece} onSegment={setActiveSeg} playerRef={playerRef} />

      <p className="text-xs text-muted-foreground">
        录音由浏览器语音合成朗读原文生成，不联网、可离线。先听录音做题，提交后自动解锁原文与翻译。
      </p>

      {/* transcript */}
      {showScript ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpenText className="h-4 w-4" /> 听力原文与翻译
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {piece.segments.map((seg, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 ${i === activeSeg ? 'bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-300' : ''}`}>
                <p className="leading-6 text-[14px]">
                  {seg.speaker && <span className={`font-semibold mr-1.5 ${seg.speaker === 'W' ? 'text-rose-500' : 'text-sky-600'}`}>{seg.speaker}:</span>}
                  {seg.en}
                </p>
                {seg.cn && <p className="text-[13px] text-muted-foreground leading-6 mt-0.5">{seg.cn}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowScript(true)}>
          提前查看原文（建议先听完再点开）
        </Button>
      )}

      {/* questions */}
      <div className="space-y-4">
        {piece.questions.map((q) => (
          <Card key={q.num}>
            <CardContent className="pt-4">
              <div className="font-medium text-[15px]">
                {q.num}. {q.prompt}
              </div>
              <McOptions q={q} chosen={answers[q.num]} onChoose={(l) => setAnswers((p) => ({ ...p, [q.num]: l }))} submitted={submitted} />
              {submitted && <McAnalysis q={q} showSignal />}
            </CardContent>
          </Card>
        ))}
      </div>

      {!submitted && (
        <div className="flex items-center gap-4">
          <Button onClick={handleSubmit} disabled={answered < piece.questions.length}>
            提交答案
          </Button>
          <span className="text-sm text-muted-foreground">已答 {answered}/{piece.questions.length} 题</span>
        </div>
      )}
    </div>
  )
}

export default function ListeningRunner({ examId, onExit }: { examId: string; onExit: () => void }) {
  const exam = getExam(examId)!
  const { pieces, sharedFrom } = getListening(exam)
  const [activePiece, setActivePiece] = useState<number | null>(null)
  const { data } = useAppStore()

  const best = useMemo(() => {
    const map: Record<number, number> = {}
    for (const r of data.quizResults) {
      const m = r.refId.match(/^(.+):listening:(\d+)$/)
      if (m && m[1] === examId) {
        const idx = Number(m[2])
        map[idx] = Math.max(map[idx] ?? 0, r.score / r.total)
      }
    }
    return map
  }, [data.quizResults, examId])

  if (activePiece !== null) {
    return <PieceRunner examId={examId} pieceIdx={activePiece} onExit={() => setActivePiece(null)} />
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> 返回试卷
        </Button>
        <h2 className="text-lg font-bold">{exam.label} · 听力理解</h2>
      </div>
      {sharedFrom && (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-3 py-2">
          提示：本次六级全国只考两套听力，本套听力与「{sharedFrom}」相同。
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {pieces.map((p, i) => {
          const b = best[i]
          return (
            <Card key={i} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setActivePiece(i)}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Headphones className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {PIECE_KIND_LABELS[p.kind]} {i + 1}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    第 {p.questions[0].num}–{p.questions[p.questions.length - 1].num} 题 · {p.segments.length} 段录音文本
                  </div>
                </div>
                {b !== undefined && (
                  <Badge variant="outline" className={b === 1 ? 'text-emerald-600 border-emerald-300' : ''}>
                    最佳 {Math.round(b * 100)}%
                  </Badge>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
