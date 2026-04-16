/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. 빌드 에러 무시 (기존 설정 유지)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // 2. 이미지 검문소 개방 (이게 핵심!)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 모든 사이트의 사진을 허용한다는 뜻입니다!
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true, // 이미지 최적화 기능을 꺼서 가장 확실하게 보여줍니다.
  },
};

export default nextConfig;