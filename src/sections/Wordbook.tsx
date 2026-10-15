import { useMemo, useState } from 'react'
import { BookMarked, Check, GraduationCap, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { lookup } from '@/data/dictionary'
import { useAppStore, REVIEW_INTERVALS, todayStr } from '@/hooks/useAppStore'
import type { DictEntry, WordBookItem } from '@/types'

// ---------- lookup bar ----------
function LookupBar() {
  const { addWord, data } = useAppStore()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<DictEntry | null | undefined>(undefined) // undefined = not searched
  const [customMeaning, setCustomMeaning] = useState('')

  const savedWords = useMemo(() => new Set(data.words.map((w) => w.word)), [data.words])

  const doSearch = () => {
    const q = query.trim().toLowerCase()
    if (!q) return
    const hit = lookup(q)
    setResult(hit ?? null)
    setCustomMeaning('')
  }

  const word = query.trim().toLowerCase()

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="输入单词查词，如：cultivate / scarcity…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            />
          </div>
          <Button onClick={doSearch} className="gap-1">
            <Search className="h-4 w-4" /> 查词
          </Button>
        </div>

        {result === null && (
          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              内置词典暂未收录「<span className="font-medium text-foreground">{word}</span>」（演示版词库约 90 词）。
              你可以手动添加释义后加入单词本：
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="输入释义，如：n. 新奇的事物"
                value={customMeaning}
                onChange={(e) => setCustomMeaning(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customMeaning.trim()) {
                    if (addWord({ word, pos: '', meaning: customMeaning.trim() })) toast.success(`已添加「${word}」`)
                  }
                }}
              />
              <Button
                variant="outline"
                disabled={!customMeaning.trim()}
                onClick={() => {
                  if (addWord({ word, pos: '', meaning: customMeaning.trim() })) toast.success(`已添加「${word}」`)
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> 加入单词本
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">{result.word}</span>
                {result.phonetic && <span className="text-sm text-muted-foreground">{result.phonetic}</span>}
                <Badge variant="secondary">{result.pos}</Badge>
              </div>
              <div className="text-sm mt-1">{result.meaning}</div>
              {result.example && <div className="text-xs text-muted-foreground mt-2 italic">例：{result.example}</div>}
            </div>
            <Button
              size="sm"
              variant={savedWords.has(result.word) ? 'secondary' : 'default'}
              disabled={savedWords.has(result.word)}
              className="gap-1 shrink-0"
              onClick={() => {
                if (addWord(result)) toast.success(`已把「${result.word}」加入单词本`)
              }}
            >
              {savedWords.has(result.word) ? (
                <><Check className="h-3 w-3" /> 已收录</>
              ) : (
                <><Plus className="h-3 w-3" /> 加入单词本</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- flashcard review ----------
function ReviewSession({ due, onDone }: { due: WordBookItem[]; onDone: () => void }) {
  const { reviewWord } = useAppStore()
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const item = due[idx]
  if (!item) {
    return (
      <Card className="border-emerald-300 bg-emerald-50/60">
        <CardContent className="pt-5 flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-emerald-600" />
          <div>
            <div className="font-medium">今日复习完成！</div>
            <div className="text-sm text-muted-foreground">已复习 {due.length} 个单词，明天见。</div>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={onDone}>返回单词本</Button>
        </CardContent>
      </Card>
    )
  }

  const handleGrade = (remembered: boolean) => {
    reviewWord(item.word, remembered)
    setFlipped(false)
    setIdx((i) => i + 1)
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
          <span>复习进度 {idx + 1} / {due.length}</span>
          <span>阶段 {Math.min(item.level + 1, REVIEW_INTERVALS.length)}/{REVIEW_INTERVALS.length}{item.mastered ? ' · 已掌握' : ''}</span>
        </div>
        <button
          className="w-full rounded-xl border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors py-14 text-center"
          onClick={() => setFlipped((f) => !f)}
        >
          {!flipped ? (
            <div>
              <div className="text-3xl font-bold tracking-wide">{item.word}</div>
              {item.phonetic && <div className="text-sm text-muted-foreground mt-2">{item.phonetic}</div>}
              <div className="text-xs text-muted-foreground mt-4">点击卡片查看释义</div>
            </div>
          ) : (
            <div>
              <div className="text-xl font-bold">{item.word}</div>
              <div className="text-muted-foreground mt-2">
                <Badge variant="secondary" className="mr-2">{item.pos}</Badge>
                {item.meaning}
              </div>
              {item.example && <div className="text-xs text-muted-foreground mt-3 italic">{item.example}</div>}
            </div>
          )}
        </button>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1 gap-1 text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => handleGrade(false)}>
            <X className="h-4 w-4" /> 忘记了
          </Button>
          <Button className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleGrade(true)}>
            <Check className="h-4 w-4" /> 记住了
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- main wordbook ----------
export default function Wordbook() {
  const { data, removeWord } = useAppStore()
  const [tab, setTab] = useState<'all' | 'due' | 'mastered'>('all')
  const [reviewing, setReviewing] = useState(false)

  const today = todayStr()
  const due = useMemo(
    () => data.words.filter((w) => !w.mastered && w.nextReview <= today),
    [data.words, today],
  )

  const filtered = useMemo(() => {
    const sorted = [...data.words].sort((a, b) => a.nextReview.localeCompare(b.nextReview))
    if (tab === 'due') return sorted.filter((w) => !w.mastered && w.nextReview <= today)
    if (tab === 'mastered') return sorted.filter((w) => w.mastered)
    return sorted
  }, [data.words, tab, today])

  if (reviewing) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">单词复习（艾宾浩斯间隔重复）</h2>
        <ReviewSession due={due} onDone={() => setReviewing(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">查词与单词本</h2>
          <p className="text-sm text-muted-foreground mt-1">
            加入单词本的词会按 0/1/2/4/7/15 天的间隔安排复习，全部通过即标记为「已掌握」。
          </p>
        </div>
        <Button className="gap-2" disabled={due.length === 0} onClick={() => setReviewing(true)}>
          <RefreshCw className="h-4 w-4" />
          开始今日复习（{due.length} 个待复习）
        </Button>
      </div>

      <LookupBar />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">全部（{data.words.length}）</TabsTrigger>
          <TabsTrigger value="due">待复习（{due.length}）</TabsTrigger>
          <TabsTrigger value="mastered">
            已掌握（{data.words.filter((w) => w.mastered).length}）
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground text-sm">
            <BookMarked className="h-8 w-8 mx-auto mb-3 opacity-40" />
            {tab === 'all' ? '单词本还是空的。在真题页划选英文单词即可一键收藏，也可以在上方查词添加。' : '这一栏暂时空空如也。'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((w) => {
            const isDue = !w.mastered && w.nextReview <= today
            return (
              <Card key={w.word} className={isDue ? 'border-orange-300' : ''}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-bold">{w.word}</span>
                        {w.phonetic && <span className="text-xs text-muted-foreground">{w.phonetic}</span>}
                        {w.pos && <Badge variant="secondary">{w.pos}</Badge>}
                        {w.mastered ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">已掌握</Badge>
                        ) : isDue ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">待复习</Badge>
                        ) : null}
                      </div>
                      <div className="text-sm mt-1">{w.meaning}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {w.mastered
                          ? `已掌握 · 复习 ${w.reviewCount} 次`
                          : `阶段 ${w.level + 1}/${REVIEW_INTERVALS.length} · 下次复习 ${w.nextReview}${w.nextReview <= today ? '（今天）' : ''}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => {
                        removeWord(w.word)
                        toast.info(`已移除「${w.word}」`)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
