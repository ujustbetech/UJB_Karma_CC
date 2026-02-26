/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    turbo: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};
