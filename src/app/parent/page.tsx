import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ParentApp from "@/components/parent/ParentApp";

export default async function ParentPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ParentApp />;
}
