"use client";

// A little set of original, blocky cartoon characters drawn as inline SVG.
// They're deliberately simple and copyright-safe (no real-world IP), and use
// the app palette. Shown between questions and on a correct answer to keep a
// young child smiling. Pick one at random with randomFunIndex().

import type { ReactElement } from "react";

export function randomFunIndex(): number {
  return Math.floor(Math.random() * 7);
}

function Slime() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" role="img" aria-label="happy slime">
      <rect x="22" y="34" width="76" height="64" rx="10" fill="#7FB238" stroke="#3c6b27" strokeWidth="4" />
      <rect x="22" y="78" width="76" height="20" rx="8" fill="#5D9C3C" />
      <circle cx="46" cy="58" r="7" fill="#1A1525" />
      <circle cx="74" cy="58" r="7" fill="#1A1525" />
      <circle cx="48" cy="56" r="2.4" fill="#fff" />
      <circle cx="76" cy="56" r="2.4" fill="#fff" />
      <path d="M48 74 Q60 84 72 74" stroke="#1A1525" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" role="img" aria-label="happy star">
      <path
        d="M60 14 L72 46 L106 46 L78 66 L88 100 L60 80 L32 100 L42 66 L14 46 L48 46 Z"
        fill="#F8B617"
        stroke="#b8860b"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="52" cy="58" r="4" fill="#1A1525" />
      <circle cx="68" cy="58" r="4" fill="#1A1525" />
      <path d="M52 68 Q60 76 68 68" stroke="#1A1525" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Rocket() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" role="img" aria-label="rocket">
      <path d="M60 12 C78 30 80 56 74 78 H46 C40 56 42 30 60 12 Z" fill="#D8D8D8" stroke="#828282" strokeWidth="3" />
      <circle cx="60" cy="44" r="9" fill="#4AEDD9" stroke="#1A1525" strokeWidth="3" />
      <path d="M46 70 L32 86 L46 80 Z" fill="#E03C28" />
      <path d="M74 70 L88 86 L74 80 Z" fill="#E03C28" />
      <path d="M50 80 H70 L64 100 Q60 108 56 100 Z" fill="#F8B617" />
    </svg>
  );
}

function Cat() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" role="img" aria-label="cat">
      <path d="M30 40 L40 18 L52 36 Z" fill="#F8B617" stroke="#1A1525" strokeWidth="3" />
      <path d="M90 40 L80 18 L68 36 Z" fill="#F8B617" stroke="#1A1525" strokeWidth="3" />
      <rect x="30" y="34" width="60" height="58" rx="20" fill="#F8B617" stroke="#1A1525" strokeWidth="4" />
      <circle cx="48" cy="60" r="5" fill="#1A1525" />
      <circle cx="72" cy="60" r="5" fill="#1A1525" />
      <path d="M58 70 L62 70 L60 74 Z" fill="#E03C28" />
      <path d="M60 74 V80 M60 80 Q52 82 48 78 M60 80 Q68 82 72 78" stroke="#1A1525" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Robot() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" role="img" aria-label="robot">
      <line x1="60" y1="14" x2="60" y2="26" stroke="#828282" strokeWidth="3" />
      <circle cx="60" cy="12" r="5" fill="#E03C28" />
      <rect x="32" y="26" width="56" height="48" rx="10" fill="#4AEDD9" stroke="#1A1525" strokeWidth="4" />
      <rect x="44" y="42" width="12" height="12" rx="3" fill="#1A1525" />
      <rect x="64" y="42" width="12" height="12" rx="3" fill="#1A1525" />
      <rect x="48" y="62" width="24" height="5" rx="2.5" fill="#1A1525" />
      <rect x="40" y="78" width="40" height="26" rx="6" fill="#D8D8D8" stroke="#1A1525" strokeWidth="4" />
    </svg>
  );
}

function Planet() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" role="img" aria-label="planet">
      <circle cx="60" cy="58" r="30" fill="#2C4E9C" stroke="#1A1525" strokeWidth="4" />
      <circle cx="50" cy="48" r="6" fill="#7EC0EE" opacity="0.7" />
      <circle cx="70" cy="64" r="9" fill="#7EC0EE" opacity="0.6" />
      <ellipse cx="60" cy="58" rx="48" ry="14" fill="none" stroke="#F8B617" strokeWidth="5" transform="rotate(-18 60 58)" />
      <circle cx="50" cy="54" r="3" fill="#1A1525" />
      <circle cx="68" cy="54" r="3" fill="#1A1525" />
      <path d="M50 66 Q60 72 70 66" stroke="#1A1525" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Gem() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" role="img" aria-label="gem">
      <path d="M40 34 H80 L98 56 L60 102 L22 56 Z" fill="#4AEDD9" stroke="#1A1525" strokeWidth="4" strokeLinejoin="round" />
      <path d="M40 34 L48 56 H22 Z M80 34 L72 56 H98 Z M48 56 H72 L60 102 Z" fill="#17DD62" opacity="0.45" />
      <circle cx="52" cy="58" r="3.5" fill="#1A1525" />
      <circle cx="68" cy="58" r="3.5" fill="#1A1525" />
      <path d="M52 66 Q60 72 68 66" stroke="#1A1525" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const CHARACTERS = [Slime, Star, Rocket, Cat, Robot, Planet, Gem];

export default function FunIllustration({ index = 0 }: { index?: number }): ReactElement {
  const C = CHARACTERS[((index % CHARACTERS.length) + CHARACTERS.length) % CHARACTERS.length];
  return (
    <div className="flex justify-center">
      <div className="animate-floaty">
        <C />
      </div>
    </div>
  );
}
