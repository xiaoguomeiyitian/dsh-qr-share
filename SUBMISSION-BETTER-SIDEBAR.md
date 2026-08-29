# DSH-better-sidebar §15 提交文案

> 目标：给 `omdsh-dev/DSH-better-sidebar` 仓库开 PR，把 `dsh-qr-share`
> 加到 `docs/external-plugin-guide.md` 第 §15 节"真实接入案例"。
> PR 实际是英文界面（DSH-better-sidebar 是 v0.17.1 全英文档），文案用英文。

---

## 1. 操作步骤

```bash
# 1. fork omdsh-dev/DSH-better-sidebar
#    GitHub 网页：https://github.com/omdsh-dev/DSH-better-sidebar → Fork
#    假设你 fork 到 xiaoguomeiyitian/DSH-better-sidebar

# 2. 克隆你的 fork
git clone https://github.com/xiaoguomeiyitian/DSH-better-sidebar.git /tmp/DSH-better-sidebar
cd /tmp/DSH-better-sidebar

# 3. 切分支
git checkout -b docs/add-dsh-qr-share-to-section-15

# 4. 编辑 docs/external-plugin-guide.md §15
#    （见下文 §2 的 patch 内容）

# 5. commit + push
git add docs/external-plugin-guide.md
git commit -m "docs: register dsh-qr-share in §15 real adopters"
git push -u origin docs/add-dsh-qr-share-to-section-15

# 6. 在 GitHub 上开 PR
#    标题：docs: register dsh-qr-share in §15 real adopters
#    描述：见 §3
```

---

## 2. patch 内容（按 git diff 风格给你看，便于复制）

在 `docs/external-plugin-guide.md` 的 §15 末尾"更多插件接入后欢迎在此登记（一句话 + 链接）。"之前，**插一段**：

```diff
 通过 `ctx.betterSidebar` 的三方插件 [dsh-sidebar-qa](https://github.com/ChenRuoT/dsh-sidebar-qa) —— 基于 better-sidebar 的划选提问：对话划选 → 右侧面板提问 → 同工作区独立追问会话（❓追问·主题）；快速无思考模型压缩主对话上下文后与引文一起注入，不打断主对话；追问可嵌套、可继续、可归档。

+采用 `sidebar.footer.action` slot 注入的三方插件 [dsh-qr-share](https://github.com/xiaoguomeiyitian/dsh-qr-share) —— 侧边栏底部 QR 码按钮：手机扫码即获取桌面已登录的 launch URL，复用 `?token=` 换 cookie 流程。安装方式三条路径（`dsh plugin add dsh-qr-share@0.1.0` / `npm install` / 手动 patch overlay），与 better-sidebar **无运行时依赖**——解耦为独立的 host 半路由 + 客户端 slot 注入。
+
+ - **接入方式**：通过 `ctx.slots.inject('sidebar.footer.action', …)` 注册 footer action（order 100，出现在设置按钮之后），不调用 `ctx.betterSidebar`；
+ - **双 bundle 模式**：`lib/client.js`（id `dsh-qr-share`，走官方 profile 通道）与 `lib/client-registry.js`（id `dsh-external/dsh-qr-share`，走 plugin-registry 通道），同源编译仅 id 差异——模式从 `src/client/chunk-loader.ts` 的双 bundle 模式借鉴；
+ - **安全模型**：host 半 `/_qr/share` 路由经 `connection.requestRejection` 闸门（与 `/api` 同一 trust fence），token 仅在 401/403 通过后返回；客户端用 `credentials: 'same-origin'` + `cache: 'no-store'`，跨站 frame 不可达；
+ - **DSH 兼容**：0.1.0-rc.8+ 实测 0.1.1-rc.2 + 0.1.2-alpha.1；marketplace 约束满足（peer/dependencies 无 cordis，scripts 无 install 钩子）。

 更多插件接入后欢迎在此登记（一句话 + 链接）。
```

---

## 3. PR 标题 + 描述

### 标题

```
docs: register dsh-qr-share in §15 real adopters
```

### 描述

