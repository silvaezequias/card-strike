/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Bancos rodam direto do node_modules: o PGlite precisa dos arquivos WebAssembly originais.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
}

export default nextConfig
