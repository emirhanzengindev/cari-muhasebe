module.exports = {
  serverExternalPackages: ['bcryptjs'],
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
};