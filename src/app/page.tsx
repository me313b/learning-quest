import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChildPicker from "@/components/ChildPicker";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ChildPicker />;
}
