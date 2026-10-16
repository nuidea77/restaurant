type Diagnostics = { vercelEnv: string; branch: string | null; relatedKeys: string[] };

/** Орчны хувьсагч дутуу үед 500 алдааны оронд юуг тохируулахыг харуулна (утгыг биш, зөвхөн нэрийг). */
export function SetupNotice({ missing, diagnostics }: { missing: string[]; diagnostics: Diagnostics }) {
  const envLabel = diagnostics.vercelEnv === "production" ? "Production" : diagnostics.vercelEnv === "preview" ? "Preview" : diagnostics.vercelEnv;

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-16">
      <h1 className="text-2xl font-bold">Өгөгдлийн сан холбогдоогүй байна</h1>
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
          <b>Deployments</b> → хамгийн сүүлийн deployment → <b>⋯</b> → <b>Redeploy</b>. Хувьсагч нэмсний дараа заавал
          дахин deploy хийх ёстой.
        </li>
      </ol>

      <div className="rounded-lg border bg-muted p-4 text-sm">
        <p className="mb-2 font-medium">Оношилгоо</p>
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
          {diagnostics.relatedKeys.length ? (
            <code className="font-mono">{diagnostics.relatedKeys.join(", ")}</code>
          ) : (
            "алга"
          )}
        </p>
        {diagnostics.vercelEnv === "preview" && (
          <p className="mt-2 text-amber-700">
            Энэ бол Preview deployment. Хувьсагчдаа зөвхөн Production-д нэмсэн бол Preview-д харагдахгүй — Settings →
            Environment Variables дээр Preview-г мөн чагтална уу.
          </p>
        )}
      </div>
    </main>
  );
}
