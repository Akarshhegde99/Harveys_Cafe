import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Public routes that shouldn't be accessible when logged in
    if (user && pathname === '/login') {
        return NextResponse.redirect(new URL('/menu', request.url))
    }

    // Protected routes for customers
    const isCustomerProtectedRoute = pathname.startsWith('/cart') || pathname.startsWith('/invoices')
    if (!user && isCustomerProtectedRoute) {
        const url = new URL('/login', request.url)
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
    }

    // Admin protection
    // Note: For real admin protection, you should check user role in metadata or a profiles table
    const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')
    if (isAdminRoute) {
        // If not logged in at all
        if (!user) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        // Check if user has admin role (assuming you have this in user_metadata for now)
        // or just let it pass if they are logged in and you handle authorization later
        // if (user.user_metadata?.role !== 'admin') {
        //   return NextResponse.redirect(new URL('/', request.url))
        // }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
