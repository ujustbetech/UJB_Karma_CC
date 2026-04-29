import { redirect } from "next/navigation";

export default function LegacyPaymentRecRedirect() {
  redirect("/user/payments");
}


