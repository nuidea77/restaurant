import "server-only";
import { GoogleGenAI, Type, type Part, type Schema } from "@google/genai";
import { normalizePackages, type ExtractedPackage } from "./pricing";

const MENU_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    packages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          package_name: { type: Type.STRING, description: "Багцын нэр (цэсэнд бичигдсэнээр)" },
          total_price: { type: Type.NUMBER, description: "Багцын нийт үнэ, төгрөгөөр, бүхэл тоо" },
          person_count: { type: Type.INTEGER, description: "Нийт үнэд багтах хүний тоо. Тодорхойгүй бол 1" },
          price_per_person: { type: Type.NUMBER, description: "total_price / person_count" },
          items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Багцад багтсан хоол, ундаа, үйлчилгээ" },
        },
        required: ["package_name", "total_price", "person_count", "price_per_person", "items"],
        propertyOrdering: ["package_name", "total_price", "person_count", "price_per_person", "items"],
      },
    },
  },
  required: ["packages"],
};

const PROMPT = `Чи Монгол рестораны Шинэ жилийн хүлээн авалтын цэсийг задлагч.
Хавсаргасан PDF эсвэл зурагнаас бүх багцыг (сет, ширээний багц, меню) олж JSON болгож буцаа.

Дүрэм:
- Үнийг төгрөгөөр, тэмдэгт болон таслалгүй бүхэл тоогоор бич (1,500,000₮ → 1500000).
- "1 хүний 100,000₮" бол total_price=100000, person_count=1, price_per_person=100000.
- "10 хүний ширээний багц 1,500,000₮" бол total_price=1500000, person_count=10, price_per_person=150000.
- Хүний тоо заагаагүй бол person_count=1 гэж үз.
- items-д тухайн багцад багтсан хоол, ундаа, үйлчилгээг тус бүр нэг мөр болгон, цэсэнд байгаа хэлээр нь бич.
- Цэсэнд байхгүй мэдээлэл зохиож болохгүй. Багц олдохгүй бол хоосон жагсаалт буцаа.`;

let client: GoogleGenAI | null = null;

function getClient() {
  if (client) return client;
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) throw new Error("GOOGLE_CLOUD_PROJECT тохируулаагүй байна");
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  client = new GoogleGenAI({
    vertexai: true,
    project,
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    // Vercel дээр файл систем ашиглах боломжгүй тул JSON түлхүүрийг env-ээс уншина.
    ...(key ? { googleAuthOptions: { credentials: JSON.parse(key) } } : {}),
  });
  return client;
}

export type MenuSource =
  | { data: Buffer; mimeType: string } // Base64 buffer
  | { fileUri: string; mimeType: string }; // gs://bucket/path

export async function extractMenuPackages(source: MenuSource): Promise<ExtractedPackage[]> {
  const filePart: Part =
    "data" in source
      ? { inlineData: { data: source.data.toString("base64"), mimeType: source.mimeType } }
      : { fileData: { fileUri: source.fileUri, mimeType: source.mimeType } };

  const response = await getClient().models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: [{ role: "user", parts: [filePart, { text: PROMPT }] }],
    config: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: MENU_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI хариу хоосон ирлээ");
  return normalizePackages(JSON.parse(text));
}
