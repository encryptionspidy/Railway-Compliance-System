/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow mobile/network device access during development
  allowedDevOrigins: ['http://10.1.14.174:3000'],
};

module.exports = nextConfig;
