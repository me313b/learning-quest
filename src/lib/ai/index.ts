// The intelligence layer. Talks to either Anthropic or OpenAI over plain HTTP
// (no SDK dependency, so it runs anywhere). Turns a family's key into:
//   generateQuestion / gradeAnswer / gradeArt / progressReport / validateKey.
//
// Question and grading calls request STRICT JSON and are parsed defensively,
// because models occasionally wrap JSON in prose or code fences.

import type {
  ArtResult,
  ChildProfile,
  GradeResult,
  Provider,
  Question,
} from "../types";
import {
  ART_SYSTEM,
  FRENCH_BUILDER_SYSTEM,
  FRENCH_CONVO_SYSTEM,
  FRENCH_SENTENCE_SYSTEM,
  GRADE_SYSTEM,
  LAB_HTML_SYSTEM,
  LAB_SYSTEM,
  QGEN_SYSTEM,
  READING_SYSTEM,
  REPORT_SYSTEM,
  WORKSHEET_MARK_SYSTEM,
  type WorksheetMarkItem,
  buildArtUser,
  buildFrenchBuilderUser,
  buildFrenchConvoUser,
  buildFrenchSentenceUser,
  buildGradeUser,
  buildLabHtmlUser,
  buildLabUser,
  buildQuestionUser,
  buildReadingUser,
  buildReportUser,
  buildWorksheetMarkUser,
} from "./prompts";
import type { LabInstance, PredictSpec } from "../labs";

export const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
};

export function resolveModel(provider: Provider, model?: string): string {
  return (model || "").trim() || DEFAULT_MODELS[provider] || "";
}

interface ChatOpts {
  maxTokens?: number;
  imageB64?: string;
  imageMedia?: string;
}

