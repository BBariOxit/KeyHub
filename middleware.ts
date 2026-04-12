import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isSellerRoute = createRouteMatcher(['/seller(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isSellerRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();
  const role =
    sessionClaims?.metadata?.role ??
    sessionClaims?.publicMetadata?.role ??
    sessionClaims?.public_metadata?.role;

  if (!userId || role !== 'seller') {
    return new NextResponse('403 | Forbidden', {
      status: 403,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};