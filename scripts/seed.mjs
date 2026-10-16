// 10 демо ресторан оруулна. Хэрэглээ: серверийг зогсоогоод `npm run seed`
// Дахин ажиллуулахад өмнөх демо өгөгдлийг (@demo.mn хэрэглэгчид) устгаад шинээр үүсгэнэ.
// Тэмдэглэл: өгөгдлийн сан хоосон бол апп анх асахад демо өгөгдлийг автоматаар оруулдаг.
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { seedDemo } from "./seed-core.mjs";

const port = process.env.PORT || 3000;
const running = await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(1000) }).then(() => true, () => false);
if (running) {
  console.error(`Сервер localhost:${port} дээр ажиллаж байна. Эхлээд түүнийг зогсооно уу (Ctrl+C), дараа нь дахин ажиллуулна.`);
  process.exit(1);
}

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
mkdirSync(path.join(dataDir, "pgdata"), { recursive: true });
const db = await PGlite.create(path.join(dataDir, "pgdata"));
await db.exec(readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
const { count, password } = await seedDemo(db, console.log);
await db.close();
console.log(`\n${count} демо ресторан орлоо. Демо эзэмшигчийн нууц үг: ${password}`);