/** Single-turn chat. Returns assistant text. Throws on a hard failure. */
export async function chat(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  system: string,
  user: string,
  opts: ChatOpts = {},
): Promise<string> {
  const m = resolveModel(provider, model);
  const maxTokens = opts.maxTokens ?? 1100;

  if (provider === "anthropic") {
    const content: unknown[] = [];
    if (opts.imageB64) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: opts.imageMedia || "image/png",
          data: opts.imageB64,
        },
      });
    }
    content.push({ type: "text", text: user });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: m,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content }],
      }),
    });
    if (!res.ok) throw new Error(await errText(res));
    const data = await res.json();
    return (data.content || [])
      .filter((b: { type?: string }) => b.type === "text")
      .map((b: { text?: string }) => b.text || "")
      .join("");
  }

  if (provider === "openai") {
    const userContent: unknown[] = [{ type: "text", text: user }];
    if (opts.imageB64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${opts.imageMedia || "image/png"};base64,${opts.imageB64}`,
        },
      });
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: m,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      }),
    });
    if (!res.ok) throw new Error(await errText(res));
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error(`Unknown provider: ${provider}`);
}

async function errText(res: Response): Promise<string> {
  let body = "";
  try {
    body = await res.text();
  } catch {
    /* ignore */
  }
  return `HTTP ${res.status}: ${body.slice(0, 300)}`;
}

export function friendlyError(msg: string): string {
  const low = msg.toLowerCase();
  if (low.includes("authentication") || low.includes("api key") || low.includes("401"))
    return "The API key was rejected. Check it was pasted correctly.";
  if (low.includes("model") && (low.includes("not found") || low.includes("does not exist")))
    return "That model name isn't available on this key. Try another model.";
  if (low.includes("rate") || low.includes("429"))
    return "Rate limit hit. Wait a moment and try again.";
  if (low.includes("quota") || low.includes("billing") || low.includes("credit"))
    return "The account is out of credit/quota for this API key.";
  return `Couldn't reach the AI: ${msg.slice(0, 160)}`;
}

function widestBraces(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return null;
}

export function extractJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, "").trim();
  t = t.replace(/```$/i, "").trim();
  for (const candidate of [t, widestBraces(t)]) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      /* try next */
    }
  }
  return null;
}

// --------------------------------------------------------------------------- //
// Validate a key
// --------------------------------------------------------------------------- //
export async function validateKey(
  provider: Provider,
  apiKey: string,
  model?: string,
): Promise<{ ok: boolean; message: string }> {
  if (!apiKey) return { ok: false, message: "No API key provided." };
  try {
    const out = await chat(
      provider,
      apiKey,
      model,
      "Reply with exactly the word: OK",
      "Say OK.",
      { maxTokens: 8 },
    );
    if (out.toLowerCase().includes("ok")) {
      return { ok: true, message: `Connected to ${resolveModel(provider, model)}.` };
    }
    return { ok: true, message: `Connected, model replied: ${out.slice(0, 60)}` };
  } catch (e) {
    return { ok: false, message: friendlyError(String((e as Error).message)) };
  }
}

// --------------------------------------------------------------------------- //
// Question generation
// --------------------------------------------------------------------------- //
function parseQuestion(raw: string, subject: string, difficulty: number): Question | null {
  const data = extractJson(raw);
  if (!data || !("prompt" in data)) return null;
  const d = data as Record<string, unknown>;
  const q: Question = {
    type: (d.type as Question["type"]) || "short_text",
    topic: (d.topic as string) || subject,
    skill: (d.skill as string) || subject,
    difficulty: Number(d.difficulty ?? Math.round(difficulty)),
    prompt: String(d.prompt || ""),
    options: Array.isArray(d.options) ? (d.options as string[]).map(String) : [],
    answer: d.answer == null ? "" : String(d.answer),
    acceptable: Array.isArray(d.acceptable) ? (d.acceptable as string[]).map(String) : [],
    tolerance: Number(d.tolerance ?? 0),
    hint: (d.hint as string) || "",
    solution: (d.solution as string) || "",
    source: "ai",
    audioText: typeof d.audioText === "string" ? d.audioText : undefined,
    audioLanguage: typeof d.audioLanguage === "string" ? d.audioLanguage : undefined,
    displayText: typeof d.displayText === "string" ? d.displayText : undefined,
    listening: Boolean(d.listening),
  };
  return validateQuestion(q) ? q : null;
}

/** A question is usable only if it's well-formed for its type. Guards against the
 *  occasional malformed model response so the child never sees a broken question. */
function validateQuestion(q: Question): boolean {
  if (!q.prompt || q.prompt.trim().length < 3) return false;
  if (q.type === "multiple_choice") {
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
    if (!q.answer || !q.options.includes(q.answer)) return false;
  }
  // Numeric questions must carry an answer; open writing may legitimately have none.
  if (q.type === "numeric" && q.answer.trim() === "") return false;
  return true;
}

export async function generateQuestion(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  subject: string,
  profile: ChildProfile,
  difficulty: number,
  recentTopics: string[] = [],
  targetSkills: string[] = [],
  coveredThisWeek: string[] = [],
  language: "en" | "fr" = "en",
  reasoning = false,
): Promise<Question | null> {
  const user = buildQuestionUser(
    subject,
    profile,
    difficulty,
    recentTopics,
    targetSkills,
    coveredThisWeek,
    language,
    reasoning,
  );
  // Try twice: models occasionally return malformed JSON or a question that
  // doesn't fit its type. One retry fixes nearly all of these; if both fail the
  // caller falls back to the offline question bank.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chat(provider, apiKey, model, QGEN_SYSTEM, user, { maxTokens: 900 });
      const q = parseQuestion(raw, subject, difficulty);
      if (q) return q;
    } catch {
      /* try again */
    }
  }
  return null;
}

// --------------------------------------------------------------------------- //
// Grade open answers (reading sentences, French writing)
// --------------------------------------------------------------------------- //
export async function gradeAnswer(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  subject: string,
  question: Question,
  userAnswer: string,
  profile: ChildProfile,
): Promise<GradeResult> {
  let data: Record<string, unknown> | null = null;
  try {
    const raw = await chat(
      provider,
      apiKey,
      model,
      GRADE_SYSTEM,
      buildGradeUser(subject, question, userAnswer, profile),
      { maxTokens: 400 },
    );
    data = extractJson(raw);
  } catch {
    data = null;
  }
  const d = data || {};
  return {
    verdict: (d.verdict as GradeResult["verdict"]) || "partial",
    feedback: (d.feedback as string) || "Nice try! Let's look at it together.",
    correction: (d.correction as string) || "",
    tip: (d.tip as string) || "",
  };
}

// --------------------------------------------------------------------------- //
// Art feedback (vision)
// --------------------------------------------------------------------------- //
export async function gradeArt(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  imageB64: string,
  mediaType: string,
  profile: ChildProfile,
): Promise<ArtResult> {
  let data: Record<string, unknown> | null = null;
  try {
    const raw = await chat(provider, apiKey, model, ART_SYSTEM, buildArtUser(profile), {
      maxTokens: 300,
      imageB64,
      imageMedia: mediaType,
    });
    data = extractJson(raw);
  } catch {
    data = null;
  }
  const d = data || {};
  return {
    praise: (d.praise as string) || "Wow, what a brilliant drawing! 🎨",
    noticed: (d.noticed as string) || "I love the effort you put into this.",
    idea: (d.idea as string) || "Try adding a background next time!",
  };
}

// --------------------------------------------------------------------------- //
// Parent progress report
// --------------------------------------------------------------------------- //
export async function progressReport(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  profile: ChildProfile,
  statsText: string,
): Promise<string> {
  try {
    const out = await chat(
      provider,
      apiKey,
      model,
      REPORT_SYSTEM,
      buildReportUser(profile, statsText),
      { maxTokens: 700 },
    );
    return out.trim();
  } catch (e) {
    return `_Couldn't generate the AI summary right now: ${friendlyError(
      String((e as Error).message),
    )}_`;
  }
}

// --------------------------------------------------------------------------- //
// Mark a scanned paper worksheet (vision)
// --------------------------------------------------------------------------- //
export interface WorksheetMarkResult {
  n: number;
  verdict: "correct" | "partial" | "incorrect";
  child_answer: string;
}

export async function gradeWorksheet(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  items: WorksheetMarkItem[],
  imageB64: string,
  mediaType: string,
): Promise<WorksheetMarkResult[]> {
  let data: Record<string, unknown> | null = null;
  try {
    const raw = await chat(
      provider,
      apiKey,
      model,
      WORKSHEET_MARK_SYSTEM,
      buildWorksheetMarkUser(items),
      { maxTokens: 1200, imageB64, imageMedia: mediaType },
    );
    data = extractJson(raw);
  } catch {
    data = null;
  }
  const arr = (data?.results as unknown[]) || [];
  const out: WorksheetMarkResult[] = [];
  for (const row of arr) {
    const r = row as Record<string, unknown>;
    const n = Number(r.n);
    if (!Number.isFinite(n)) continue;
    const v = String(r.verdict || "incorrect");
    out.push({
      n,
      verdict: v === "correct" || v === "partial" ? (v as "correct" | "partial") : "incorrect",
      child_answer: r.child_answer == null ? "" : String(r.child_answer),
    });
  }
  return out;
}

// --------------------------------------------------------------------------- //
// Generate fresh framing for an interactive lab
// --------------------------------------------------------------------------- //
export async function generateLab(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  subject: string,
  templates: Record<string, string>,
  recent: string[] = [],
): Promise<LabInstance | null> {
  let raw: string;
  try {
    raw = await chat(provider, apiKey, model, LAB_SYSTEM, buildLabUser(subject, templates, recent), {
      maxTokens: 500,
    });
  } catch {
    return null;
  }
  const data = extractJson(raw);
  if (!data) return null;

  const template = String(data.template || "");
  const allowed = Object.keys(templates);
  if (!allowed.includes(template)) return null;

  let predict: PredictSpec | undefined;
  const p = data.predict as Record<string, unknown> | undefined;
  if (p && Array.isArray(p.options) && p.options.length >= 2) {
    const options = (p.options as unknown[]).map((o) => String(o)).slice(0, 4);
    let answer = Number(p.answer ?? 0);
    if (!Number.isFinite(answer) || answer < 0 || answer >= options.length) answer = 0;
    predict = {
      question: String(p.question || ""),
      options,
      answer,
      reveal: String(p.reveal || ""),
    };
  }

  return {
    subject,
    template,
    title: String(data.title || "Experiment"),
    intro: String(data.intro || ""),
    predict,
    fact: data.fact ? String(data.fact) : undefined,
  };
}

// --------------------------------------------------------------------------- //
// Generate a complete interactive experiment (HTML/CSS/JS for a sandbox)
// --------------------------------------------------------------------------- //
function stripCodeFences(text: string): string {
  let t = (text || "").trim();
  // Remove a leading ```html / ``` and a trailing ```
  t = t.replace(/^```[a-zA-Z]*\s*/, "");
  t = t.replace(/\s*```$/, "");
  return t.trim();
}

