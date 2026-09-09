/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: () => [
    {
      source: '/',
      destination: '/scalar',
      permanent: true,
    },
  ],
  output: 'standalone',
}

export default nextConfig
