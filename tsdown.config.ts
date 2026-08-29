/**
 * tsdown build for dsh-qr-share: the host-half lib (lib/index.js and
 * lib/invariant.js, ESM node) plus the two browser client bundles
 * (lib/client.js and lib/client-registry.js, CJS closure factory).
 *
 * Mirrors the official DSH client-bundle preset and the better-sidebar
 * pattern: same src/client/index.tsx is compiled twice with only the
 * registered id and output file name differing.
 *
 * - externals resolve through the loader module table at runtime
 * - everything else is inlined into the bundle (qrcode, react-icons/si, ...)
 * - CSS Modules compile to hashed class maps and inject <style data-plugin>
 * - each artifact registers itself via window.__ModuleLoader__.load(...)
 *   with the (require) => exports CJS closure shape.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve as resolvePath, sep } from 'node:path'
import { builtinModules, createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

const require = createRequire(import.meta.url)

/** Node builtins must never survive into the browser module-loader factory. */
const NODE_BUILTINS = new Set([
  ...builtinModules,
  ...builtinModules.map(id => `node:${id}`),
])

/** Module specifiers the web shell shares into the frozen module table. */
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  'cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-sidebar',
  '@deepseek-ai/dsh-client-runtime/client',
]

/** Pin react-icons' ESM entry to keep tree-shaking effective. */
const reactIconsRoot = dirname(dirname(require.resolve('react-icons/lib')))
const REACT_ICONS_ESM_ALIAS = {
  'react-icons/hi2': join(reactIconsRoot, 'hi2/index.mjs'),
  'react-icons/vsc': join(reactIconsRoot, 'vsc/index.mjs'),
}

/** Wire/type layers a client bundle may inline (mirror of better-sidebar's INLINE_SAFE).
 *  qrcode ships a `browser` conditional entry that remaps Node `fs` to false
 *  and `./lib/index.js` to `./lib/browser.js` — so when our purity gate lets
 *  it through, rolldown applies the browser re-export automatically.
 *  react-icons (si/vsc) is tree-shaken via ESM aliases above; not in this list. */
const INLINE_SAFE = /^(@deepseek-ai\/dsh-(host-apiproxy|session|llm|tools|brand)(\/|$)|qrcode$|qrcode\/.*)$/

/** CSS virtual-module wrapper. */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

const REPOSITORY_ROOT = fileURLToPath(new URL('.', import.meta.url))

function injectTag(pluginId: string, fileId: string, cssText: string): string {
  const tagId = `${pluginId}/${basename(fileId)}`
  return [
    `const css = ${JSON.stringify(cssText)};`,
    `const tagId = ${JSON.stringify(tagId)};`,
    `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {`,
    `  const tag = document.createElement('style');`,
    `  tag.dataset.plugin = ${JSON.stringify(pluginId)};`,
    `  tag.dataset.pluginCss = tagId;`,
    `  tag.textContent = css;`,
    `  document.head.appendChild(tag);`,
    `}`,
  ].join('\n')
}

function browserSourcePath(source: string, sourcemapPath: string): string {
  if (!source.startsWith('.')) return source
  const physicalSource = resolvePath(dirname(sourcemapPath), source)
  const repositoryPath = relative(REPOSITORY_ROOT, physicalSource).split(sep).join('/')
  return `../../../${repositoryPath}`
}

function clientBundle(pluginId: string, entryFile: string): UserConfig {
  return {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
      'import.meta.resolve': 'undefined',
    },
    inputOptions: {
      resolve: {
        // qrcode has no `exports` field; its browser build is only reachable
        // through the legacy object-form `browser` field
        // ({"./lib/index.js": "./lib/browser.js", "fs": false}). conditionNames
        // only gates `exports` conditional exports, so without aliasFields the
        // resolver falls through to main → lib/index.js → lib/server.js, which
        // pulls the png/utf8/terminal renderers and their require("fs") into
        // the browser bundle. tsdown forces platform:"node" for format:"cjs",
        // which drops rolldown's default aliasFields:[["browser"]] — set it
        // explicitly so the browser remap applies.
        aliasFields: [['browser']],
        conditionNames: ['browser', 'import', 'require', 'default'],
        alias: REACT_ICONS_ESM_ALIAS,
      },
    },
    noExternal: (id: string) => (CLIENT_EXTERNALS.includes(id) ? undefined : true),
    plugins: [purityGatePlugin(), makeCssPlugin(pluginId)],
    outputOptions: {
      entryFileNames: entryFile,
      sourcemapPathTransform: browserSourcePath,
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(pluginId)}, factory: (require) => {`,
      footer: `return module.exports; } });`,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      codeSplitting: false,
    },
  }
}

type BuildPlugin = NonNullable<UserConfig['plugins']>

function purityGatePlugin(): BuildPlugin {
  return {
    name: 'dsh-client-bundle-purity',
    resolveId(source: string, importer: string | undefined) {
      // Node builtins: only reject when reached from a @deepseek-ai/* module.
      // Bare third-party imports (e.g. qrcode's png renderer doing
      // require('fs')) are resolved by rolldown through the dependency's
      // `browser` field, which maps 'fs' to false and excludes it from the
      // browser bundle. Intercepting here would short-circuit that mapping
      // and break the inline path for libs that ship a working browser build.
      if (NODE_BUILTINS.has(source)) {
        // Only reject when reached from a @deepseek-ai/* importer — those
        // are monorepo modules the purity gate must police. Bare third-
        // party imports (e.g. qrcode's png renderer doing require('fs'))
        // are resolved by rolldown through the dependency's `browser`
        // field, which maps 'fs' to false and excludes it from the bundle.
        const fromMonorepo = importer !== undefined && importer.includes('@deepseek-ai/')
        if (fromMonorepo) {
          throw new Error(
            `client bundle purity: Node builtin "${source}" reached from "${importer ?? '<unknown>'}"`,
          )
        }
        return null
      }
      if (!source.startsWith('@deepseek-ai/')) return null
      if (CLIENT_EXTERNALS.includes(source)) return null // platform module: external wins
      if (INLINE_SAFE.test(source)) return null // wire/type layer: inline is the point
      throw new Error(
        `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS) and not an inline-safe wire layer — `
        + 'cross-plugin value imports are forbidden; collaborate through cordis services (type-only imports are erased and never reach this gate)',
      )
    },
  }
}

function makeCssPlugin(pluginId: string): BuildPlugin {
  return {
    name: 'dsh-css-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.css')) return null
      let abs: string
      if (source.startsWith('.') || source.startsWith('/') || /^[A-Za-z]:[\\/]/.test(source)) {
        abs = importer === undefined ? source : resolvePath(dirname(importer), source)
      } else {
        abs = require.resolve(source)
      }
      return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      if (fileId.endsWith('.module.css')) {
        const { code, exports: cssExports } = transform({
          filename: fileId,
          code: source,
          cssModules: { pattern: `[hash]_[local]` },
          minify: true,
        })
        const classMap: Record<string, string> = {}
        for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
        return [
          injectTag(pluginId, fileId, code.toString()),
          `export default ${JSON.stringify(classMap)};`,
        ].join('\n')
      }
      return [
        injectTag(pluginId, fileId, source.toString('utf8')),
        'export default "";',
      ].join('\n')
    },
  }
}

export default [
  {
    entry: { index: 'src/index.ts', invariant: 'src/invariant.ts' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
  // Official profile channel: bundle id = package name.
  clientBundle('dsh-qr-share', 'client.js'),
  // Plugin-registry channel: bundle id = manifest id.
  clientBundle('dsh-external/dsh-qr-share', 'client-registry.js'),
] satisfies UserConfig[]
