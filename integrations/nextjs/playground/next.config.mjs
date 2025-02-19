/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: () => [
    {
      source: '/',
      destination: '/reference',
      permanent: true,
    },
  ],
  output: 'standalone',
}

export default nextConfig
