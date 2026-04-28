/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // monorepo workspace 패키지 (.ts 그대로 import) 컴파일
  transpilePackages: ["@cadence/db"],
  experimental: {
    // Server Actions는 Next 15 default — 별도 옵션 불필요
  },
};

export default nextConfig;
