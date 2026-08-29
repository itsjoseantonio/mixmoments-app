import { clerkMiddleware } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Common crawler/bot user agents. Search engines must never have their
// locale routing decided by negotiated request headers (Accept-Language) —
// only real users get that treatment. See Google's guidance against
// adapting content/routing based on request signals for crawlers.
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|preview/i;

function isLocalePrefixed(pathname: string) {
  return routing.locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

export default clerkMiddleware(async (_auth, request) => {
  // API routes: Clerk handles auth, i18n routing does not apply
  if (request.nextUrl.pathname.startsWith('/api')) return;

  const isBot = BOT_UA.test(request.headers.get('user-agent') ?? '');
  if (isBot && !isLocalePrefixed(request.nextUrl.pathname)) {
    // Skip Accept-Language negotiation entirely: always resolve to the
    // default locale deterministically, so crawlers never get bounced
    // around based on headers we don't control.
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${request.nextUrl.pathname}`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and locale-agnostic metadata
    // routes (robots.txt, sitemap.xml) — these must never be redirected
    // into a locale prefix, for any Accept-Language / bot UA.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt)$).*)',
  ],
};
