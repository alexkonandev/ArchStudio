"use client";

import { useEffect } from "react";

/**
 * Dev-only deep probe for Next's opaque `[browser] ⨯ unhandledRejection:
 * [object ErrorEvent]` line.
 *
 * Next forwards browser rejections to the terminal via `forward-logs.js`:
 * a non-`Error` reason goes through `preLogSerializationClone`, which reduces
 * any non-plain object to `Object.prototype.toString` — hence the opaque
 * `[object ErrorEvent]`. An `ErrorEvent` is what `script.onerror`,
 * `link.onerror`, `worker.onerror` and failed `import()` inside workers hand
 * to `unhandledrejection`, so the terminal line hides the real `message` /
 * `filename` / `lineno` / `error.stack`.
 *
 * This probe registers (capture phase, first in `<body>`) a listener that
 * runs **before** Next's forwarder, unwraps the `ErrorEvent`, and re-logs the
 * full payload via `console.error` — which Next forwards as a readable
 * `formatted-error` entry with source mapping. Mounted once in the root
 * layout; a no-op in production (`process.env.NODE_ENV !== "development"`).
 */
function describeReason(reason: unknown): Record<string, unknown> {
  if (reason instanceof ErrorEvent) {
    return {
      kind: "ErrorEvent",
      message: reason.message,
      filename: reason.filename,
      lineno: reason.lineno,
      colno: reason.colno,
      nestedErrorName:
        reason.error instanceof Error ? reason.error.name : typeof reason.error,
      nestedErrorMessage:
        reason.error instanceof Error
          ? reason.error.message
          : String(reason.error),
      nestedErrorStack:
        reason.error instanceof Error ? reason.error.stack : undefined,
    };
  }
  if (reason instanceof Error) {
    return {
      kind: "Error",
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
    };
  }
  return { kind: typeof reason, value: String(reason) };
}

export function RejectionProbe() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const onUnhandled = (event: PromiseRejectionEvent): void => {
      // Runs before Next's forwarder: surface the unwrapped payload so the
      // terminal shows the real message + stack instead of `[object …]`.
      console.error(
        "[archstudio:rejection-probe]",
        JSON.stringify(describeReason(event.reason), null, 2),
      );
    };
    // Capture phase: our listener fires before Next's bubble-phase forwarder.
    window.addEventListener("unhandledrejection", onUnhandled, true);
    return () =>
      window.removeEventListener("unhandledrejection", onUnhandled, true);
  }, []);
  return null;
}
