import { useState } from 'react'
import { BookMarked, GraduationCap, LayoutDashboard, LibraryBig } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { AppStoreProvider } from '@/hooks/useAppStore'
import { WordSelectToAdd } from '@/components/word-select'
import Dashboard from '@/sections/Dashboard'
import Exams from '@/sections/Exams'
import Wordbook from '@/sections/Wordbook'

const TABS = [
  { id: 'home', label: '首页', icon: LayoutDashboard },
  { id: 'exams', label: '六级真题', icon: LibraryBig },
  { id: 'words', label: '单词本', icon: BookMarked },
] as const

type TabId = (typeof TABS)[number]['id']

function Shell() {
  const [tab, setTab] = useState<TabId>('home')

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background dark:from-emerald-950/20">
      <header className="border-b sticky top-0 bg-background/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold leading-tight">LingoLoop</div>
              <div className="text-[10px] text-muted-foreground leading-tight">六级真题 · 听力 · 阅读 · 写译</div>
            </div>
          </div>
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <Button
                key={t.id}
                variant={tab === t.id ? 'default' : 'ghost'}
                size="sm"
                className={`gap-1.5 ${tab === t.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <t.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'home' && <Dashboard onNavigate={(t) => setTab(t as TabId)} />}
        {tab === 'exams' && <Exams />}
        {tab === 'words' && <Wordbook />}
        <footer className="text-center text-xs text-muted-foreground mt-10 leading-6">
          LingoLoop · 大学英语六级真题自测版
          <br />
          题库：2025年12月第1–3套、2026年6月第2–3套 · 全部数据保存在本地浏览器，可离线使用 · 听力为浏览器语音合成朗读
        </footer>
      </main>

      <Toaster position="top-center" richColors />
      <WordSelectToAdd />
    </div>
  )
}

export default function App() {
  return (
    <AppStoreProvider>
      <Shell />
    </AppStoreProvider>
  )
}