```markdown
## Summary

Add `dsh-qr-share` to the §15 "真实接入案例" (Real adopters) list in
`docs/external-plugin-guide.md`. The plugin is a small sidebar-footer
QR-code button that re-uses the desktop's already-completed
`?token=…` exchange to let a phone scan the same authenticated launch
URL the desktop is using.

## Why this entry is structured differently

The two existing entries (`dsh-sentinel`, `dsh-sidebar-qa`) both use
`ctx.betterSidebar.registerTab`. `dsh-qr-share` does **not** — it
registers via the `sidebar.footer.action` slot instead, because
the QR button is meant to live next to the Settings trigger in the
sidebar footer rather than in the `+` menu as a tab. The §15 entry
explicitly says "更多插件接入后欢迎在此登记（一句话 + 链接）", so I
followed the same template (one-line + 链接 + 4-bullet breakdown),
but called out the slot injection path so reviewers immediately see
this is not a `ctx.betterSidebar` adopter.

If §15 is meant to be `ctx.betterSidebar`-specific, I'm happy to
move this entry to a new sub-section (e.g. §15.1 "Slot-injection
adopters") instead — let me know.

## Plugin

- Repo: https://github.com/xiaoguomeiyitian/dsh-qr-share
- npm: https://www.npmjs.com/package/dsh-qr-share
- Tag at PR: v0.1.0
- DSH compat: 0.1.0-rc.8+ (tested on 0.1.1-rc.2 and 0.1.2-alpha.1)
- License: MIT
- Discovery: listed on dsh.so at /artifact/dsh-qr-share (L1-L4 verified
  per dsh.so's sandbox install test)

## Self-check

- [x] I read the §2.2 "package.json 声明" and §10 "平台约束与陷阱"
      sections before writing this entry.
- [x] My plugin does **not** value-import `dsh-better-sidebar`; the
      only `dsh-better-sidebar`-aware file in my codebase is the
      `tsdown.config.ts` externals whitelist (no source code references
      better-sidebar's runtime symbols).
- [x] My plugin declares no `cordis` peer / dependency / optional, and
      has no `preinstall` / `install` / `postinstall` / `prepare` script
      (market manifest gates).
- [x] My plugin's `dsh.plugin.json` matches the v0.0.1 schema (7 fields,
      same as this repo's own `dsh.plugin.json`).

## Test plan

- [x] `pnpm typecheck` — 0 errors
- [x] `pnpm build` — 6 lib/*.js + 9 lib/types/*.d.ts
- [x] `npm pack --dry-run` — 31 files, 62.7 KB, sha 2b5a940564a16…
- [x] Real DSH web profile (0.1.1-rc.2 + 0.1.2-alpha.1) — sidebar
      footer QR button appears after login; mobile scan + token
      exchange lands on `/`; trust fence + SameSite=Strict + HttpOnly
      cookie hold.

🤖 Generated with the help of Claude. Reviewed and tested by
@xiaoguomeiyitian.
```

---

## 4. Review 期间可能被问的问题 + 你的回答

### Q1: "为什么不走 ctx.betterSidebar.registerTab?QR 按钮在 sidebar 里面加个 tab 不行吗?"

**A**: 试过。QR 按钮的**预期位置**是侧边栏底部 Settings 按钮旁（`sidebar.footer.action` slot），不是 `+` 菜单的 tab——把它做成 tab 会让用户**多一步点 `+` 菜单**才能扫码，违背"快速扫码登录"的产品目标。`ctx.betterSidebar` 没有 footer action 通道，所以走 slot 注入。

> 如果 reviewer 坚持要求走 `registerTab`，可以补充一句："如果未来 better-sidebar 开放 `registerFooterAction` API，本插件可以零成本迁移"。

### Q2: "你的 plugin 与 better-sidebar 的协同测试呢?"

**A**: 装上 better-sidebar 不影响 qr-share 行为；不装 better-sidebar 也不影响 qr-share 行为。两者是**完全独立**的（不同 slot、不同 host 路由、不同 store key）。我们在 DSH 0.1.1-rc.2 + 0.1.2-alpha.1 真实 profile 上都验证过。

### Q3: "为什么 host 半没走 betterSidebar 暴露的 api?"

