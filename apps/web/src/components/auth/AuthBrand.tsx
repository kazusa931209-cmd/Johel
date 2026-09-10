import Image from "next/image";

/** 4× the header logo (72px → 288px). Sourced from logo.png via logo-auth.png. */
const AUTH_LOGO_SIZE = 288;

export function AuthBrand() {
  return (
    <div className="flex shrink-0 justify-center">
      <Image
        src="/logo-auth.png"
        alt=""
        aria-hidden
        width={AUTH_LOGO_SIZE}
        height={AUTH_LOGO_SIZE}
        className="h-72 w-72 max-w-[min(288px,80vw)] shrink-0 object-contain"
        priority
      />
    </div>
  );
}