export async function generateLabHtml(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  subject: string,
  concept: string,
): Promise<string | null> {
  try {
    const out = await chat(
      provider,
      apiKey,
      model,
      LAB_HTML_SYSTEM,
      buildLabHtmlUser(subject, concept),
      { maxTokens: 4000 },
    );
    const html = stripCodeFences(out);
    if (!html || html.length < 40) return null;
    return html;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------- //
// Voice: high-quality text-to-speech and speech-to-text (OpenAI only)
// --------------------------------------------------------------------------- //
// Anthropic has no audio model, so these only run with an OpenAI key; callers
// fall back to the browser voice otherwise.

export async function textToSpeech(
  provider: Provider,
  apiKey: string,
  text: string,
  voice = "coral",
  speed = 1,
  instructions = "",
): Promise<string | null> {
  if (provider !== "openai" || !apiKey) return null;
  const input = text.slice(0, 900);
  const url = "https://api.openai.com/v1/audio/speech";
  const headers = { "content-type": "application/json", authorization: `Bearer ${apiKey}` };

  // 1) Newer steerable model: lets us ask for a cheerful, friendly tone and use
  //    the brighter voices (coral/shimmer). Pacing is described in instructions.
  try {
    const body: Record<string, unknown> = {
      model: "gpt-4o-mini-tts",
      voice,
      input,
      response_format: "mp3",
    };
    if (instructions) body.instructions = instructions;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return Buffer.from(buf).toString("base64");
    }
  } catch {
    /* fall through to the classic model */
  }

  // 2) Fallback to the classic model (always available). It only supports the
  //    original six voices, so map the brighter ones to a close match.
  const classicVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  const classicVoice = classicVoices.includes(voice) ? voice : "nova";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "tts-1",
        voice: classicVoice,
        input,
        response_format: "mp3",
        speed: Math.max(0.5, Math.min(1.5, speed)),
      }),
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  } catch {
    return null;
  }
}

