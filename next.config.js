/** @type {import('next').NextConfig} */
module.exports = {
  allowedDevOrigins: ['192.168.0.126'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};
