import { Logo } from "@/components/logo";
import { Divider } from "@/components/ui/frame";

export function SiteFooter() {
  return (
    <footer>
      <Divider />
      <div className="flex flex-col items-start justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
        <Logo />
        <p>Шинэ жилийн хүлээн авалтыг 1 хүний бодит үнээр харьцуулна. Цэсийг AI уншиж, газар эзэмшигч баталгаажуулна.</p>
      </div>
    </footer>
  );
}
