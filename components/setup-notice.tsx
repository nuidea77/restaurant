import { Database } from "lucide-react";
import { Card, CardBar } from "@/components/ui/card";

type Diagnostics = { vercelEnv: string; branch: string | null; relatedKeys: string[] };

/** Орчны хувьсагч дутуу үед 500 алдааны оронд юуг тохируулахыг харуулна (утгыг биш, зөвхөн нэрийг). */
export function SetupNotice({ missing, diagnostics }: { missing: string[]; diagnostics: Diagnostics }) {
  const envLabel =
    diagnostics.vercelEnv === "production" ? "Production" : diagnostics.vercelEnv === "preview" ? "Preview" : diagnostics.vercelEnv;

  return (
    <main className="hero-glow flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-xl overflow-hidden shadow-xl shadow-black/5">
        <CardBar icon={<Database />} title="Тохиргоо дутуу байна" />
        <div className="space-y-5 p-6">
          <p>
            Энэ deployment-д <code className="font-mono">{missing.join(", ")}</code> олдсонгүй.
          </p>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            <li>
              Vercel → project → <b>Storage</b> → <b>Create Database</b> → <b>Neon</b> үүсгэнэ.
            </li>
            <li>
              <b>Connect Project</b> хийхдээ <b>Production, Preview, Development</b> гурвууланг нь чагтална.
            </li>
            <li>
              <b>Deployments</b> → хамгийн сүүлийн deployment → <b>⋯</b> → <b>Redeploy</b>. Хүснэгт, демо өгөгдөл build
              хийх үед автоматаар үүснэ.
            </li>
          </ol>
          <div className="rounded-lg border bg-accent p-4 text-sm">
            <p className="mb-1 font-medium">Оношилгоо</p>
            <p>
              Орчин: <b>{envLabel}</b>
              {diagnostics.branch && (
                <>
                  {" "}
                  · branch: <code className="font-mono">{diagnostics.branch}</code>
                </>
              )}
            </p>
            <p className="mt-1">
              Холбогдох хувьсагчид:{" "}
              {diagnostics.relatedKeys.length ? <code className="font-mono">{diagnostics.relatedKeys.join(", ")}</code> : "алга"}
            </p>
            {diagnostics.vercelEnv === "preview" && (
              <p className="mt-2 text-amber-700">
                Энэ бол Preview deployment. Хувьсагчдаа зөвхөн Production-д нэмсэн бол Preview-д харагдахгүй.
              </p>
            )}
          </div>
        </div>
      </Card>
    </main>
  );
}
