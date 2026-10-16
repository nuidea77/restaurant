// Демо 10 рестораныг (дахин) оруулна: `npm run seed`. @demo.mn хэрэглэгчдийг устгаад шинээр үүсгэнэ.
// DATABASE_URL-г `vercel env pull .env.local`-оор татсан байх ёстой.
import { connect, findDatabaseUrl } from "./neon-node.mjs";
import { seedDemo } from "./seed-core.mjs";

const url = findDatabaseUrl();
if (!url) {
  console.error("DATABASE_URL олдсонгүй. `vercel env pull .env.local` хийнэ үү.");
  process.exit(1);
}
const { count, password } = await seedDemo(connect(url), console.log);
console.log(`\n${count} демо ресторан орлоо. Демо эзэмшигчийн нууц үг: ${password}`);
