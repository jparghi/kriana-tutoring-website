const { execSync } = require("child_process");

// Short commit + build time, shown in the footer so it's obvious which deploy
// is live. Netlify sets COMMIT_REF; local builds fall back to git.
function buildCommit() {
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF.slice(0, 7);
  try {
    return execSync("git rev-parse --short=7 HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "local";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: buildCommit(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString()
  },
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
