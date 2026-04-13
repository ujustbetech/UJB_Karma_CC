import { redirect } from "next/navigation";

export default function LegacyAdminAddRedeemRedirect() {
  redirect("/admin/redeem/add");
}
