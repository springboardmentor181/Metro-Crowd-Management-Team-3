import { redirect } from "next/navigation";

export default function SystemLogsRedirectPage() {
  redirect("/system-status");
}
