#!/bin/bash
# LingoLoop 一键更新线上版：重新构建并推送到 GitHub Pages
# 用法：在 LingoLoop 目录下运行 ./deploy.sh "本次更新说明"
set -e
cd "$(dirname "$0")"
MSG=${1:-"更新内容"}
echo "▶ 构建中…"
npm run build
echo "▶ 部署到 gh-pages…"
cd dist
if [ ! -d .git ]; then
  git init -q -b gh-pages
  git remote add origin https://github.com/cyy788/lingoloop-cet6.git
fi
git add -A
git -c user.name="lingoloop" -c user.email="lingoloop@local" commit -qm "$MSG"
git push -q origin gh-pages
echo "✓ 已发布，约 1 分钟后生效：https://cyy788.github.io/lingoloop-cet6/"
