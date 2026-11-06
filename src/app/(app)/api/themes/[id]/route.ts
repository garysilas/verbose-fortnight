import { NextResponse } from "next/server";

import { importTheme } from "@/registry/theme-import";

const ENDPOINT = "https://tweakcn.com/r/themes/";
const ID_RE = /^[A-Za-z0-9_-]+$/;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!ID_RE.test(id)) {
    return NextResponse.json(
      { error: "That link does not contain a theme id." },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}${id}.json`, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { accept: "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "That link could not be read. Paste the registry JSON instead." },
      { status: 502 }
    );
  }

  // The verified endpoint answers 200/500 directly; a redirect is refused so
  // the route can never be turned into an off-host fetch.
  if (res.status >= 300 && res.status < 400) {
    return NextResponse.json(
      { error: "That theme id does not exist." },
      { status: 404 }
    );
  }

  if (res.status !== 200) {
    return NextResponse.json(
      { error: "That theme id does not exist." },
      { status: 404 }
    );
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return NextResponse.json(
      { error: "That link could not be read. Paste the registry JSON instead." },
      { status: 502 }
    );
  }

  const outcome = importTheme(payload);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: 422 });
  }

  // Return our own normalised JSON, never the upstream body.
  return NextResponse.json({
    name: outcome.theme,
    cssVars: outcome.cssVars,
    ignored: outcome.ignored,
  });
}
