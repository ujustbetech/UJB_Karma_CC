import { redirect } from "next/navigation";

export default function LegacyAddAdminPage() {
  redirect("/admin/settings/users");
}
