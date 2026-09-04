import { type NextRequest, NextResponse } from "next/server";
import { API_TIMEOUT_MS } from "@/lib/api-timeout";

const apiOrigin = process.env.API_ORIGIN ?? "http://127.0.0.1:4042";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function buildTargetUrl(path: string[], search: string) {
  const suffix = path.length > 0 ? path.join("/") : "";
  return `${apiOrigin}/${suffix}${search}`;
}

function forwardRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

function forwardResponseHeaders(response: Response): Headers {
  const headers = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

async function proxyRequest(request: NextRequest, path: string[]) {
  const targetUrl = buildTargetUrl(path, request.nextUrl.search);
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers: forwardRequestHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      cache: "no-store",
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: forwardResponseHeaders(upstream),
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    if (timedOut) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 },
      );
    }
    return NextResponse.json({ error: "API proxy request failed." }, { status: 502 });
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
