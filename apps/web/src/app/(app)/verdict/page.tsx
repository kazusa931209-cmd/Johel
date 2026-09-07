import { redirect } from "next/navigation";

export default function VerdictRedirectPage() {
  redirect("/settings/prompts");
}
