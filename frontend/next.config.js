/** API calls go through the Next server so the httpOnly session cookie stays same-origin. */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND}/:path*` }];
  },
};