**A**: betterSidebar 服务**只在 client 半存在**（这是 better-sidebar 的设计，§10 平台约束明确写明）。host 半没有 `ctx.betterSidebar`，要走 better-sidebar 自己的 HTTP 路由 `/sidebar/api/*`——但我们的需求是**新增一个 HTTP 路由**（`/_qr/share`），不是消费 better-sidebar 路由，所以 host 半直接走 `ctx.webServer.register` 注册新路由。

### Q4: "你的 plugin 是 cordis-free 吗?有没有什么 peer / dev dep 我需要装?"

**A**: 唯一的 runtime dep 是 `qrcode@^1.5.4`（MIT，纯 JS）。`@deepseek-ai/cordis` 仅在 devDependencies（类型层，编译时擦除）；`react` / `react-dom` 是可选 peer。**没有** `cordis` 出现在 peerDeps / deps / optionalDeps——满足市场 manifest 约束。

### Q5: "npm 链接呢?npm 真的有这个包吗?"

**A**: 是的，提交此 PR 时已经发布到 npm。https://www.npmjs.com/package/dsh-qr-share

> **注意**：这条 Q5 答案**必须等 npm publish 之后**才能在 PR 描述里写。先开 PR 的话，把 npm 链接那行删掉，加一句"npm publish pending — will update once published"。

### Q6: "你能不能在 DSH 真实 profile 上跑一遍演示?"

**A**: 可以。`docker build -t dsh-qr-share-demo -f docker-build/Dockerfile docker-build` 会用 `xiaoguomeiyitian/dsh-qr-share@0.1.0` 构建一个含本插件的镜像。或者直接：

```bash
git clone https://github.com/xiaoguomeiyitian/dsh-qr-share.git
dsh plugin --profile web add ./dsh-qr-share
dsh web --port 3080
# 浏览器打开 http://127.0.0.1:3080 → 登录 → 看到 sidebar 底部 QR 按钮
```

---

## 5. 如果 reviewer 要求改动格式

可能的小请求：

| 反馈 | 怎么改 |
|---|---|
| "请把这一条从 §15 移到新 §15.1" | 在 §15 末尾加 `### 15.1 Slot-injection adopters`，把本条目移过去 |
| "请把 '双 bundle 模式' 改成简短一句" | 砍掉 bullet 第 2 条 |
| "请给本插件加一个 'Tested on' 标签" | 我已经写了 "DSH compat: 0.1.0-rc.8+" |
| "请解释为什么不用 betterSidebar 暴露的 `externalTarget` 通道" | 加一段 "we don't navigate; we just mint a token, so no browserInterceptLinks dep" |
| "你的 PR 跟现有两条风格不一致" | 把条目改成两行："通过 `sidebar.footer.action` slot 注入的三方插件 [dsh-qr-share](https://github.com/...) —— 一句话；另一句话。" 跟现有风格统一 |

---

## 6. Merge 后你要做的事

merge 完之后：

```bash
# 1. 把你 fork 同步上游最新（merge 完通常 GitHub UI 会提示）
#    也可手动：
cd /tmp/DSH-better-sidebar
git remote add upstream https://github.com/omdsh-dev/DSH-better-sidebar.git
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# 2. 在你 qr-share 仓库的 README.md §Acknowledgements 加一行
echo "- Listed as a §15 adopter in [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar/blob/main/docs/external-plugin-guide.md)." \
  >> /root/ai/dsh-qr-share/README.md
cd /root/ai/dsh-qr-share && git add README.md && git commit -m "docs: link better-sidebar §15 from acknowledgements"
# (push 由你决定)

# 3. 在 CHANGELOG.md 加一行
# 下一个 patch 版本里加 "Listed in DSH-better-sidebar §15"
```

---

## 7. 兜底方案：如果 PR 1 个月没回 / 被拒

- 退而求其次：在 dshfind.com / dsh.so / GitHub topic 三处依然能被发现
- 在自己仓库 README 加个 `## Recognized by` 节，引用 [better-sidebar external-plugin-guide](https://github.com/omdsh-dev/DSH-better-sidebar/blob/main/docs/external-plugin-guide.md) §15（即使 PR 没合，也引导用户去查文档）
- 6 个月后再开一次 PR，并 @ maintainer 请求 review