export async function transcribeAudio(
  provider: Provider,
  apiKey: string,
  audioB64: string,
  mime = "audio/webm",
  language = "",
  prompt = "",
): Promise<string | null> {
  if (provider !== "openai" || !apiKey) return null;
  const bytes = Buffer.from(audioB64, "base64");
  const url = "https://api.openai.com/v1/audio/transcriptions";
  const headers = { authorization: `Bearer ${apiKey}` };
  // Try the newer, more accurate transcription model first — it handles young
  // and accented voices much better — then fall back to whisper-1. The `prompt`
  // biases recognition toward the words we expect (e.g. the target phrase), so
  // a child's halting French is far less likely to be mis-heard.
  for (const model of ["gpt-4o-mini-transcribe", "whisper-1"]) {
    try {
      const form = new FormData();
      form.append("file", new Blob([bytes], { type: mime }), "audio.webm");
      form.append("model", model);
      form.append("response_format", "json");
      if (language) form.append("language", language);
      if (prompt) form.append("prompt", prompt.slice(0, 800));
      const res = await fetch(url, { method: "POST", headers, body: form });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.text === "string") return data.text;
      }
    } catch {
      /* try the next model */
    }
  }
  return null;
}

// --------------------------------------------------------------------------- //
// French reading comprehension story
// --------------------------------------------------------------------------- //
export interface ReadingStory {
  title_fr: string;
  story_fr: string;
  story_en: string;
  questions: { q: string; options: string[]; answer: string }[];
  summary_prompt: string;
  speak?: {
    question_fr: string;
    question_en: string;
    answer_fr: string;
    answer_en: string;
  };
  glossary?: { fr: string; en: string; hint: string }[];
  gloss?: { fr: string; en: string }[];
}

