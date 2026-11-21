/** Next.js loads instrumentation in both the Node.js and Edge runtimes.
 * The PostgreSQL error recorder is Node-only; never import it from Edge. */
export async function register() { /* Reserved for future tracing providers. */ }

export async function onRequestError(
  error: unknown,
  request: { path: string },
  context: { routePath: string },
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { recordOperationError } = await import("@/lib/operations");
    const scope = `request:${(context.routePath || request.path || "unknown").slice(0, 70)}`;
    await recordOperationError(scope, error);
  } catch { /* Logging must never break requests. */ }
}
