/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 시 타입 에러가 있어도 무시하고 배포 진행
  typescript: {
    ignoreBuildErrors: true,
  },
  // 빌드 시 문법 검사(ESLint) 에러가 있어도 무시하고 진행
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  }
};

export default nextConfig;