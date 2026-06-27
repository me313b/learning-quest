"use client";

import InteractiveLabs from "./labs/InteractiveLabs";

// The Labs hub is a set of hand-built, reliable interactive mini-games (maths,
// geometry, science, music), the French listen/speak and reading labs, a full
// PhET simulation library, and an optional AI "surprise experiment". Everything
// lives inside InteractiveLabs so the routing stays in one place.

export default function Labs({ onBack, profileId }: { onBack: () => void; profileId: string }) {
  return <InteractiveLabs onExit={onBack} profileId={profileId} />;
}
