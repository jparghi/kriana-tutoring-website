/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  async redirects() {
    return [
      {
        source: "/tutoring/homework-help-for-kids-ottawa",
        destination: "/tutoring/science-tutoring-for-kids-ottawa",
        permanent: true
      },
      {
        source: "/services/homework-help-for-kids-ottawa",
        destination: "/tutoring/science-tutoring-for-kids-ottawa",
        permanent: true
      },
      {
        source: "/services",
        destination: "/tutoring",
        permanent: true
      },
      {
        source: "/services/:slug",
        destination: "/tutoring/:slug",
        permanent: true
      },
      {
        source: "/birthday-parties",
        destination: "/birthday",
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