export async function generateReading(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  theme = "",
  level = 2,
): Promise<ReadingStory | null> {
  const user = buildReadingUser(theme, level);
  // Retry once on a malformed response before giving up.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chat(provider, apiKey, model, READING_SYSTEM, user, { maxTokens: 1600 });
      const story = parseReading(raw);
      if (story) return story;
    } catch {
      /* try again */
    }
  }
  return null;
}

function parseReading(raw: string): ReadingStory | null {
  const data = extractJson(raw);
  if (!data) return null;
  const story = data as unknown as ReadingStory;
  if (!story.story_fr || !Array.isArray(story.questions)) return null;
  // Keep only well-formed questions.
  story.questions = (story.questions || [])
    .filter((q) => q && q.q && Array.isArray(q.options) && q.options.length >= 2 && q.answer)
    .slice(0, 3);
  // Drop the speaking question unless it's complete.
  if (
    !story.speak ||
    !story.speak.question_fr ||
    !story.speak.answer_fr ||
    !story.speak.question_en ||
    !story.speak.answer_en
  ) {
    delete story.speak;
  }
  // Keep only well-formed glossary entries (key words → meaning + hint).
  if (Array.isArray(story.glossary)) {
    story.glossary = story.glossary
      .filter((g) => g && g.fr && g.en)
      .map((g) => ({ fr: String(g.fr), en: String(g.en), hint: String(g.hint || "") }))
      .slice(0, 6);
    if (story.glossary.length === 0) delete story.glossary;
  } else {
    delete story.glossary;
  }
  // Per-word gloss so the child can tap any word in the story for its meaning.
  if (Array.isArray(story.gloss)) {
    story.gloss = story.gloss
      .filter((g) => g && g.fr && g.en)
      .map((g) => ({ fr: String(g.fr), en: String(g.en) }))
      .slice(0, 40);
    if (story.gloss.length === 0) delete story.gloss;
  } else {
    delete story.gloss;
  }
  return story;
}

// --------------------------------------------------------------------------- //
// French speaking lab generators. Each requests strict JSON, retries once, and
// returns null on failure so the caller can fall back to a built-in bank.
// --------------------------------------------------------------------------- //
import type { FrenchBuilder, FrenchConvoReply, FrenchSentence } from "../types";

export async function generateFrenchSentence(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  level = 1,
  recent: string[] = [],
): Promise<FrenchSentence | null> {
  const user = buildFrenchSentenceUser(level, recent);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chat(provider, apiKey, model, FRENCH_SENTENCE_SYSTEM, user, { maxTokens: 400 });
      const data = extractJson(raw);
      if (data && typeof data.fr === "string" && (data.fr as string).trim()) {
        const fr = (data.fr as string).trim();
        const en = typeof data.en === "string" ? (data.en as string).trim() : "";
        const words = Array.isArray(data.words)
          ? (data.words as { fr?: string; en?: string }[])
              .filter((w) => w && w.fr)
              .map((w) => ({ fr: String(w.fr).toLowerCase(), en: String(w.en || "") }))
          : [];
        return { fr, en, words };
      }
    } catch {
      /* retry */
    }
  }
  return null;
}

export async function frenchConversationReply(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  scenario: string,
  setting: string,
  history: { who: "ai" | "child"; fr: string }[],
  kidSaid: string,
  struggled: boolean,
): Promise<FrenchConvoReply | null> {
  const user = buildFrenchConvoUser(scenario, setting, history, kidSaid, struggled);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chat(provider, apiKey, model, FRENCH_CONVO_SYSTEM, user, { maxTokens: 300 });
      const data = extractJson(raw);
      if (data && typeof data.fr === "string" && (data.fr as string).trim()) {
        return {
          fr: (data.fr as string).trim(),
          en: typeof data.en === "string" ? (data.en as string).trim() : "",
          hint_en: typeof data.hint_en === "string" ? (data.hint_en as string).trim() : "",
          done: Boolean(data.done),
        };
      }
    } catch {
      /* retry */
    }
  }
  return null;
}

