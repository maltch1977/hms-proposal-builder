import { redirect } from "next/navigation";

export default async function DashboardRoot() {
  redirect("/proposals");
}
