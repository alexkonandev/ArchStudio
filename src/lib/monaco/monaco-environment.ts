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

/**
 * Monaco's `Environment`, narrowed to the hooks we define.
 *
 * `getWorkerUrl` returns a URL and is called *before* `getWorker` by both
 * worker-creation paths (`standaloneWebWorkerService.js` and the ESM
 * `workers.js`); either hook disables the worker, but `getWorkerUrl` throws
 * nowhere user-visible — it never leaves a message in the terminal.
 */
interface MonacoWorkerEnvironment {
  getWorker?: (workerId: string, label: string) => Worker;
  getWorkerUrl?: (workerId: string, label: string) => string;
}

/**
 * Silent no-worker hook: throws, and swallows Monaco's own fallback warnings.
 *
 * Three details matter:
 * 1. `getWorkerUrl` (not `getWorker`) — both worker-creation paths call
 *    `getWorkerUrl` first (`standaloneWebWorkerService.js`, ESM `workers.js`),
 *    so throwing here disables every worker from one hook.
 * 2. Same synchronous-throw semantics: throwing is the only failure mode
 *    Monaco handles *synchronously* (`_getOrCreateWorker` catches and calls
 *    `_createFallbackLocalWorker`). Returning a worker — even a broken one —
 *    would go down the `whenESMWorkerReady` promise path whose unhandled
 *    `reject` recreates the original `[object ErrorEvent]` bug.
 * 3. The `catch` calls `logOnceWebWorkerWarning(err)` (`webWorker.js`), which
 *    always prints a generic "Could not create web worker(s)…" line plus
 *    `err.message` — even for an empty `Error`. So the throw arms a counter
 *    and the `console.warn` wrapper installed below swallows exactly the
 *    warnings that synchronously follow each throw. The fallback itself is
 *    expected here (main-thread tokenisation only), so silence is correct.
 */
let pendingWorkerWarningSuppressions = 0;

function disabledWorkerUrl(workerId: string, label: string): string {
  // Only the editor worker (`editorWorkerService`) has a try/catch around
  // worker creation (`EditorWorkerClient._getOrCreateWorker`) that falls back
  // to a real local worker. Every language-service worker (`typescript`,
  // `javascript`, and any future label) goes through `createWebWorker`, which
  // has NO try/catch: a synchronous throw becomes a rejected `_client`
  // promise that each provider (`provideCodeActions`, …) awaits, surfacing
  // as an Uncaught Runtime Error overlay the moment such a file opens.
  // So: throw ONLY for the editor worker (real fallback), and hand every
  // other label a no-op `blob:` worker. `new Worker(blobUrl)` succeeds (CSP
  // allows `worker-src blob:`), the awaiting providers hang silently instead
  // of crashing, and no error is ever thrown. Unreachable in practice:
  // `configureMonaco` disables all TS/JS providers, so this branch should
  // never even run — but if it does, hanging beats crashing.
  if (label !== "editorWorkerService") {
    const blob = new Blob(["self.onmessage = () => {};"], {
      type: "text/javascript",
    });
    return URL.createObjectURL(blob);
  }
  // Never fetched: the caller's try/catch intercepts the throw before any
  // `new Worker(url)` runs. The message stays descriptive so that if the
  // suppression wrapper ever misses, the terminal still explains itself.
  pendingWorkerWarningSuppressions += 2;
  throw new Error(
    `[archstudio] Monaco web workers are disabled by design (label "${label}", ` +
      `workerId "${workerId}"): Turbopack cannot bundle workers, using the ` +
      `main-thread fallback.`,
  );
}

/**
 * Swallows the two `console.warn` calls Monaco emits per disabled worker
 * (generic fallback notice + `err.message`). Armed synchronously by
 * `disabledWorkerUrl`, consumed synchronously by Monaco's `catch`, so no
 * unrelated warning can be caught in the window.
 */
function installWorkerWarningFilter(): void {
  const originalWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]): void => {
    if (pendingWorkerWarningSuppressions > 0) {
      const first = args[0];
      if (
        typeof first === "string" &&
        (first.startsWith("Could not create web worker") ||
          first.startsWith("[archstudio] Monaco web workers are disabled"))
      ) {
        pendingWorkerWarningSuppressions -= 1;
        return;
      }
    }
    originalWarn(...(args as Parameters<typeof console.warn>));
  };
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

  installWorkerWarningFilter();
  const environment: MonacoWorkerEnvironment = {
    getWorkerUrl: disabledWorkerUrl,
  };
  globalThis.MonacoEnvironment =
    environment as unknown as typeof globalThis.MonacoEnvironment;
  installed = true;
}
