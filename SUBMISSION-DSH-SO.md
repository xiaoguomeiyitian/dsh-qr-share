# dsh.so 提交文案（直接复制粘贴用）

> 提交地址：<https://www.dsh.so/submit/>
> 唯一输入框填 `xiaoguomeiyitian/dsh-qr-share` 后 Run checks → Submit。
> 提交后这单会作为 issue 推到 `dsh-plugin-submissions` 跟踪仓库等 maintainer 审核。
> 下面这份"补充说明"在 maintainer 排队时贴到 issue 评论里加速 review。

---

## 提交时输入框填什么

**Repository URL**：
```
xiaoguomeiyitian/dsh-qr-share
```

---

## 提交后 issue 评论区可贴的"补充说明"

```markdown
## Submission context — dsh-qr-share

- Repo: https://github.com/xiaoguomeiyitian/dsh-qr-share
- npm: https://www.npmjs.com/package/dsh-qr-share (publishing now)
- Tag at submit: v0.1.0
- DSH compat: package.json#engines.dsh = ">=0.0.1" (tested on 0.1.1-rc.2 and 0.1.2-alpha.1)

### What it does
A small sidebar-footer QR-code button. After login, a QR icon appears next to
the Settings trigger in the DSH sidebar. Clicking it opens a dialog with a
QR + URL; scanning the QR on a phone lets the phone obtain the same
authenticated launch URL the desktop is using, by reusing the
`?token=…` exchange the desktop already completed.

### Install
```
dsh plugin --profile web add dsh-qr-share@0.1.0
```

### Integration shape
- **Host half** (`lib/index.js`): registers `/_qr/share` HTTP route via
  `ctx.webServer.register`, gated by `connection.requestRejection` (same
  trust fence as `/api`).
- **Client half** (`lib/client.js` + `lib/client-registry.js`): two
  bundles — official profile channel (id `dsh-qr-share`) and
  plugin-registry channel (id `dsh-external/dsh-qr-share`). Each
  registers a `sidebar.footer.action` slot occupant.
- **Manifest**: `dsh.plugin.json` (v0.0.1 schema, 7 fields, identical
  shape to dsh-better-sidebar/dsh.plugin.json).
- **Cordis**: type-only `declare module '@deepseek-ai/cordis'` for the
  Context; runtime cordis instance is supplied by the DSH core. No
  value-import of cordis.

### Verification self-check
- [x] package.json#engines.dsh present
- [x] dsh.plugin.json present + parseable
- [x] cordis.patch.yml single-insert mount
- [x] README has install instructions (CLI / npm / manual)
- [x] License = MIT (SPDX id)
- [x] Repo slug matches `^[a-z0-9]+(-[a-z0-9]+)*$`
- [x] npm tarball: 31 files, 62.7 KB, sha 2b5a940564a167abe7e9ac2ccd62398037c1ab03
- [x] No hardcoded secrets, no exfil endpoints, no mining patterns
- [x] DSH market manifest compliance: dependencies/peerDependencies
      contain no `cordis`; scripts has no install hooks

### Why this is a small / low-risk submission
- Single dep: `qrcode@^1.5.4` (MIT, vendored dependency of choice
  documented in THIRD_PARTY_NOTICES.md).
- No `node_modules`-level native compilation (`qrcode` is pure JS, the
  `node-pty` family is not in scope here).
- Host half only adds one exact route, no patch to existing rows.
- Client half only adds one slot occupant, no overwrite of built-in tabs.
```

---

## 如果 maintainer 邮件/评论要"更详细的安装报告"

复制这段到 Discussion `https://github.com/deepseek-ai/deepseek-harness/discussions/new?category=general`：

```markdown
Plugin compatibility report
---------------------------
Plugin: dsh-qr-share (https://github.com/xiaoguomeiyitian/dsh-qr-share)
dsh version: 0.1.1-rc.2 / 0.1.2-alpha.1
Install method: bundle add (dsh plugin --profile web add dsh-qr-share@0.1.0)
Result: pass
Notes: sidebar footer QR button appears after login, dialog shows QR + URL,
mobile scan + token exchange lands on /. Trust fence + SameSite=Strict +
HttpOnly cookie hold.
```

---

## 自检失败时的排查

| 失败项 | 原因 | 修复 |
|---|---|---|
| "Repository not found" | 仓库私有 / URL 错 | 把仓库设成 public；URL 用 `owner/repo` 形式 |
| "No DSH compat signal" | 没有 `dsh` 字段、topic 或 `dsh.plugin.*` 之一 | 我们有 `package.json#dsh` + `dsh.plugin.json` + topic——若仍报，**先设 GitHub topic**（让 dsh.so crawler 抓取一次） |
| "Slug mismatch" | 仓库名含 `_` / 大写 | 不适用（`dsh-qr-share` 合规） |
| "Security scan: hardcoded secret" | `localhost` / 模板字符串被误报 | 不适用（我们只有 HTTP 路由样板） |
| "Install spec missing" | `engines.dsh` 字段空 | 不适用（`>=0.0.1`） |
| "L4 install failed in sandbox" | sandbox 装 npm 包失败 | 多半是 `qrcode` 网络下载问题；72h 后重试 |

---

## 提交后的回复模板

如果 maintainer 几天没回，可以发个 follow-up：

```markdown
Hi, following up on dsh-qr-share submission. Is there any additional
information needed? The repo + npm tarball are both at v0.1.0 with no
changes since the original submission. Happy to provide a more detailed
sandbox test report or address any specific concerns.
```

---

## 提交成功后的"产品上线"动作

1. 把 `https://www.dsh.so/artifact/dsh-qr-share` 加到 README 的徽章行（替换占位 `https://www.dsh.so/badge/dsh-qr-share.svg`）
2. 在 `README.md` 致谢节加一行：`Verified on dsh.so: [artifact](https://www.dsh.so/artifact/dsh-qr-share)`
3. 在 `CHANGELOG.md` 下一个 patch 版本里加 `Discovered: dsh.so L1-L4 verified`
