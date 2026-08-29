/**
 * dsh-qr-share host context types. Declares the cordis Context services
 * the host half consumes as ambient module augmentations. The actual
 * services come from the loaded Connection + WebServer plugins; we
 * declare the slices we use and rely on the module loader to supply
 * the real implementations.
 *
 * Runtime: zero import from monorepo; type-only augmentations are
 * stripped by tsdown.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

/** Minimal slice of `connection.requestRejection` we consume. */
export interface ConnectionRejectionLike {
  /** 401 when cookie missing/expired; 403 when Host/Origin not trusted. */
  requestRejection(req: IncomingMessage): number | undefined
  /** Add the fresh process token to a clean URL. */
  authenticatedUrl(baseUrl: string): string
}

/** Minimal slice of `webServer.register` we consume. */
export interface WebServerLike {
  register(route: {
    kind: 'exact'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

declare module '@deepseek-ai/cordis' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Context {
    connection: ConnectionRejectionLike
    webServer: WebServerLike
  }
}

/** Re-export for ergonomic imports. */
export type Context = import('@deepseek-ai/cordis').Context
