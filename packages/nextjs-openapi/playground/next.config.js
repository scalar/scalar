/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: () => [
    {
      source: '/',
      destination: '/openapi',
      permanent: true,
    },
  ],
  output: 'standalone',
}

export default nextConfig
