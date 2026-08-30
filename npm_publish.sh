#!/bin/bash

# npm_publish.sh — 发布 dsh-qr-share 到 npm
# 借鉴 /root/core_ts/npm_publish.sh 的简洁风格:
#   npm login → rm build → build → npm publish --access public
#
# 用法:
#   ./npm_publish.sh
#
# 备注:
#   - 首次会交互式触发 npm login(写 ~/.npmrc);
#   - registry 用默认 https://registry.npmjs.org/(无 scope 包);
#   - 不会自动 bump version — 改版本号在 package.json 里手动改;
#   - 不会自动 git tag — 手动 git tag vX.Y.Z && git push origin vX.Y.Z;
#   - 发布后建议跑一次 smoke install, 详见 RELEASE-CHECKLIST.md.

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# 路径
# ─────────────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# 0. 前置检查
# ─────────────────────────────────────────────────────────────────────────────
if [[ ! -f "package.json" ]]; then
    echo "❌ 当前目录没有 package.json — 请在 dsh-qr-share 仓库根目录执行" >&2
    exit 1
fi

# 从 package.json 读 name/version/engines, 避免拼写漂移
NAME=$(node -e "console.log(require('./package.json').name)")
VERSION=$(node -e "console.log(require('./package.json').version)")
NODE_ENG=$(node -e "console.log(require('./package.json').engines?.node ?? '>=20')")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  准备发布: ${NAME}@${VERSION}"
echo "  Node 引擎要求: ${NODE_ENG}"
echo "  当前 Node:     $(node --version)"
echo "  工作目录:      $(pwd)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# ─────────────────────────────────────────────────────────────────────────────
# 1. 登录 npm (写 ~/.npmrc)
# ─────────────────────────────────────────────────────────────────────────────
echo "▶ 1. 登录 npm (registry.npmjs.org)"
npm login --registry=https://registry.npmjs.org
echo

# ─────────────────────────────────────────────────────────────────────────────
# 2. 清理旧构建产物
# ─────────────────────────────────────────────────────────────────────────────
echo "▶ 2. 清理旧构建产物"
rm -rf lib
mkdir -p lib
echo "   ✓ lib/ 已清理"
echo

# ─────────────────────────────────────────────────────────────────────────────
# 3. 装依赖 + 构建
# ─────────────────────────────────────────────────────────────────────────────
# 与 core_ts 一致: 用 npm(无 pnpm 路径), 本机镜像无 pnpm, 走 npm 链路最稳。
echo "▶ 3. npm install"
npm install
echo

echo "▶ 4. npm run build (tsc declarations + tsdown bundles)"
npm run build
echo

# 验证 lib/ 真的有产物
if [[ ! -f "lib/index.js" || ! -f "lib/client.js" ]]; then
    echo "❌ 构建后缺少 lib/index.js 或 lib/client.js — 构建失败" >&2
    exit 1
fi
echo "   ✓ lib/index.js + lib/client.js 已就位"
echo

# ─────────────────────────────────────────────────────────────────────────────
# 5. 模拟发布(列出包内文件, 不真发)
# ─────────────────────────────────────────────────────────────────────────────
echo "▶ 5. npm pack --dry-run (预览包内容)"
npm pack --dry-run
echo
echo "   上面的列表就是即将上传到 npm 的所有文件"
echo "   若看到 node_modules / .git / *.tgz 等不该出现的文件, 请 Ctrl+C 中断, "
echo "   检查 package.json#files 字段后再重新发布"
echo
read -p "   按 Enter 继续, 或 Ctrl+C 取消... " _
echo

# ─────────────────────────────────────────────────────────────────────────────
# 6. 真发布
# ─────────────────────────────────────────────────────────────────────────────
echo "▶ 6. npm publish --access public"
npm publish --access public --registry=https://registry.npmjs.org
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ 发布完成: ${NAME}@${VERSION}"
echo "  验证:  https://www.npmjs.com/package/${NAME}"
echo "  验证:  npm view ${NAME}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📝 发布后建议:"
echo "   1. git tag v${VERSION} && git push origin v${VERSION}"
echo "   2. 在 GitHub 创建 Release:  https://github.com/xiaoguomeiyitian/${NAME}/releases/new"
echo "   3. 提交 dsh.so:           https://www.dsh.so/submit/"
echo "   4. 更新 CHANGELOG.md (加 'Discovered: dsh.so' 行)"
