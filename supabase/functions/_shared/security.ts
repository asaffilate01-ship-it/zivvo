import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError(503, "Service is not configured");
  return value;
}

function allowedOrigins(): Set<string> {
  const values = [env("APP_URL"), ...(Deno.env.get("ALLOWED_ORIGINS") || "").split(",")]
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => new URL(value).origin);
  return new Set(values);
}

export function requestOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  const fallback = new URL(env("APP_URL")).origin;
  if (!origin) return fallback;
  const normalized = new URL(origin).origin;
  if (!allowedOrigins().has(normalized)) throw new HttpError(403, "Origin is not allowed");
  return normalized;
}

export function cors(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": requestOrigin(req),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, idempotency-key, stripe-signature, x-cron-secret, x-zivvo-api-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export function json(req: Request, value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json; charset=utf-8" },
  });
}

export function safeError(req: Request, error: unknown): Response {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error(error);
  const body = JSON.stringify({ error: status >= 500 ? "The request could not be completed" : (error as Error).message });
  try {
    return new Response(body, { status, headers: { ...cors(req), "Content-Type": "application/json; charset=utf-8" } });
  } catch {
    return new Response(body, { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  }
}

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: cors(req) });
}

export function requirePost(req: Request): void {
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
}

export function adminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function hashSubject(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

export async function consumeAnonymousRateLimit(req: Request, admin: SupabaseClient, bucket: string, limit: number, windowSeconds: number): Promise<void> {
  const address = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const agent = req.headers.get("user-agent")?.slice(0, 200) || "unknown";
  const { data: allowed, error } = await admin.rpc("consume_rate_limit", {
    p_bucket: `anonymous:${bucket}`,
    p_subject_hash: await hashSubject(`${address}|${agent}`),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new HttpError(503, "Request protection is unavailable");
  if (!allowed) throw new HttpError(429, "Too many requests");
}

export async function requireUser(req: Request): Promise<{ user: User; admin: SupabaseClient }> {
  const authorization = req.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new HttpError(401, "Authentication required");
  const token = authorization.slice(7);
  const verifier = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await verifier.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Authentication required");
  const admin = adminClient();
  const subjectHash = await hashSubject(data.user.id);
  const bucket = `user:${new URL(req.url).pathname.split("/").filter(Boolean).pop() || "edge"}`;
  const { data: allowed, error: rateError } = await admin.rpc("consume_rate_limit", {
    p_bucket: bucket,
    p_subject_hash: subjectHash,
    p_limit: 120,
    p_window_seconds: 60,
  });
  if (rateError) throw new HttpError(503, "Request protection is unavailable");
  if (!allowed) throw new HttpError(429, "Too many requests");
  return { user: data.user, admin };
}

export async function requireAdmin(req: Request): Promise<{ user: User; admin: SupabaseClient }> {
  const context = await requireUser(req);
  const { data } = await context.admin.from("user_roles").select("id").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
  if (!data) throw new HttpError(403, "Administrator access required");
  return context;
}

export function requireIdempotencyKey(req: Request): string {
  const key = req.headers.get("idempotency-key")?.trim() || "";
  if (!IDEMPOTENCY_PATTERN.test(key)) throw new HttpError(400, "A valid Idempotency-Key header is required");
  return key;
}

export function requireUuid(value: unknown, name: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) throw new HttpError(400, `${name} is invalid`);
  return value;
}

export function optionalString(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new HttpError(400, "Invalid text value");
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new HttpError(400, "Invalid text value");
  return normalized;
}

export function appUrl(path: string): string {
  const base = new URL(env("APP_URL"));
  const target = new URL(path, base);
  if (target.origin !== base.origin) throw new HttpError(400, "Invalid redirect");
  return target.toString();
}

export async function parseJson(req: Request): Promise<Record<string, unknown>> {
  const length = Number(req.headers.get("content-length") || "0");
  if (length > 64_000) throw new HttpError(413, "Request is too large");
  try {
    const value = await req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

export function requireCron(req: Request): void {
  const expected = env("CRON_SECRET");
  const supplied = req.headers.get("x-cron-secret") || "";
  if (!supplied || supplied.length !== expected.length) throw new HttpError(401, "Unauthorized");
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  if (mismatch !== 0) throw new HttpError(401, "Unauthorized");
}
