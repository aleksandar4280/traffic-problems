// Middleware za zaštitu ruta

export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*'],
};