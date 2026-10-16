import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite нь WASM файлуудаа node_modules-оос уншдаг тул bundle хийхгүй.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
