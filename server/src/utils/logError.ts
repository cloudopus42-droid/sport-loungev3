/**
 * Logs an error that is intentionally not propagated to the caller
 * (e.g. best-effort side effects like socket emits or Telegram notifications).
 *
 * These failures must never break the primary request flow, but they should
 * still be surfaced in logs instead of being silently swallowed so that they
 * remain diagnosable in production.
 */
export function logSwallowedError(context: string, err: unknown): void {
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
  console.warn(`⚠️  [${context}] non-critical error (ignored): ${message}`);
}

/**
 * Attaches error logging to a Supabase query builder used in a fire-and-forget
 * fashion. Supabase queries resolve with a `{ error }` shape rather than
 * rejecting, so both the resolved error and any thrown rejection are logged.
 */
export function runInBackground(
  context: string,
  query: PromiseLike<{ error: unknown }>
): void {
  Promise.resolve(query).then(
    (result) => {
      if (result && result.error) {
        logSwallowedError(context, result.error);
      }
    },
    (err) => logSwallowedError(context, err)
  );
}
