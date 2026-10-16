/** Орчны хувьсагч дутуу үед 500 алдааны оронд юуг тохируулахыг харуулна (утгыг биш, зөвхөн нэрийг). */
export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-16">
      <h1 className="text-2xl font-bold">Тохиргоо дутуу байна</h1>
      <p>Дараах орчны хувьсагчдыг Vercel → Project → Settings → Environment Variables хэсэгт нэмээд дахин deploy хийнэ үү:</p>
      <ul className="list-inside list-disc font-mono text-sm">
        {missing.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <ul className="space-y-1 text-sm text-muted-foreground">
        <li>
          <b>DATABASE_URL</b> — Project → Storage → Neon (Postgres) үүсгээд project-д холбоход автоматаар нэмэгдэнэ.
        </li>
        <li>
          <b>AUTH_SECRET</b> — дурын урт санамсаргүй тэмдэгт мөр (жишээ нь <code>openssl rand -base64 32</code>).
        </li>
      </ul>
    </main>
  );
}
