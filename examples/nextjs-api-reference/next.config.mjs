/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: () => [
    {
      source: '/',
      destination: '/api/docs',
      permanent: true,
    },
  ],
}

export default nextConfig