export async function generateFrenchBuilder(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  topic = "",
  level = 2,
): Promise<FrenchBuilder | null> {
  const user = buildFrenchBuilderUser(topic, level);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chat(provider, apiKey, model, FRENCH_BUILDER_SYSTEM, user, { maxTokens: 400 });
      const data = extractJson(raw);
      if (data && typeof data.target_fr === "string" && Array.isArray(data.tiles)) {
        const tiles = (data.tiles as unknown[]).map((t) => String(t)).filter(Boolean);
        if (tiles.length < 2) continue;
        return {
          target_fr: (data.target_fr as string).trim(),
          target_en: typeof data.target_en === "string" ? (data.target_en as string).trim() : "",
          tiles,
          distractors: Array.isArray(data.distractors)
            ? (data.distractors as unknown[]).map((t) => String(t)).filter(Boolean)
            : [],
          hint_en: typeof data.hint_en === "string" ? (data.hint_en as string).trim() : "",
        };
      }
    } catch {
      /* retry */
    }
  }
  return null;
}

// --------------------------------------------------------------------------- //
// Infinite French scenarios (places) and picture items. Both return null on
// failure so callers fall back to the built-in banks.
// --------------------------------------------------------------------------- //
import type { FrenchPicture, FrenchScenario } from "../types";
import {
  FRENCH_SCENARIO_SYSTEM,
  buildFrenchScenarioUser,
  FRENCH_PICTURE_SYSTEM,
  buildFrenchPictureUser,
} from "./prompts";

export async function generateFrenchScenario(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  recent: string[] = [],
): Promise<FrenchScenario | null> {
  const user = buildFrenchScenarioUser(recent);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chat(provider, apiKey, model, FRENCH_SCENARIO_SYSTEM, user, { maxTokens: 400 });
      const data = extractJson(raw);
      const opener = data?.opener as { fr?: string; en?: string; hint_en?: string } | undefined;
      if (data && typeof data.label === "string" && opener && opener.fr) {
        return {
          label: String(data.label).trim(),
          emoji: typeof data.emoji === "string" ? data.emoji : "📍",
          character: typeof data.character === "string" ? data.character : "🧑",
          scene: Array.isArray(data.scene) ? (data.scene as unknown[]).map((s) => String(s)).slice(0, 5) : [],
          setting: typeof data.setting === "string" ? data.setting : "",
          opener: {
            fr: String(opener.fr).trim(),
            en: typeof opener.en === "string" ? opener.en : "",
            hint_en: typeof opener.hint_en === "string" ? opener.hint_en : "",
          },
        };
      }
    } catch {
      /* retry */
    }
  }
  return null;
}

export async function generateFrenchPictures(
  provider: Provider,
  apiKey: string,
  model: string | undefined,
  count = 8,
  recent: string[] = [],
): Promise<FrenchPicture[] | null> {
  const user = buildFrenchPictureUser(count, recent);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chat(provider, apiKey, model, FRENCH_PICTURE_SYSTEM, user, { maxTokens: 700 });
      const data = extractJson(raw);
      const items = data?.items as unknown[] | undefined;
      if (Array.isArray(items)) {
        const out: FrenchPicture[] = [];
        for (const it of items) {
          const o = it as { emoji?: string; fr?: string; en?: string; accept?: unknown };
          if (o && o.emoji && o.fr) {
            out.push({
              emoji: String(o.emoji),
              fr: String(o.fr).trim(),
              en: typeof o.en === "string" ? o.en : "",
              accept: Array.isArray(o.accept)
                ? (o.accept as unknown[]).map((a) => String(a).toLowerCase())
                : [String(o.fr).toLowerCase()],
            });
          }
        }
        if (out.length > 0) return out;
      }
    } catch {
      /* retry */
    }
  }
  return null;
}
