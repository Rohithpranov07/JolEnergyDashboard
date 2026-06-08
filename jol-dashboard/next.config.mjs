const nextConfig = {
  compress: true, // Automatically compress components and assets with gzip/brotli
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
