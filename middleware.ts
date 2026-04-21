import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isSellerRoute = createRouteMatcher(['/seller(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (!isSellerRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  let role =
    sessionClaims?.metadata?.role ??
    sessionClaims?.publicMetadata?.role ??
    sessionClaims?.public_metadata?.role;

  // Fallback if publicMetadata is not properly configured in the session token template
  if (userId && !role) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = user?.publicMetadata?.role;
    } catch (error) {
      console.error("Error fetching user role inside middleware:", error);
    }
  }

  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : '';

  // Only block if not logged in or if the role is not seller
  if (!userId || normalizedRole !== 'seller') {
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