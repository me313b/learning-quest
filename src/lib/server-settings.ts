// Server-only helper shared by the API routes. Resolves the logged-in parent,
// reads their settings row and decrypts the API key (only ever here, on the
// server). Routes use this and bail with 401 when there's no user.

import { createClient } from "./supabase/server";
import { decryptSecret } from "./crypto";
import { DEFAULT_MODELS } from "./ai";
import type { Provider } from "./types";

export interface UserKeyContext {
  user: { id: string } | null;
  supabase: ReturnType<typeof createClient>;
  provider: Provider;
  model: string;
  apiKey: string;
  settings: Record<string, unknown> | null;
}

export async function getUserAndKey(): Promise<UserKeyContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      supabase,
      provider: "anthropic",
      model: "",
      apiKey: "",
      settings: null,
    };
  }

  const { data } = await supabase
    .from("account_settings")
    .select("*")
    .eq("owner", user.id)
    .maybeSingle();

  const provider = ((data?.api_provider as Provider) || "anthropic") as Provider;
  const model = (data?.api_model as string) || DEFAULT_MODELS[provider];

  let apiKey = "";
  try {
    if (data?.api_key_encrypted) apiKey = decryptSecret(data.api_key_encrypted);
  } catch {
    apiKey = "";
  }

  return {
    user: { id: user.id },
    supabase,
    provider,
    model,
    apiKey,
    settings: (data as Record<string, unknown>) ?? null,
  };
}
