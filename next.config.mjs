/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gomajesticinsurance.com",
      },
    ],
  },
};

export default nextConfig;
