# Шинэ жилийн хүлээн авалтын ресторан хайх платформ

Иргэд, байгууллагууд ресторануудыг **дүүрэг, багтаамж, 1 хүнд ногдох бодит үнэ** болон үйлчилгээний нөхцөлөөр шүүж
харьцуулна. Ресторанууд цэсээ (PDF/зураг) байршуулахад Google Vertex AI (Gemini) багц бүрийг задалж, 1 хүний үнийг
автоматаар тооцоолж, менежер шалгаж баталгаажуулсны дараа нийтлэгдэнэ.

**Vercel дээр ажиллана.** Өгөгдлийн сан — Neon (Postgres), файл — Vercel Blob.

## Стек

| Бүрэлдэхүүн | Технологи |
| --- | --- |
| Frontend | Next.js 16 (App Router), Tailwind CSS 4, [UIAble](https://uiable.com) компонентууд (Base UI) |
| Өгөгдлийн сан | Neon Postgres (`@neondatabase/serverless`) |
| Файл хадгалалт | Vercel Blob — client upload (файл функцээр дамжихгүй) |
| Нэвтрэлт | Auth.js — утасны дугаар + нууц үг, [verify.mn](https://verify.mn) SMS баталгаажуулалт |
| Төлбөр | [Byl.mn](https://byl.mn) checkout — ресторан бүрийг нийтлэх 50,000₮ |
| AI | Google Cloud Vertex AI (Gemini) |

## Vercel дээр тохируулах

1. **Repo холбох:** Vercel → Add New → Project → `nuidea77/restaurant`.
2. **Storage** таб (project-д холбохдоо Production, Preview, Development гурвыг чагтална):
   - **Create Database → Neon** → `DATABASE_URL` автоматаар нэмэгдэнэ.
   - **Create → Blob** → `BLOB_READ_WRITE_TOKEN` автоматаар нэмэгдэнэ.
3. **Settings → Environment Variables** — `.env.example`-ийн дагуу:
   `AUTH_SECRET`, `VERTEX_API_KEY`, `BYL_TOKEN`, `BYL_PROJECT_ID`, `BYL_WEBHOOK_SECRET`, `VERIFY_MN_API_KEY`.
4. **Redeploy.** Build бүрийн өмнө `scripts/migrate.mjs` хүснэгтүүдийг үүсгэж/шинэчилж, өгөгдлийн сан хоосон бол
   10 демо ресторан оруулна.
5. **Byl webhook:** Byl dashboard → Webhooks → `https://<домэйн>/api/byl/webhook`, Signing secret → `BYL_WEBHOOK_SECRET`.

**Google Maps:** Google Cloud Console дээр *Maps JavaScript API*, *Geocoding API*, *Maps Embed API*-г идэвхжүүлж
API түлхүүр үүсгээд `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`-д, Map Management-ийн Map ID-г `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`-д
хийнэ. Түлхүүрийг **HTTP referrer**-ээр (`https://<домэйн>/*`) хязгаарлана. `NEXT_PUBLIC_` хувьсагч build үед орох тул
нэмсний дараа Redeploy хийнэ. Түлхүүргүй бол OpenStreetMap ажиллана.

`DATABASE_URL` дутуу бол сайт 500 алдааны оронд юуг тохируулахыг (орчин, branch, олдсон хувьсагчдын нэр) харуулна.

### Byl, verify.mn туршилтын горим
- `BYL_TOKEN`/`BYL_PROJECT_ID` хоосон бол төлбөрийн хуудсанд туршилтын товч гарна (мөнгө татагдахгүй).
  Byl project Test mode-д байхад гүйлгээ бүр 100₮; Live mode-д 50,000₮.
- `VERIFY_MN_API_KEY` хоосон бол утас баталгаажуулалт SMS-гүйгээр товчоор хийгдэнэ.

## Үндсэн урсгал

- **Хэрэглэгч:** нүүр хуудсанд дүүрэг, 1 хүний төсөв, багтаамж, нөхцөлөөр шууд шүүнэ → рестораны дэлгэрэнгүй
  (зураг, багцууд, эх цэс, газрын зураг, залгах).
- **Нэвтрэх:** утас + нууц үг, эсвэл **SMS-ээр** (бүртгэлтэй дугаараасаа 144773 руу код илгээнэ).
  **Нууц үг мартсан** бол `/forgot-password`: SMS-ээр батлаад шинэ нууц үгээ 2 удаа оруулна.
- **Эзэмшигч:** утасны дугаараар бүртгүүлэх (нууц үг 2 удаа) → 144773 руу SMS илгээж баталгаажуулах →
  "Ресторан нэмэх" (хэдэн ч) → Byl-ээр 50,000₮ төлөх → цэс байршуулах → AI-ийн гаргасан багцыг шалгаж баталгаажуулах.
- Төлбөр төлөгдөөгүй ресторан нийтэд харагдахгүй; баталгаажаагүй багц харагдахгүй.

Демо эзэмшигч: утас `80000001` … `80000010`, нууц үг `demo12345`.

## Бүтэц

| Зам | Үүрэг |
| --- | --- |
| `app/page.tsx` | Нүүр хуудас, шүүлтүүр |
| `app/restaurants/[id]` | Рестораны дэлгэрэнгүй |
| `app/login`, `app/verify` | Бүртгэл/нэвтрэлт, verify.mn баталгаажуулалт |
| `app/dashboard` | Миний ресторанууд, `new`, `r/[id]` (удирдах), `r/[id]/pay` (төлбөр) |
| `app/api/blob/upload` | Vercel Blob client-upload токен (зөвхөн өөрийн хавтас) |
| `app/api/menus/extract` | Цэсийг Gemini-ээр задлах (`maxDuration = 60`) |
| `app/api/byl/*`, `app/api/verify/*` | Byl буцах хаяг/webhook, verify.mn төлөв/callback |
| `db/schema.sql` | Хүснэгт, индекс, trigger (idempotent) |
| `scripts/migrate.mjs` | Build-ийн өмнө схем + демо өгөгдөл |

## Локал хөгжүүлэлт (заавал биш)

```bash
npm install
npm i -g vercel && vercel link && vercel env pull .env.local
npm run db:migrate
npm run dev
```

## Скриптүүд

```bash
npm run build       # migrate + next build (Vercel үүнийг ажиллуулна)
npm run lint        # TypeScript шалгалт
npm test            # unit тестүүд
npm run db:migrate  # схемийг DATABASE_URL руу ажиллуулна
npm run seed        # демо 10 рестораныг дахин оруулна
```
