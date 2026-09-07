import { redirect } from "next/navigation";

export default async function PromptsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab?.trim();
  redirect(tab ? `/settings/prompts?tab=${tab}` : "/settings/prompts");
}
