/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode double-mounts effects in dev, which would open two WebRTC peers
  // with the same room id. Keep it off for this app.
  reactStrictMode: false,
};
module.exports = nextConfig;
