import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GameShell from "@/components/play/GameShell";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: { p?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileId = searchParams?.p || "";
  if (!profileId) redirect("/");
  return <GameShell profileId={profileId} />;
}
