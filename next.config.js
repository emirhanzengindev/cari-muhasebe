module.exports = {
  reactStrictMode: false, // Disabled to prevent infinite mounting
  serverExternalPackages: ['@supabase/supabase-js', 'bcryptjs'],
  images: {
    // Dashboard module illustrations are served from Unsplash and optimized
    // through next/image. Any query string is allowed (auto=format, w, q).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};