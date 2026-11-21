import { NextRequest, NextResponse } from 'next/server';

// Coarse gate: no session cookie → login. Real authorization happens in the API on every call.
export function middleware(req: NextRequest) {
  if (!req.cookies.get('nexus_token')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*'] };
