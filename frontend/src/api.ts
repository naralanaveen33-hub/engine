const TOKEN_KEY = "aquacrop_token";

export function token() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string) {
  sessionStorage.setItem(TOKEN_KEY, t);
}

export async function api(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (!(opts.body instanceof FormData) && !headers["Content-Type"] && opts.body) headers["Content-Type"] = "application/json";
  const t = token();
  if (t) headers["Authorization"] = `Bearer ${t}`;
  const res = await fetch(path.startsWith("/api") ? path : `/api/v1${path}`, { ...opts, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = typeof data === "object" && data ? JSON.stringify(data) : text;
    throw new Error(err || res.statusText);
  }
  return data;
}
