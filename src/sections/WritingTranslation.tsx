import { useState } from 'react'
import { ArrowLeft, PenLine, Languages, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { getExam } from '@/data/exams'
import { useAppStore } from '@/hooks/useAppStore'
import { Collapsible } from '@/components/quiz-shared'

function WritingPanel({ examId }: { examId: string }) {
  const exam = getExam(examId)!
  const { data, saveDraft, autoCheckIn } = useAppStore()
  const key = `${examId}:writing`
  const [draft, setDraft] = useState(data.drafts[key] ?? '')
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PenLine className="h-4 w-4" /> Part I 写作（30 分钟 · 150–200 词）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-6">
          以指定句开头写一篇短文，可评论、举例或结合个人经历。
        </p>
        <Textarea
          rows={7}
          placeholder="在这里写下你的作文（先自己写，再对照范文）…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { saveDraft(key, draft); if (draft.trim()) autoCheckIn() }}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{wordCount} 词</span>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => { saveDraft(key, draft); toast.success('草稿已保存在本地') }}>
            <Save className="h-3.5 w-3.5" /> 保存草稿
          </Button>
        </div>
        <Collapsible title="参考范文与译文">
          <div className="space-y-2">
            {exam.writing.modelEssay.split('\n').filter(Boolean).map((p, i) => (
              <p key={i} className="text-sm leading-7">{p}</p>
            ))}
            {exam.writing.modelCn && (
              <div className="border-t pt-2 mt-2 space-y-1.5">
                {exam.writing.modelCn.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i} className="text-[13px] text-muted-foreground leading-6">{p}</p>
                ))}
              </div>
            )}
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

function TranslationPanel({ examId }: { examId: string }) {
  const exam = getExam(examId)!
  const { data, saveDraft, autoCheckIn } = useAppStore()
  const key = `${examId}:translation`
  const [draft, setDraft] = useState(data.drafts[key] ?? '')
  const [showSrc, setShowSrc] = useState(true)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><Languages className="h-4 w-4" /> Part IV 汉译英（30 分钟）</span>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowSrc((v) => !v)}>
            {showSrc ? '收起原文' : '展开原文'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showSrc && (
          <p className="text-sm leading-7 rounded-lg bg-muted/50 border p-3">{exam.translation.source}</p>
        )}
        <Textarea
          rows={6}
          placeholder="在这里写下你的英文翻译…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { saveDraft(key, draft); if (draft.trim()) autoCheckIn() }}
        />
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => { saveDraft(key, draft); toast.success('草稿已保存在本地') }}>
            <Save className="h-3.5 w-3.5" /> 保存草稿
          </Button>
        </div>
        <Collapsible title="参考译文">
          <p className="text-sm leading-7">{exam.translation.reference}</p>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

export default function WritingTranslation({ examId, onExit }: { examId: string; onExit: () => void }) {
  const exam = getExam(examId)!
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> 返回试卷
        </Button>
        <h2 className="text-lg font-bold">{exam.label} · 写作与翻译</h2>
        <Badge variant="secondary">主观题 · 自评对照</Badge>
      </div>
      <WritingPanel examId={examId} />
      <TranslationPanel examId={examId} />
    </div>
  )
}
