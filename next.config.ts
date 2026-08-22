import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/estoque',
        permanent: true, // Use true para redirecionamento 308 (permanente) ou false para 307 (temporário)
      },
    ];
  }
};

export default nextConfig;