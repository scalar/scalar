/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: () => [
    {
      source: '/',
      destination: '/reference',
      permanent: true,
    },
  ],
}

export default nextConfig
