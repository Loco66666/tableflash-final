import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SitePage from "@/app/site/page";

const marketingHosts = new Set(["tableflash.fr", "www.tableflash.fr"]);

export default async function Home() {
  const host = (await headers()).get("host")?.split(":")[0] ?? "";

  if (marketingHosts.has(host)) {
    return <SitePage />;
  }

  redirect("/login");
}