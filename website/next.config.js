/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  async redirects() {
    return [
      {
        source: "/services",
        destination: "/tutoring",
        permanent: true
      },
      {
        source: "/services/:slug",
        destination: "/tutoring/:slug",
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
