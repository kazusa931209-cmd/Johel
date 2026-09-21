import { type NextRequest } from "next/server";
import { handle } from "hono/vercel";
import { createApp } from "@/server/app";

export const runtime = "nodejs";
export const maxDuration = 300;

const app = createApp();
const honoHandler = handle(app);

type RouteContext = { params: Promise<{ path: string[] }> };

async function dispatch(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { path } = await context.params;
  const apiPath = path.length > 0 ? `/${path.join("/")}` : "/";
  const url = new URL(request.url);
  url.pathname = apiPath;
  const rewritten = new Request(url, request);
  return honoHandler(rewritten);
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
export const OPTIONS = dispatch;
