# Шинэ жилийн хүлээн авалтын ресторан хайх платформ

Иргэд, байгууллагууд ресторануудыг **дүүрэг, багтаамж, 1 хүнд ногдох бодит үнэ** болон үйлчилгээний нөхцөлөөр шүүж
харьцуулна. Ресторанууд цэсээ (PDF/зураг) байршуулахад Google Vertex AI (Gemini) багц бүрийг задалж, 1 хүний үнийг
автоматаар тооцоолж, менежер шалгаж баталгаажуулсны дараа нийтлэгдэнэ.

## Стек

Next.js 16 (App Router) · Tailwind CSS 4 + shadcn маягийн UI · Supabase (Postgres, Auth, Storage) · Vertex AI (`@google/genai`) · Vercel

## Бүтэц

| Зам | Үүрэг |
| --- | --- |
| `app/page.tsx` | Нүүр хуудас: дүүрэг, 1 хүний төсвийн slider, багтаамж, нөхцөлийн шүүлтүүр |
| `app/restaurants/[id]` | Дэлгэрэнгүй: зургийн цомог (lightbox), баталгаажсан багцууд, эх PDF/зураг харах, газрын зураг, залгах товч |
| `app/dashboard` | Эзэмшигчийн самбар: профайл, зураг, цэс байршуулах, AI үр дүнг шалгаж засах/баталгаажуулах (Human-in-the-Loop) |
| `app/api/uploads/sign` | Presigned upload URL — файл Vercel-ээр дамжихгүй, Supabase Storage руу шууд очно (4.5MB хязгаарыг тойрно) |
| `app/api/menus/extract` | Storage-оос файлыг уншиж Gemini руу илгээнэ, `maxDuration = 60` |
| `lib/vertex.ts` | Gemini дуудлага, `responseMimeType: application/json` + `responseSchema` |
| `lib/pricing.ts` | AI гаралтыг цэвэрлэж 1 хүний үнийг дахин тооцох (тесттэй) |
| `supabase/migrations/0001_init.sql` | Хүснэгт, индекс, RLS, `search_restaurants` RPC, storage bucket + policy |

### SRS-ээс нэмсэн/өөрчилсөн зүйлс

- `restaurants.has_host` — "Хөтлөгчтэй" шүүлтүүрт шаардлагатай тул нэмсэн. Мөн `description`, `latitude`, `longitude`.
- `restaurants.owner_id` UNIQUE — MVP-д нэг эзэмшигч нэг ресторантай.
- `price_per_person`-ийг DB trigger үргэлж `round(total_price / person_count)`-оор тооцно — AI эсвэл гар засварын
  тооцооллын алдаа нийтэд гарахгүй.
- Нийтэд зөвхөн `is_verified = true` багц харагдана (RLS). Баталгаажсан багцгүй ресторан хайлтад гарахгүй.
- **Gemini 1.5** загварууд Google дээр зогссон тул анхдагч загвар `gemini-2.5-flash` (`GEMINI_MODEL`-оор солино).
- Газрын зураг: дэлгэрэнгүй хуудсанд API түлхүүргүй Google Maps embed. Олон цэгтэй жагсаалтын газрын зураг нь
  Mapbox/Google Maps JS түлхүүр шаардах тул дараагийн шатанд.

## Суулгах

```bash
npm install
cp .env.example .env.local   # утгуудыг бөглөнө
```

1. **Supabase**: шинэ төсөл үүсгээд `supabase/migrations/0001_init.sql`-ийг SQL Editor-т ажиллуулна
   (эсвэл `supabase db push`). Auth → URL Configuration-д `https://<домэйн>/auth/callback`-г нэмнэ.
2. **Google Cloud**: Vertex AI API идэвхжүүлж, `roles/aiplatform.user` эрхтэй service account үүсгэнэ. JSON түлхүүрийг
   `GOOGLE_SERVICE_ACCOUNT_KEY`-д нэг мөрөөр оруулна (локал дээр `gcloud auth application-default login` хангалттай).
3. `npm run dev` → http://localhost:3000

## Скриптүүд

```bash
npm run dev     # хөгжүүлэлт
npm run build   # production build
npm run lint    # TypeScript шалгалт
npm test        # 1 хүний үнийн тооцооллын тест
```

## Vercel

Repo-г Vercel-д холбоод `.env.example` дахь хувьсагчдыг Project Settings → Environment Variables-д оруулна.
`/api/menus/extract` 60 секунд ажиллах тул Hobby планд ч болно (Pro дээр илүү урт хугацаа тохируулах боломжтой).
