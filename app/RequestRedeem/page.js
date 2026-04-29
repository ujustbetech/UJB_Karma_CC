import { redirect } from "next/navigation";

export default function LegacyRequestRedeemRedirect() {
  redirect("/user/redeem");
}


