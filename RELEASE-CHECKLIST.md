# Release checklist for `dsh-qr-share`

> 给你后续在本机执行 `npm publish` 的逐步清单。
> 前期准备（修 `package.json`、build、pack、dry-run 模拟发布、git commit）
> 都已经在仓库里完成——本文件只覆盖**真正发版那一刻**你需要在 shell 里跑的命令。

---

## 0. 前置

- [ ] 你有一个 **npmjs.com 账号**，并在 `dsh-qr-share` 这个包上有 **publish 权限**（首次发版需要你是包的所有者；如果包名已被占需要先 claim 或改名）
- [ ] 你在本机有能 publish 的凭据（二选一）：
  - **交互式登录**：`npm login`（写 `~/.npmrc` 的 `_authToken`）
  - **环境变量**：`export NPM_TOKEN=npm_xxxxx`（用 npmjs.com 的 **granular access token**，权限勾 `Publish packages` 即可；不要勾任何 `Admin`/`Settings`）
- [ ] 你已经**完成本仓库的 push 到 GitHub**：
  ```bash
  cd /root/ai/dsh-qr-share
  git remote -v                                    # 确认 remote 是 xiaoguomeiyitian/dsh-qr-share
  git push origin main                             # 推送本次 commit
  git tag v0.1.0                                   # 与 package.json 的 version 一致
  git push origin v0.1.0
  ```

---

## 1. 切换 npm registry 到官方

本机当前 `npm config get registry` 是 `https://registry.npmmirror.com`（npmmirror 镜像）。
发布必须用官方：

```bash
# 临时切到本次命令（推荐，不污染全局配置）
npm publish --registry=https://registry.npmjs.org/ --provenance --access public
```

或持久改：

```bash
npm config set registry https://registry.npmjs.org/
# 完事后想恢复镜像：
# npm config set registry https://registry.npmmirror.com
```

---

## 2. 确认 package.json 三件事

发版前最后一眼 `package.json`：

| 字段 | 期望值 |
|---|---|
| `name` | `dsh-qr-share` |
| `version` | `0.1.0`（如要 bump：改成 `0.1.1` 等） |
| `repository.url` | `https://github.com/xiaoguomeiyitian/dsh-qr-share.git` |
| `license` | `MIT` |
| `engines.node` | `>=20` |

> **tag 必须与 version 一致**：本仓库用 GitHub Release 触发的 release workflow（未来若加）会校验；
> 手动 `npm publish` 不强制，但建议保持一致以便后人追溯。

---

## 3. 清理可能的旧构建产物 + 重建

```bash
cd /root/ai/dsh-qr-share
rm -rf lib node_modules
pnpm install                                       # 用 pnpm 装依赖（与 package-lock 风格一致）
pnpm typecheck                                     # 0 错误才能继续
pnpm build                                         # 产出 lib/index.js + lib/client.js + ...
```

确认 `lib/` 里至少有这五个文件：

- `lib/index.js`
- `lib/invariant.js`
- `lib/client.js`
- `lib/client-registry.js`
- `lib/types/index.d.ts`

---

## 4. 模拟发布（**必做**）

```bash
npm publish --dry-run --provenance --access public --registry=https://registry.npmjs.org/
```

逐项核对输出：

- [ ] `npm notice` 列表里只包含 `lib/**`、`src/**`、`cordis.patch.yml`、`README.md`、`LICENSE`、`package.json`（不要出现 `node_modules/`、`.git/`、`*.tsbuildinfo`）
- [ ] 包名 `dsh-qr-share@0.1.0`
- [ ] `--provenance` 没报错（如果是用 granular token + `--provenance` 不被允许，先去掉 `--provenance`，下次发布再开；或换成 GitHub Actions Trusted Publishing 走 OIDC）
- [ ] tarball 体积 < 1 MB（应该是 ~80 KB，未压缩的 `client.js` 自身有 ~92 KB + 800 KB sourcemap；npm publish 默认包含 sourcemap，确认 `package.json#files` 是否要排除 `.map`）

---

## 5. 真正发布

```bash
npm publish --provenance --access public --registry=https://registry.npmjs.org/
```

成功输出形如：

```
+ dsh-qr-share@0.1.0
```

> `--provenance` 会让 npm 关联一个公开的 build provenance（指向你的 CI / 本机构建），
> 对供应链透明度友好；某些老 granular token 可能拒绝，可降级为不加 `--provenance`。
> Trusted Publishing（OIDC）需要在 npmjs.com 上配 Trusted Publisher，
> 本机 `npm publish` 不能用 OIDC，那是 GitHub Actions 的路径——若要走那条路，参考
> `DSH-better-sidebar` 仓库的 `.github/workflows/release.yml` 抄一份。

---

## 6. 验证发布结果

```bash
# 1. npm view
npm view dsh-qr-share --registry=https://registry.npmjs.org/

# 2. 在新目录里真实安装
mkdir /tmp/dsh-qr-share-smoke && cd /tmp/dsh-qr-share-smoke
npm init -y > /dev/null
npm install dsh-qr-share --registry=https://registry.npmjs.org/
ls node_modules/dsh-qr-share/lib/                   # 应有 4 个 js + types/ 目录
cat node_modules/dsh-qr-share/package.json | head  # 字段应与本地一致
```

---

## 7. 失败回滚

- **72 小时内**：`npm unpublish dsh-qr-share@0.1.0 --registry=https://registry.npmjs.org/`
  （会真删，慎用；推荐用 `npm deprecate`）
- **更稳妥**：`npm deprecate dsh-qr-share@0.1.0 "reason" --registry=https://registry.npmjs.org/`
  （旧版本仍可装，但 npm install 时会有 deprecation 警告）

---

## 8. 后续：bump 版本重新发版

```bash
# 1. 改 package.json 的 "version" 字段（如 0.1.0 → 0.1.1）
# 2. 重建 + 模拟 + 正式发布
cd /root/ai/dsh-qr-share
pnpm typecheck && pnpm build
npm publish --provenance --access public --registry=https://registry.npmjs.org/
# 3. 在 GitHub 上打 tag
git tag v0.1.1 && git push origin v0.1.1
```

---

## 参考：DSH-better-sidebar 的发布流程

更复杂的范例（含 GitHub Actions + Trusted Publishing + 双协议 e2e 守护）见
`DSH-better-sidebar/AGENTS.md` §4。本插件暂用本机手动发布——简单、可见、可控。
