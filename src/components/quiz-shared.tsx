import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Languages, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { MCQuestion } from '@/types'

export const LETTERS = ['A', 'B', 'C', 'D']

// ---------- top score banner ----------
export function ResultBanner({ score, total, onExit }: { score: number; total: number; onExit: () => void }) {
  const pct = total ? score / total : 0
  return (
    <Card className={pct >= 0.6 ? 'border-emerald-300 bg-emerald-50/60' : 'border-amber-300 bg-amber-50/60'}>
      <CardContent className="pt-5 flex items-center gap-5 flex-wrap">
        <div className={`text-3xl font-bold ${pct >= 0.6 ? 'text-emerald-700' : 'text-amber-700'}`}>
          {score}<span className="text-lg text-muted-foreground">/{total}</span>
        </div>
        <div className="text-sm text-muted-foreground flex-1 min-w-40">
          {pct === 1 ? '满分！太出色了 🎉' : pct >= 0.6 ? '不错，看看错题解析巩固一下。' : '别灰心，对照解析和原文再练一遍会更好。'}
        </div>
        <Button variant="outline" size="sm" onClick={onExit}>返回</Button>
      </CardContent>
    </Card>
  )
}

// ---------- MC option list (radio style) ----------
export function McOptions({
  q,
  chosen,
  onChoose,
  submitted,
}: {
  q: MCQuestion
  chosen: string | undefined // letter
  onChoose: (letter: string) => void
  submitted: boolean
}) {
  return (
    <div className="space-y-2 mt-3">
      {q.options.map((opt, oi) => {
        const letter = LETTERS[oi]
        const isAnswer = letter === q.answer
        const isChosen = letter === chosen
        let cls = 'border-border hover:border-primary/50'
        if (submitted && isAnswer) cls = 'border-emerald-400 bg-emerald-50/70'
        else if (submitted && isChosen && !isAnswer) cls = 'border-red-300 bg-red-50/60'
        else if (!submitted && isChosen) cls = 'border-primary bg-primary/5'
        return (
          <button
            key={oi}
            disabled={submitted}
            onClick={() => onChoose(letter)}
            className={`w-full text-left rounded-lg border px-3 py-2 text-sm flex items-start gap-2.5 transition-colors ${cls} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className={`shrink-0 mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center text-[11px] font-medium ${
              submitted && isAnswer ? 'bg-emerald-600 text-white border-emerald-600'
              : submitted && isChosen ? 'bg-red-500 text-white border-red-500'
              : !submitted && isChosen ? 'bg-primary text-primary-foreground border-primary'
              : 'text-muted-foreground'
            }`}>
              {letter}
            </span>
            <span className="flex-1">{opt}</span>
            {submitted && isAnswer && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
            {submitted && isChosen && !isAnswer && <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
          </button>
        )
      })}
    </div>
  )
}

// ---------- per-question analysis ----------
export function McAnalysis({ q, showSignal }: { q: MCQuestion; showSignal?: boolean }) {
  return (
    <div className="mt-3 rounded-lg bg-muted/50 border p-3 space-y-2 text-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-emerald-600 hover:bg-emerald-600">答案 {q.answer}</Badge>
        {q.qtype && <Badge variant="secondary">{q.qtype}</Badge>}
        {q.translation && <span className="text-xs text-muted-foreground">{q.translation}</span>}
      </div>
      {q.locateEn && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-0.5">答案句</div>
          <div className="leading-6">{q.locateEn}</div>
          {q.locateCn && <div className="text-muted-foreground text-[13px] leading-6 mt-0.5">{q.locateCn}</div>}
        </div>
      )}
      {showSignal && q.signal && (
        <div className="text-xs text-muted-foreground"><span className="font-medium">信号：</span>{q.signal}</div>
      )}
    </div>
  )
}

// ---------- bilingual passage (EN with CN toggle) ----------
export function BilingualParagraphs({ paragraphs }: { paragraphs: { en: string; cn: string }[] }) {
  const [showCn, setShowCn] = useState(false)
  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setShowCn((v) => !v)}>
          <Languages className="h-3.5 w-3.5" /> {showCn ? '隐藏译文' : '显示译文'}
        </Button>
      </div>
      {paragraphs.map((p, i) => (
        <div key={i} className="mb-4">
          <p className="leading-7 text-[15px]">{p.en}</p>
          {showCn && p.cn && <p className="leading-6 text-[13px] text-muted-foreground mt-1">{p.cn}</p>}
        </div>
      ))}
    </div>
  )
}

// ---------- collapsible block ----------
export function Collapsible({ title, children, defaultOpen = false }: { title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border">
      <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="px-3 pb-3 border-t pt-3">{children}</div>}
    </div>
  )
}
