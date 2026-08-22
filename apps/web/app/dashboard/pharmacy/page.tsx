import { redirect } from "next/navigation";
import { PHARMACY_HOME } from "@/lib/pharmacy-nav";

export default function PharmacyHomePage() {
  return redirect(`${PHARMACY_HOME}/overview`);
}
