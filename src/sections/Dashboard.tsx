import { useMemo } from 'react'
import { BookMarked, BookOpenCheck, CalendarCheck2, Flame, History, Target, TrendingUp, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EXAMS, MODULE_LABELS } from '@/data/exams'
import { useAppStore, todayStr } from '@/hooks/useAppStore'

const EXAM_LABELS = Object.fromEntries(EXAMS.map((e) => [e.id, e.label]))

function describeRef(refId: string): string {
  const [examId, ...rest] = refId.split(':')
  const mod = rest.join(':')
  const modKey = mod.replace(/:\d+$/, '')
  const pieceMatch = mod.match(/^listening:(\d+)$/)
  const modLabel = pieceMatch
    ? `听力 · 篇目 ${Number(pieceMatch[1]) + 1}`
    : MODULE_LABELS[modKey] ?? modKey
  return `${EXAM_LABELS[examId] ?? examId} · ${modLabel}`
}

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data, checkedToday, streak, checkIn } = useAppStore()

  // last 15 weeks heatmap (oldest → newest, column per week)
  const heatmap = useMemo(() => {
    const today = new Date()
    const daysSinceMonday = (today.getDay() + 6) % 7
    const end = new Date(today)
    end.setDate(today.getDate() - daysSinceMonday + 6) // end of current week (Sunday)
    const checked = new Set(data.checkins)
    const weeks: { date: string; checked: boolean; future: boolean }[][] = []
    for (let w = 14; w >= 0; w--) {
      const col: { date: string; checked: boolean; future: boolean }[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(end)
        date.setDate(end.getDate() - w * 7 - (6 - d))
        const key = todayStr(date)
        col.push({ date: key, checked: checked.has(key), future: date > today })
      }
      weeks.push(col)
    }
    return weeks
  }, [data.checkins])

  const stats = useMemo(() => {
    const words = data.words
    const today = todayStr()
    const due = words.filter((w) => !w.mastered && w.nextReview <= today).length
    const mastered = words.filter((w) => w.mastered).length
    const quizzes = data.quizResults.length
    const avg = quizzes > 0
      ? Math.round((data.quizResults.reduce((s, r) => s + r.score / r.total, 0) / quizzes) * 100)
      : 0
    return { total: words.length, due, mastered, quizzes, avg }
  }, [data])

  const recent = useMemo(() => [...data.quizResults].slice(-5).reverse(), [data.quizResults])

  const weekCount = data.checkins.filter((d) => {
    const diff = (new Date(todayStr()).getTime() - new Date(d).getTime()) / 86400000
    return diff >= 0 && diff < 7
  }).length

  const goalProgress = Math.min(100, (weekCount / 5) * 100)

  return (
    <div className="space-y-6">
      {/* hero row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-transparent dark:from-emerald-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              连续打卡 {streak} 天
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {checkedToday
                ? '今日已打卡，去刷一套真题或复习几个单词巩固一下吧。'
                : '今天还没打卡哦。完成一组听力/阅读或单词复习即可自动打卡，也可以手动打卡。'}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={checkIn} disabled={checkedToday} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <CalendarCheck2 className="h-4 w-4" />
                {checkedToday ? '今日已打卡 ✓' : '立即打卡'}
              </Button>
              <div className="flex-1 min-w-40 max-w-xs">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>本周打卡 {weekCount}/5 天</span>
                </div>
                <Progress value={goalProgress} className="h-2" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="cursor-pointer" onClick={() => onNavigate('exams')}>
                <BookOpenCheck className="h-3 w-3 mr-1" /> 去刷真题 →
              </Badge>
              <Badge variant="outline" className="cursor-pointer" onClick={() => onNavigate('words')}>
                <BookMarked className="h-3 w-3 mr-1" /> 去复习今日单词 →
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* stat cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">单词本收录</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className={`text-2xl font-bold ${stats.due > 0 ? 'text-orange-500' : ''}`}>{stats.due}</div>
              <div className="text-xs text-muted-foreground mt-1">今日待复习</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="text-2xl font-bold flex items-center gap-1">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {stats.mastered}
              </div>
              <div className="text-xs text-muted-foreground mt-1">已掌握单词</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="text-2xl font-bold flex items-center gap-1">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                {stats.avg}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">平均答题正确率</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> 打卡热力图（近 15 周）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-[3px] overflow-x-auto pb-1">
            {heatmap.map((week, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}${day.checked ? ' · 已打卡' : ''}`}
                    className={`h-3.5 w-3.5 rounded-sm ${
                      day.future ? 'bg-transparent' : day.checked ? 'bg-emerald-500' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span>少</span>
            <div className="h-3.5 w-3.5 rounded-sm bg-muted" />
            <div className="h-3.5 w-3.5 rounded-sm bg-emerald-500" />
            <span>多</span>
            <span className="ml-auto">累计打卡 {data.checkins.length} 天</span>
          </div>
        </CardContent>
      </Card>

      {/* recent results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> 最近练习记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              还没有练习记录。去「六级真题」完成第一组练习吧，提交后自动打卡。
            </p>
          ) : (
            <div className="space-y-2">
              {recent.map((r, i) => {
                const pct = Math.round((r.score / r.total) * 100)
                return (
                  <div key={i} className="flex items-center gap-3 text-sm rounded-lg border px-3 py-2">
                    <span className="text-xs text-muted-foreground shrink-0">{r.date.slice(5)}</span>
                    <span className="flex-1 min-w-0 truncate">{describeRef(r.refId)}</span>
                    <Badge variant={pct >= 60 ? 'default' : 'secondary'} className={pct >= 60 ? 'bg-emerald-600 hover:bg-emerald-600' : ''}>
                      {r.score}/{r.total} · {pct}%
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
