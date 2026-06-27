// Shared types used across the pure logic, the API routes and the UI.

export type Provider = "anthropic" | "openai";

export type Verdict = "correct" | "partial" | "incorrect" | "timeout";

export type QType =
  | "numeric"
  | "multiple_choice"
  | "short_text"
  | "creative"
  | "open";

export type Strength =
  | "needs_practice"
  | "on_track"
  | "strong"
  | "very_strong";

export type Grading = "objective" | "subjective" | "creative";

export interface Question {
  type: QType;
  topic: string;
  skill: string;
  difficulty: number;
  prompt: string;
  options: string[];
  answer: string;
  acceptable: string[];
  tolerance: number;
  hint: string;
  solution: string;
  source: "ai" | "fallback";
  // French activities: the exact French text to speak (never the English prompt),
  // the language to speak it in, and whether to hide the French (listen-first).
  audioText?: string;
  audioLanguage?: string;
  displayText?: string;
  listening?: boolean;
}

// The full child profile row (Supabase `profiles` table).
export interface Profile {
  id: string;
  owner: string;
  name: string;
  age: number;
  year: string;
  interests: string[];
  avatar: string;
  strengths: Record<string, Strength>;
  ability: Record<string, number>;
  enabled_subjects: string[];
  created_at?: string;
  last_active?: string;
}

// The compact shape the AI prompt builders need.
export interface ChildProfile {
  name: string;
  age: number | string;
  year: string;
  interests_text: string;
  strengths: Record<string, Strength>;
}

export interface Attempt {
  id: string;
  profile_id: string;
  session_id: string | null;
  subject: string;
  topic: string;
  skill: string;
  difficulty: number;
  qtype: string;
  prompt: string;
  correct_answer: string;
  user_answer: string;
  verdict: Verdict;
  time_taken: number;
  resolved: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  profile_id: string;
  day: string;
  subjects: string[];
  earned_minutes: number;
  minutes_used: number;
  completed: boolean;
  created_at?: string;
  bonus_minutes?: number;
}

export interface GradeResult {
  verdict: Verdict;
  feedback: string;
  correction: string;
  tip: string;
}

export interface ArtResult {
  praise: string;
  noticed: string;
  idea: string;
}

// Non-secret settings sent to the browser. The API key itself is never sent.
export interface SafeSettings {
  provider: Provider;
  model: string;
  hasKey: boolean;
  videoUrls: string[];
  playlistId: string;
  pinSet: boolean;
  rewardDailyCap: number;
  rewardPerCorrect: number;
}
