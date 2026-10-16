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

/**
 * Vertex AI клиент. Нэвтрэх аргууд (эхнийх нь давуу):
 * 1. Service account JSON — GOOGLE_SERVICE_ACCOUNT_KEY (Vercel-д тохиромжтой)
 * 2. Service account файлын зам — VERTEX_CREDENTIALS (локал)
 * 3. Vertex AI API түлхүүр (express mode) — VERTEX_API_KEY
 * 4. Application Default Credentials (gcloud auth application-default login)
 */
function getClient() {
  if (client) return client;
  const project = process.env.VERTEX_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_LOCATION || process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const keyFile = process.env.VERTEX_CREDENTIALS;
  const apiKey = process.env.VERTEX_API_KEY;

  if (keyJson || keyFile) {
    if (!project) throw new Error("VERTEX_PROJECT тохируулаагүй байна");
    client = new GoogleGenAI({
      vertexai: true,
      project,
      location,
      googleAuthOptions: keyJson ? { credentials: JSON.parse(keyJson) } : { keyFilename: keyFile },
    });
  } else if (apiKey) {
    // Express mode: API түлхүүр нь project/location-гүйгээр global endpoint ашиглана.
    client = new GoogleGenAI({ vertexai: true, apiKey });
  } else {
    if (!project) throw new Error("VERTEX_PROJECT эсвэл VERTEX_API_KEY тохируулаагүй байна");
    client = new GoogleGenAI({ vertexai: true, project, location });
  }
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
