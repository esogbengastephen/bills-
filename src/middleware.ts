import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only log activities for API routes and specific pages
  const pathname = request.nextUrl.pathname
  
  // Skip logging for static assets and certain paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Extract user address from headers or query params
  const userAddress = request.headers.get('x-user-address') || 
                     request.nextUrl.searchParams.get('userAddress')

  if (userAddress) {
    try {
      // Log page view activity (optional - don't fail if database is unavailable)
      const response = await fetch(`${request.nextUrl.origin}/api/database/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          action: 'view_page',
          details: {
            path: pathname,
            method: request.method,
            timestamp: new Date().toISOString(),
          },
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        }),
      })
      
      // Don't fail the request if logging fails
      if (!response.ok) {
        console.warn('Failed to log user activity:', response.status)
      }
    } catch (error) {
      // Don't fail the request if logging fails
      console.warn('Failed to log user activity:', error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
