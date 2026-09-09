import Image from "next/image";
import { useT } from "@/components/app/LocaleProvider";

export function AuthBrand() {
  const t = useT();

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Image
        src="/logo-header.png"
        alt=""
        aria-hidden
        width={72}
        height={72}
        className="h-[72px] w-[72px] shrink-0"
        priority
      />
      <p className="text-lg font-semibold tracking-tight">{t("nav.brand")}</p>
    </div>
  );
}
