# Шинэ жилийн хүлээн авалтын ресторан хайх платформ

Иргэд, байгууллагууд ресторануудыг **дүүрэг, багтаамж, 1 хүнд ногдох бодит үнэ** болон үйлчилгээний нөхцөлөөр шүүж
харьцуулна. Ресторанууд цэсээ (PDF/зураг) байршуулахад Google Vertex AI (Gemini) багц бүрийг задалж, 1 хүний үнийг
автоматаар тооцоолж, менежер шалгаж баталгаажуулсны дараа нийтлэгдэнэ.

## Стек

Бүгд Vercel дээр, Supabase хэрэггүй:

| Бүрэлдэхүүн | Технологи |
| --- | --- |
| Frontend | Next.js 16 (App Router), Tailwind CSS 4 + shadcn маягийн UI |
| Өгөгдлийн сан | Vercel Postgres (Neon, Vercel Marketplace) — `@neondatabase/serverless` |
| Файл хадгалалт | Vercel Blob — client upload (файл функцээр дамжихгүй) |
| Нэвтрэлт | Auth.js (NextAuth v5), имэйл + нууц үг (bcrypt) |
| AI | Google Cloud Vertex AI (Gemini) — `@google/genai` |

## Бүтэц

| Зам | Үүрэг |
| --- | --- |
| `app/page.tsx` | Нүүр хуудас: дүүрэг, 1 хүний төсвийн slider, багтаамж, нөхцөлийн шүүлтүүр |
| `app/restaurants/[id]` | Дэлгэрэнгүй: зургийн цомог (lightbox), баталгаажсан багцууд, эх PDF/зураг харах, газрын зураг, залгах товч |
| `app/dashboard` | Эзэмшигчийн самбар: профайл, зураг, цэс байршуулах, AI үр дүнг шалгаж засах/баталгаажуулах (Human-in-the-Loop) |
| `app/api/blob/upload` | Vercel Blob client-upload токен — файл Blob руу шууд очно (4.5MB хязгаарыг тойрно) |
| `app/api/menus/extract` | Blob-оос файлыг уншиж Gemini руу илгээнэ, `maxDuration = 60` |
| `auth.ts`, `app/auth/actions.ts` | Auth.js тохиргоо, бүртгүүлэх/нэвтрэх/гарах |
| `lib/queries.ts` | Хайлт болон уншилтын SQL |
| `lib/vertex.ts` | Gemini дуудлага, `responseMimeType: application/json` + `responseSchema` |
| `lib/pricing.ts` | AI гаралтыг цэвэрлэж 1 хүний үнийг дахин тооцох (тесттэй) |
| `db/schema.sql` | Хүснэгт, индекс, 1 хүний үнийн trigger |

### SRS-ээс нэмсэн/өөрчилсөн зүйлс

- `users` хүснэгт — Supabase Auth-ын оронд Auth.js ашигладаг тул. `restaurants.owner_id` нь `users(id)`-г заана.
- `restaurants.has_host` — "Хөтлөгчтэй" шүүлтүүрт шаардлагатай тул нэмсэн. Мөн `description`, `latitude`, `longitude`.
- `restaurants.owner_id` UNIQUE — MVP-д нэг эзэмшигч нэг ресторантай.
- `price_per_person`-ийг DB trigger үргэлж `round(total_price / person_count)`-оор тооцно.
- RLS-ийн оронд эрхийн шалгалтыг код дээр хийнэ: бүх бичих query `owner_id = <нэвтэрсэн хэрэглэгч>` нөхцөлтэй,
  файлын URL нь `menus|images/<user_id>/` хавтсанд байх ёстой.
- Нийтэд зөвхөн `is_verified = true` багц харагдана. Баталгаажсан багцгүй ресторан хайлтад гарахгүй.
- **Gemini 1.5** загварууд Google дээр зогссон тул анхдагч загвар `gemini-2.5-flash` (`GEMINI_MODEL`-оор солино).
- Газрын зураг: дэлгэрэнгүй хуудсанд API түлхүүргүй Google Maps embed.

## Vercel дээр тохируулах

1. Repo-г Vercel-д import хийнэ (New Project → GitHub repo).
2. Project → **Storage** таб:
   - **Create Database → Neon (Postgres)** → project-д холбоно. `DATABASE_URL` автоматаар нэмэгдэнэ.
   - **Create → Blob** → project-д холбоно. `BLOB_READ_WRITE_TOKEN` автоматаар нэмэгдэнэ.
3. Project → Settings → **Environment Variables**: `AUTH_SECRET`, `VERTEX_API_KEY` (эсвэл
   `VERTEX_PROJECT` + `GOOGLE_SERVICE_ACCOUNT_KEY`), `GEMINI_MODEL` нэмнэ.
4. Redeploy. Build бүрийн өмнө `db/schema.sql` автоматаар ажиллаж хүснэгтүүдийг үүсгэнэ (idempotent).

Орчны хувьсагч дутуу бол сайт 500 алдааны оронд аль хувьсагчийг нэмэхийг харуулна.

## Локал дээр ажиллуулах

```bash
npm install
npm i -g vercel
vercel link            # Vercel project-той холбоно
vercel env pull .env.local
npm run db:migrate     # схем үүсгэнэ (анх удаа)
npm run dev            # http://localhost:3000
```

## Скриптүүд

```bash
npm run dev         # хөгжүүлэлт
npm run build       # production build
npm run lint        # TypeScript шалгалт
npm test            # unit тестүүд
npm run db:migrate  # db/schema.sql-г DATABASE_URL руу ажиллуулна
```
