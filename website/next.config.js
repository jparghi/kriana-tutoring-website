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
      },
      // /demo became /events. Flyers, QR codes, ads and emails (including the
      // portal's /demo/consent links) still use the old URLs; query strings
      // such as utm_* and ref are carried through.
      {
        source: "/demo",
        destination: "/events",
        permanent: true
      },
      {
        source: "/demo/:path*",
        destination: "/events/:path*",
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
