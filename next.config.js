/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/goal",
        destination: "/goals",
        permanent: true,
      },
      {
        source: "/test",
        destination: "/testing",
        permanent: true,
      },
      {
        source: "/learn",
        destination: "/learning",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
