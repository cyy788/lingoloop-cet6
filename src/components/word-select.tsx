import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { lookup } from '@/data/dictionary'
import { useAppStore } from '@/hooks/useAppStore'

const WORD_RE = /^[a-zA-Z][a-zA-Z'’-]*(?: [a-zA-Z][a-zA-Z'’-]*){0,2}$/

/**
 * 全局划词收藏：选中 1–3 个英文单词后，在选区附近弹出「加入单词本」按钮。
 * 挂在 App 根部即可对所有英文文本（阅读原文、听力原文、解析）生效。
 */
export function WordSelectToAdd() {
  const { addWord } = useAppStore()
  const [pos, setPos] = useState<{ x: number; y: number; word: string } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const hide = useCallback(() => setPos(null), [])

  useEffect(() => {
    const onMouseUp = () => {
      // 等选区稳定
      window.setTimeout(() => {
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed) return
        const text = sel.toString().trim()
        if (!WORD_RE.test(text)) return
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        if (!rect || (rect.width === 0 && rect.height === 0)) return
        setPos({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY,
          word: text.toLowerCase(),
        })
      }, 10)
    }
    const onMouseDown = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return
      hide()
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('scroll', hide, true)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('scroll', hide, true)
    }
  }, [hide])

  const handleAdd = () => {
    if (!pos) return
    const entry = lookup(pos.word)
    const ok = addWord({
      word: pos.word,
      phonetic: entry?.phonetic,
      pos: entry?.pos ?? '',
      meaning: entry?.meaning ?? '',
      example: entry?.example,
    })
    if (ok) {
      toast.success(
        entry?.meaning ? `已加入「${pos.word}」 ${entry.meaning.split('；')[0]}` : `已加入「${pos.word}」，可在单词本补充释义`,
      )
    } else {
      toast.info(`「${pos.word}」已在单词本中`)
    }
    window.getSelection()?.removeAllRanges()
    hide()
  }

  if (!pos) return null

  return (
    <button
      ref={btnRef}
      onClick={handleAdd}
      className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-emerald-700"
      style={{ left: pos.x, top: pos.y - window.scrollY - 6 }}
    >
      <Plus className="h-3.5 w-3.5" /> 加入单词本
    </button>
  )
}
