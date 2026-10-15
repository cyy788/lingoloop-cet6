# LingoLoop · 大学英语六级真题自测

在线使用：**https://cyy788.github.io/lingoloop-cet6/**

收录 2025 年 12 月（第 1–3 套）与 2026 年 6 月（第 2、3 套）共 5 套六级真题，功能：

- **听力**：浏览器语音合成朗读原文（离线可用，无需音频文件），0.75x–1.5x 四档语速，提交后解锁原文 + 中译 + 逐题解析
- **阅读**：选词填空 / 长篇匹配 / 仔细阅读，自动评分 + 逐题答案定位句与解析
- **写译**：写作与翻译草稿本地保存，范文 / 参考译文对照
- **单词本**：任意英文文本划选即可收藏生词，按艾宾浩斯间隔（0/1/2/4/7/15 天）复习
- **打卡**：完成练习自动打卡，首页热力图与正确率统计

技术栈：React 19 + Vite + TypeScript + Tailwind + shadcn/ui。所有数据保存在浏览器 localStorage，纯静态、可离线。

---

## 日常维护

### 本地预览

```bash
npm install   # 首次或依赖变动后
npm run dev   # 开发预览，终端会给出 localhost 地址
```

### 改完上线（一键）

```bash
./deploy.sh "本次更新说明"
```

自动构建并推送到 gh-pages 分支，约 1 分钟后 https://cyy788.github.io/lingoloop-cet6/ 生效。
同步源码到 main 分支：`git add -A && git commit -m "说明" && git push`。

---

## 添加一套新真题

题库数据在 `src/data/exams.json`，每套卷一个顶层键（如 `"2026-12-1"`）。两种做法：

### 方式一：让 Kimi 代劳（推荐）

把新卷子的真题 PDF（卷面）和答案解析 PDF 放进工作区文件夹，然后直接对 Kimi 说：

> 把 2026年12月第1套 加进 LingoLoop 题库并上线

生成脚本和解析流程保留在 `../.scrape/`（`build_data.py` 解析、`fix_passages.py` 修复段落完整性），Kimi 会复用这套流水线。

### 方式二：手动改数据

在 `src/data/exams.json` 中仿照现有条目添加，结构如下：

```jsonc
{
  "2026-12-1": {
    "id": "2026-12-1",
    "label": "2026年12月 · 第1套",
    // 听力：7 篇，segments 为逐句原文+翻译，questions 为题目
    "listening": [{ "kind": "conversation", "segments": [{"speaker": "W", "en": "…", "cn": "…"}], "questions": [{"num": 1, "stem": "…", "options": {"A": "…"}, "answer": "A", "locateEn": "…", "locateCn": "…", "analysis": "…"}] }],
    // 若本次听力与另一套相同，用引用代替："listeningRef": "2026-12-2"
    "cloze": {
      "passage": "含 __26__ … __35__ 空格标记的文章",
      "bank": {"A": "单词", "…": "共15词"},
      "answers": {"26": {"letter": "H", "word": "…", "pos": "副词", "explanation": "…"}}
    },
    "match": {
      "title": "文章标题",
      "paragraphs": {"A": {"en": "…", "cn": "…"}},
      "statements": [{"num": 36, "text": "…", "answer": "C", "locateEn": "…", "locateCn": "…", "anchor": "…"}]
    },
    "careful": [
      {"paragraphs": [{"en": "…", "cn": "…"}], "questions": [{"num": 46, "stem": "…", "options": {"A": "…"}, "answer": "D", "type": "细节题", "locateEn": "…", "locateCn": "…"}]}
    ],
    "writing": {"modelEssay": "范文", "modelCn": "译文"},
    "translation": {"source": "中文原文", "reference": "参考译文"}
  }
}
```

注意：

- 新套卷的 `id` 加入 `src/data/exams.ts` 的 `EXAMS` 顺序数组才会显示在列表里
- 题目、答案之外，尽量补齐 `locateEn/locateCn`（答案定位句）和解析，同学刷题体验才好
- 改完先 `npm run dev` 自查一遍，再 `./deploy.sh` 上线

---

## 更新功能 / 界面

目录速查：

| 位置 | 内容 |
| --- | --- |
| `src/sections/Exams.tsx` | 套卷列表与模块导航 |
| `src/sections/ListeningRunner.tsx` | 听力播放与做题 |
| `src/sections/ClozeRunner.tsx` `MatchRunner.tsx` `CarefulRunner.tsx` | 三大阅读题型 |
| `src/sections/WritingTranslation.tsx` | 写作与翻译 |
| `src/sections/Dashboard.tsx` | 首页打卡 / 统计 / 记录 |
| `src/sections/Wordbook.tsx` | 单词本与复习 |
| `src/components/word-select.tsx` | 划词收藏 |
| `src/data/exams.json` | 题库数据 |
| `src/data/dictionary.ts` | 内置小词典（划词/查词释义来源） |
| `src/hooks/useAppStore.tsx` | 打卡、成绩、单词本、草稿的本地存储 |

改完 `npm run dev` 预览确认，再 `./deploy.sh` 上线。

---

## 数据与隐私

练习记录、单词本、草稿均存在各自浏览器的 localStorage（键：`lingoloop-cet6-v1`），不上传服务器；清浏览器数据会清空记录。题库全部内置在页面中，首次加载后离线可用。
