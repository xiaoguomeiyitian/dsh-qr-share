# Discovery & submission checklist for `dsh-qr-share`

> 给后续你（本仓库 owner / 维护者）手动操作发现渠道的清单。
> 改仓库的工作（v0.1.0 + 这次规范补齐）已经全部 commit 完毕。
> 下面 4 步都**需要在网页/UI 上手动点一下**，我不会替你做。

---

## 渠道全景

| 渠道 | 类型 | 谁能看到 | 等待时间 | 提交方式 |
|---|---|---|---|---|
| **GitHub `dsh-plugin` topic** | 标签 | GitHub 站内搜索 | 立即生效 | 仓库 Settings → About → Topics |
| **[dsh.so](https://www.dsh.so)** | 验证 + 发现注册表 | dsh.so 全网 + dsh.so 验证 L1-L5 | 24h 内 L1/L2 自动，2 周内 L4 sandbox | `https://www.dsh.so/submit/` |
| **[dshfind.com](https://dshfind.com)** | 中文社区 + GitHub 同步 | dshfind 浏览者 | GitHub topic 同步后 24-48h | 仅设 topic（无独立提交端点） |
| **DSH-better-sidebar §15** | 官方接入案例 | better-sidebar 用户（装了这个插件的人） | PR review 周期 | 给 `omdsh-dev/DSH-better-sidebar` 开 PR |

下面 4 节分别教你做。

---

## 1. GitHub topic（最简单，2 分钟）

`dsh.so` 与 `dshfind.com` 都会**自动**按 topic 抓仓库；加 topic = 注册中心自动发现你。

操作：

1. 打开 `https://github.com/xiaoguomeiyitian/dsh-qr-share`（已存在）
2. 右上角齿轮 **⚙ Settings** → **General** → 滚到最下面 **Topics** 区
3. 输入并保存以下 5 个 topic（一次加 1 个，按回车）：
   - `dsh-plugin`（**必加** — dsh.so 关键词）
   - `dsh-plugins`（**必加** — dsh.so 备用关键词）
   - `dsh`（**必加** — dsh.so 备用关键词）
   - `deepseek-harness`（让 GitHub 站内搜索也命中）
   - `qr-code`（按功能分类）

> `dsh.so/submit/` 文档原话：「adding one of the `dsh-plugin` / `dsh-plugins` / `dsh` topics lets the registry auto-index your repository」。

---

## 2. dsh.so 提交（核心，10 分钟）

打开 **`https://www.dsh.so/submit/`**，会看到一个大输入框：**「Repository URL」**。

填入：

```
xiaoguomeiyitian/dsh-qr-share
```

（或完整 URL `https://github.com/xiaoguomeiyitian/dsh-qr-share`）

然后点 **Run checks**——它会跑：

1. `vet` AST scanner（Node + shell + PowerShell 启发式）
2. 校验 `package.json` / `dsh.plugin.json` / `README` / `LICENSE`
3. 提取 category / use case / install command

过 5-15 秒会出结果，全部 ✓ 之后会出 **Submit to dsh.so** 按钮，点击完成提交。

后台会把这单作为 GitHub issue 推到 `dsh-plugin-submissions` tracker，dsh.so maintainer 人工 review 通过后正式收录。

### 提交前自检（避免 fail）

| 检查项 | 当前状态 |
|---|---|
| `package.json` 的 `repository.url` 实际可达 | ✓ `https://github.com/xiaoguomeiyitian/dsh-qr-share.git` |
| README 含 install 说明 | ✓ `README.md` §Install 三路径 |
| 许可证有 SPDX id | ✓ MIT |
| DSH 兼容信号 | ✓ `package.json#dsh` 字段 + `dsh.plugin.json` + GitHub topic（设完第 1 步后） |
| 仓库名 slug 符合 `^[a-z0-9]+(-[a-z0-9]+)*$` | ✓ `dsh-qr-share` |
| 仓库非空、可被 scanner 分析 | ✓ 有 src/ lib/ 真实源码 |
| 无硬编码密钥 / 外泄 / 挖矿 | ✓ 无 |

### 提交后等多久

- 24 小时内：L1 Found + L2 Structured（manifest 完整）出现
- 48-72 小时内：security scan 跑完（vet 静态分析）
- 2 周内：L4 Install Tested（dsh.so 在隔离沙箱里装一遍，确认无 dep 错误）
- L5 Run Tested 暂未启动（dsh.so 自己也说"never Verified yet"）

### 提交模板（如果想做版本兼容报告 — 让 dsh.so 录入版本矩阵）

> 复制下面这块，粘到 `https://github.com/deepseek-ai/deepseek-harness/discussions/new?category=general`：

```
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

## 3. dshfind.com（不需主动操作）

`dshfind.com` 通过 GitHub API 抓所有标了 `dsh-plugin` topic 的仓库，**不开放独立提交端点**（`/zh/plugins/submit` 是 404）。所以**第 1 步设完 topic，等 24-48 小时自动出现**。

如果想加速，可以去他们的 [GitHub issues](https://github.com/hikariming/dshfind) 开 issue 报"请收录 dsh-qr-share"——但没必要。

---

## 4. DSH-better-sidebar §15 接入案例（生态内曝光，1-2 周）

`DSH-better-sidebar/docs/external-plugin-guide.md` 第 §15 节有一个**真实接入案例**列表，better-sidebar 7k+ stars 用户都会看到。

操作：

1. fork [`omdsh-dev/DSH-better-sidebar`](https://github.com/omdsh-dev/DSH-better-sidebar)
2. 编辑 `docs/external-plugin-guide.md` 第 §15 节末尾，**按现有格式加一条**：

```markdown
通过 `ctx.betterSidebar` 的三方插件 [dsh-qr-share](https://github.com/xiaoguomeiyitian/dsh-qr-share) —— 侧边栏底部 QR 码按钮：手机扫码即获取桌面已登录的 launch URL，复用 `?token=` 换 cookie 流程；走 `sidebar.footer.action` slot 注入，install 三路径（CLI / npm / 手动 patch）。
```

3. 提交 PR，标题 `[plugins] add dsh-qr-share to §15`；在描述里写：
   - 仓库：`https://github.com/xiaoguomeiyitian/dsh-qr-share`
   - 已发布 npm：`https://www.npmjs.com/package/dsh-qr-share`（v0.1.0 发布后才有这链接）
   - 实测 DSH 版本：`0.1.1-rc.2` + `0.1.2-alpha.1`
4. 等 review merge

> **注意**：better-sidebar 的 §15 主要列"通过 `ctx.betterSidebar` 注册 tab/file viewer 的插件"——`dsh-qr-share` 走 `sidebar.footer.action` slot 注入，**与 §15 的标准形态不完全一致**。PR 时在描述里**主动说明这一点**（"我走的是 sidebar.footer.action slot 注入，不是 tab/viewer 注册"），让 reviewer 一目了然，不会被误认为蹭热度。

---

## 时间线总览

| 动作 | 估计耗时 | 你需要做的 |
|---|---|---|
| §1 GitHub topic | 2 分钟 | 仓库 Settings → Topics |
| §2 dsh.so submit | 10 分钟 | `dsh.so/submit` 填 URL + 点 Submit |
| §3 dshfind 自动收录 | 0 分钟（等 24-48h） | 等 |
| §4 better-sidebar PR | 1 周 | fork + PR + 等 review |

---

## 当前可粘贴的"项目介绍"文案（任意场景复用）

```
dsh-qr-share — DSH web plugin: a sidebar-footer QR-code button that lets a
phone scan and re-issue the current browser's authenticated launch URL,
reusing the same ?token=… exchange the desktop just completed.

Install: dsh plugin --profile web add dsh-qr-share@latest
npm:     https://www.npmjs.com/package/dsh-qr-share
Repo:    https://github.com/xiaoguomeiyitian/dsh-qr-share
DSH:     0.1.0-rc.8+ (tested on 0.1.1-rc.2 and 0.1.2-alpha.1)
```

---

## 常见问题

**Q：设了 topic 但 dsh.so 24h 后还没收录？**
A：dsh.so 的 GitHub crawler 每 24h 跑一次，少数情况漏抓——去 `https://www.dsh.so/submit/` 手动填 URL 强制收录。

**Q：dsh.so scanner 报"硬编码密钥"误报？**
A：先看 `https://www.dsh.so/security-report/dsh-qr-share` 的明细，常见误报是 `localhost` 字符串或测试 token 模板——`code-scan.yml` 加 `allowStrings` 即可。

**Q：better-sidebar §15 PR 被拒怎么办？**
A：维护者可能要求你先在某 DSH 版本实测运行过——贴一个 docker-build 镜像的运行截图即可。
