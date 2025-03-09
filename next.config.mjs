/** @type {import('next').NextConfig} */
const nextConfig = {
  // We need to make the OpenAI API key available to the client
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  // Configure webpack to handle PDF.js worker
  webpack: (config, { isServer }) => {
    // We don't need the worker on the server
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig; 