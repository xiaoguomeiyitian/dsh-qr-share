# dsh-qr-share

[English](README.md) | 中文

> DeepSeek Harness 侧边栏底部 QR 码按钮插件。手机扫码即获取当前浏览器已登录的 launch URL，复用桌面已完成的 `?token=` 换 cookie 流程。

![license](https://img.shields.io/github/license/xiaoguomeiyitian/dsh-qr-share)
![version](https://img.shields.io/github/v/release/xiaoguomeiyitian/dsh-qr-share)
![stars](https://img.shields.io/github/stars/xiaoguomeiyitian/dsh-qr-share?style=social)
![dsh-so](https://www.dsh.so/badge/dsh-qr-share.svg)
![dsh](https://img.shields.io/badge/DSH-0.1.0--rc.8%20%7C%200.1.2--alpha.1-8257D0)

## 这是什么

DSH 运行起来后，扫码登录很烦——你用手机拍屏幕上的 `127.0.0.1:3080` 没用。`dsh-qr-share` 在侧边栏底部加一个 QR 码按钮：

1. 登录后，QR 码图标出现在侧边栏底部（设置按钮旁）。
2. 点击 → 弹窗显示 QR 码 + URL 明文（扫码失败时手动复制）。
3. 手机扫码 → 浏览器打开 URL → 服务端 `BrowserAuth` 拿 token 换 cookie（303 → `/）→ 手机落到同一会话。
4. 每次打开弹窗都会重新向 Host 拉取 token（打开期间每 15 秒续拉一次），QR 码始终编码**当前** `dsh web` 激活的 token——Host 重启但页面没有整体刷新时，不会留下一个已失效的旧 token。

QR 内容用 `window.location.origin` 拼接，所以**自动跟随**桌面实际使用的 host（局域网 IP、公网域名、反向代理子路径）——**不需要任何环境变量**告诉它指向哪个 host。`web-external.patch.yml` 里那个 `DSH_PUBLIC_HOST` 只负责打开 `/_qr/share` 路由的信任围栏，不参与 URL 拼接。

## 安全模型

- `/_qr/share` 走与 `/api` 相同的 `connection.requestRejection` 围栏：
  - 403 — Host 不在 `trustedHosts`；
  - 401 — 浏览器 cookie 缺失/过期；
  - 200 — 仅在两条都通过时返回 token。
- 启动 token 每个 `dsh web` 进程一份（`process-stable`），第一次换 cookie 后即作废（cookie 绑定到 authority，HttpOnly + SameSite=Strict）。
- 客户端用 `credentials: 'same-origin'` + `cache: 'no-store'`，跨站 frame 无法访问该路由。

## 安装

### 通过 DSH CLI（推荐）

```bash
dsh plugin --profile <name> add dsh-qr-share@latest
```

CLI 会自动把本包声明的 `cordis.patch.yml` 加进 `dsh.profile.bundles`，不需要手改 profile。

### 通过 `npm install`

```bash
# 在拥有 DSH profile 目录的项目里
npm install dsh-qr-share
# 或
pnpm add dsh-qr-share
```

然后把 `cordis.patch.yml`（包内自带）的一行加到 profile 的 patch overlay 里，并确保 profile 的 `node_modules` 能解析到这个包。

### 手动安装（如 docker-build 镜像）

1. 把包放到 `/app/dsh-qr-share/`。
2. 用 symlink 链到 `$DSH_HOME/profiles/node_modules/dsh-qr-share`（`docker-build/docker-scripts/entrypoint.sh` 已自动做）。
3. 在 patch overlay 加：
   ```yaml
   - insert:
       - id: qr-share
         name: 'dsh-qr-share'
   ```

## 配置（patch overlay）

```yaml
- insert:
    - id: qr-share
      name: 'dsh-qr-share'
      config:
        enabled: true   # 默认 true；设为 false 时路由 short-circuit 到 404
```

## 构建

```bash
# 推荐:pnpm(与项目无 lockfile 的设计一致)
pnpm install
pnpm build       # tsc 声明 + tsdown bundle
pnpm typecheck   # 严格检查
pnpm pack        # 产出 dsh-qr-share-<version>.tgz

# 也支持:npm(任意 Node >= 20, 无需额外安装)
npm install
npm run build    # 同样的 tsc + tsdown 管线
npm run typecheck
npm pack
```

> 发版用 [`./npm_publish.sh`](npm_publish.sh)——单文件脚本,照搬 [core_ts](https://github.com/xiaoguomeiyitian/core_ts) 的发布流程(`npm login` → `npm install` → `npm run build` → `npm pack --dry-run` 预检 → `npm publish --access public`)。

产物：

- `lib/index.js` — Node 宿主半（`/_qr/share` 路由）
- `lib/invariant.js` — 运行时守卫
- `lib/client.js` — 官方 profile 通道 bundle（id `dsh-qr-share`）
- `lib/client-registry.js` — plugin-registry 通道 bundle（id `dsh-external/dsh-qr-share`）
- `lib/types/**` — TypeScript 声明

## 兼容性

- Node `>=20`
- DSH core `>=0.1.0-rc.8`（已在 `0.1.1-rc.2` 与 `0.1.2-alpha.1` 实测）
- React `^18 || ^19`（peer，可选；宿主半不依赖 React）

宿主半只**类型层面**使用 `@deepseek-ai/cordis`（声明合并 + `Context` re-export），运行时 cordis 实例由 DSH core 在挂载时注入——所以 `peerDependencies` 里**故意没有** `@deepseek-ai/cordis`：它会被 DSH 市场 manifest 闸门按名硬拒，运行时也不需要。

## 发布

维护者请参考 [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md) 走 `npm publish` 流程。

## 许可证

MIT — 见 [LICENSE](LICENSE)。

## 致谢

`[dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)` 启发了本插件的 slot 注入与多 bundle 双通道模式；`qrcode` 库提供 QR 渲染。
