// Tiny pure helper: turn the full child row into the compact shape the AI
// prompt builders expect. Kept web-free so both the browser and the API routes
// can use it (and so it ports to a native app unchanged).

import type { ChildProfile, Profile } from "./types";

export function toChildProfile(p: Profile): ChildProfile {
  return {
    name: p.name,
    age: p.age,
    year: p.year,
    interests_text: (p.interests || []).join(", "),
    strengths: p.strengths || {},
  };
}
