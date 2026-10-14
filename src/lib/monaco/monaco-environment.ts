"use client";

/**
 * Monaco web-worker policy for Turbopack: workers are disabled on purpose.
 *
 * ## The bug this fixes
 *
 * Without a `MonacoEnvironment`, Monaco resolves its background workers through
 * `WebWorkerDescriptor.esmModuleLocationBundler` — a bare
 * `new URL('../../common/services/editorWebWorkerMain.js', import.meta.url)`
 * *expression*. Turbopack does not bundle that: it copies the referenced file
 * verbatim into `/_next/static/media/` and leaves the relative imports inside it
 * (`../../../base/common/worker/webWorkerBootstrap.js`) untouched. Those paths
 * resolve to `/_next/base/common/...` and 404, so Monaco's `blob:` bootstrap
 * worker starts but its `await import(...)` fails. `whenESMWorkerReady`
 * (`webWorkerServiceImpl.js`) does `worker.onerror = reject` and nothing
 * consumes the resulting promise, so the failure escapes as an unhandled
 * rejection carrying a **raw `ErrorEvent`** — the
 * `[browser] ⨯ unhandledRejection: [object ErrorEvent]` line in the terminal.
 *
 * ## Why we cannot simply bundle the workers
 *
 * The obvious fix — `new Worker(new URL('./worker.ts', import.meta.url))` —
 * does **not** work under Turbopack. Verified empirically against this project's
 * own build output: Turbopack emits `e.q("/_next/static/media/editor.worker.<hash>.js")`,
 * i.e. it registers the entry as a *static asset* and copies it verbatim rather
 * than compiling it into a worker chunk with its import graph rewritten. The
 * browser then receives raw TypeScript/ESM with unresolved bare specifiers, which
 * it cannot execute. Turbopack's worker support in Next.js 16.3.8 only covers
 * magic comments (`webpackIgnore`, `turbopackIgnore`, `turbopackOptional`), not
 * worker bundling — see `node_modules/next/dist/docs/01-app/03-api-reference/
 * 08-turbopack.md` ("Magic Comments", "Unsupported and unplanned features").
 *
 * ## The fix
 *
 * Monaco already ships a graceful main-thread fallback: `EditorWorkerClient.
 * _getOrCreateWorker()` (`editorWorkerService.js`) wraps worker creation in
 * `try/catch` and, on failure, calls `_createFallbackLocalWorker()`. So we make
 * `getWorker` **throw synchronously** instead of returning a broken worker.
 *
 * Throwing is the crucial detail: it is the only failure mode Monaco catches
 * *synchronously*. Returning a worker (even a broken one) puts us on the
 * promise path, where `whenESMWorkerReady`'s unhandled `reject` recreates the
 * original bug. A synchronous throw never creates that promise, so there is no
 * rejection to leak — Monaco just logs one warning
 * ("Could not create web worker(s). Falling back to loading web worker code in
 * main thread…") and continues on the main thread.
 *
 * This is also functionally correct here: `/studio/code` runs with
 * `quickSuggestions: false` and only needs tokenisation, which the Monarch
 * tokenizer performs on the main thread anyway. Monaco's language-service
 * workers add IntelliSense and diagnostics we do not use, so the main-thread
 * editor worker is sufficient — its own fallback covers diffing, word-based
 * suggestions and link detection.
 */

/** Monaco's `Environment`, narrowed to the hook we define. */
interface MonacoWorkerEnvironment {
  getWorker?: (workerId: string, label: string) => Worker;
}

/**
 * Explains, once per label, why workers are disabled — emitted through Monaco's
 * own `logOnceWebWorkerWarning` path, which prints `err.message`.
 */
function disabledWorker(workerId: string, label: string): never {
  throw new Error(
    `[archstudio] Monaco web workers are disabled: Turbopack emits ` +
      `"new Worker(new URL(..., import.meta.url))" as a verbatim static asset ` +
      `instead of a bundled worker chunk, so the worker could never boot ` +
      `(label "${label}", workerId "${workerId}"). ` +
      `Monaco is falling back to its main-thread worker, which is expected here.`,
  );
}

/** Guards against installing `MonacoEnvironment` twice (HMR / remounts). */
let installed = false;

/**
 * Installs `globalThis.MonacoEnvironment`. Idempotent, and a no-op on the server
 * (`Worker` and `document.baseURI` are browser-only).
 *
 * Must run **before** Monaco resolves its workers — `monaco-code-editor.tsx`
 * calls this at the top of its `next/dynamic` factory, ahead of
 * `loader.config({ monaco })`.
 */
export function installMonacoEnvironment(): void {
  if (installed || typeof window === "undefined") return;

  const environment: MonacoWorkerEnvironment = { getWorker: disabledWorker };
  globalThis.MonacoEnvironment =
    environment as unknown as typeof globalThis.MonacoEnvironment;
  installed = true;
}
