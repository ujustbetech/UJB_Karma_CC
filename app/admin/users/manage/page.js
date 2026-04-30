import { redirect } from "next/navigation";

export default function LegacyManageAdminsPage() {
  redirect("/admin/settings/users");
}


