module.exports = {
  serverExternalPackages: ['bcryptjs'],
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  // Hydration hatasını azaltmak için
  reactStrictMode: true,
  swcMinify: true,
};