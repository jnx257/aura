import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "aura_session";

/** Optimistic gate: no session cookie → sign in. The real session check happens on the server per request. */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/hoje/:path*", "/semana/:path*", "/metas/:path*", "/refletir/:path*"],
};
