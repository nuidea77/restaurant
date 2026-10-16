// Скриптүүдэд (migrate, seed) зориулсан Neon холболт.
import { neon, neonConfig, Pool } from "@neondatabase/serverless";

// Зөвхөн тест: локал Postgres-ийн өмнө ажиллах Neon прокси. Production-д тохируулахгүй.
if (process.env.NEON_LOCAL_PROXY) {
  const port = process.env.NEON_LOCAL_PROXY;
  neonConfig.fetchEndpoint = (host) => `http://${host}:${port}/sql`;
  neonConfig.wsProxy = (host) => `${host}:${port}/v2`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

export function findDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  const hit = Object.entries(process.env)
    .sort(([a], [b]) => a.localeCompare(b))
    .find(([k, v]) => /(^|_)(DATABASE_URL|POSTGRES_URL)$/.test(k) && v?.startsWith("postgres"));
  return hit?.[1];
}

/** seed-core-д зориулсан { sql`` → { rows } } хэлбэрийн adapter. */
export function connect(url) {
  const query = neon(url);
  return {
    sql: async (strings, ...values) => ({ rows: await query(strings, ...values) }),
    /** Олон statement-тэй SQL (схем) — HTTP биш WebSocket Pool-оор. */
    exec: async (text) => {
      const pool = new Pool({ connectionString: url });
      try {
        await pool.query(text);
      } finally {
        await pool.end();
      }
    },
  };
}
