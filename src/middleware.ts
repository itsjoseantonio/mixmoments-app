import { clerkMiddleware } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware(async (_auth, request) => {
  // API routes: Clerk handles auth, i18n routing does not apply
  if (request.nextUrl.pathname.startsWith('/api')) return;
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
