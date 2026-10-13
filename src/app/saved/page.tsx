import { redirect } from "next/navigation";

/* A memorable address for saved notes ("Kaydettiklerim"). The list itself lives in the
   saved tab of /notes, so there is one implementation and one data source. Private:
   listed in the middleware matcher. */
export default function SavedPage() {
  redirect("/notes?tab=kaydedilenler");
}
