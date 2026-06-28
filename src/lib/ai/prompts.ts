// Prompt builders for the AI layer. Kept separate from the transport so the
// wording is easy to tune. The goals: short, rigorous questions that rotate
// across real skill areas; themes that only *sometimes* nod to the child's
// interests; kind-but-honest marking; and a genuinely specific parent note.

import { DIFFICULTY_BANDS, SKILL_AREAS, SUBJECTS } from "../config";
import type { ChildProfile, Question } from "../types";

export const QGEN_SYSTEM =
  "You are a world-class tutor and competition-question designer for bright young " +
  "children. You write ONE genuinely SMART question at a time that makes the child " +
  "really THINK — never rote recall or busywork. Favour clever little puzzles, " +
  "multi-step reasoning, number patterns and 'what comes next', logical deduction, " +
  "comparisons, spotting a relationship, working backwards, and problems with a small " +
  "twist or 'aha' moment, pitched precisely to the band requested. Avoid bare facts, " +
  "plain sums like '4 times 5', and predictable, formulaic templates — vary the SHAPE " +
  "of the reasoning, not just the numbers. Keep the LANGUAGE simple and easy for a 6-7 " +
  "year old to read, but make the THINKING a real, satisfying challenge. A question may " +
  "be one to three short sentences and can set a tiny scenario when that makes the " +
  "problem richer, but never a long story. Vary the context; do not theme every question " +
  "around the same thing. You output STRICT JSON and nothing else: no prose, no code fences.";

export function buildQuestionUser(
  subject: string,
  profile: ChildProfile,
  difficulty: number,
  recentTopics: string[],
  targetSkills: string[],
  coveredThisWeek: string[] = [],
  language: "en" | "fr" = "en",
  reasoning = false,
  avoid: string[] = [],
  worksheet = false,
  frenchTask = "",
): string {
  const meta = SUBJECTS[subject];
  const band = DIFFICULTY_BANDS[Math.round(difficulty)] ?? "";
  const recent = recentTopics.length ? recentTopics.join(", ") : "none yet";
  const focus = targetSkills.filter(Boolean).join(", ");
  const areas = (SKILL_AREAS[subject] || []).join(", ");
  const covered = coveredThisWeek.filter(Boolean);
  const likes = (profile.interests_text || "").trim();

  const typeRules: Record<string, string> = {
    objective: '"type" must be "numeric" or "multiple_choice".',
    subjective:
      '"type" must be "short_text" (the child writes a word, phrase or short ' +
      "sentence). For French you may ask for a translation, a word's meaning, " +
      "or to write a tiny sentence.",
    creative: '"type" must be "creative" (the child draws and uploads a photo).',
  };

  const focusLine = focus
    ? `The child recently got these WRONG: ${focus}. You MAY revisit ONE of them, but keep it at the ` +
      "requested band (do NOT make it easier) — just approach it from a fresh angle."
    : `Choose a skill area they have NOT seen recently. Areas to rotate through: ${areas}.`;

  const coverageLine = covered.length
    ? `Already practised THIS WEEK: ${covered.join(", ")}. Prefer a skill area NOT in that ` +
      "list so the week covers a good spread (you may still revisit a weak skill above)."
    : "";

  // Theme: lean into a friendly Minecraft world (the child loves it), kept gentle
  // and non-violent, while still varying the maths/skill underneath.
  const otherThemes =
    "space and planets, dinosaurs, wild animals and the ocean, football and sports, superheroes, " +
    "pirates and treasure, cooking and food, nature and the seasons, building and machines, magic and " +
    "dragons, cars and rockets, and everyday real-life situations (shops, parties, journeys, pocket money)";
  const themeLine = likes
    ? "THEMING: keep it varied. Only about ONE question in THREE should have a friendly Minecraft " +
      "flavour (mining diamonds/emeralds, building with blocks, planting wheat, taming animals, " +
      "filling chests, crafting tools, counting sheep/pigs/cows, trading with villagers — gentle and " +
      "fun, no fighting or scary content). For the OTHER two in three, use a DIFFERENT, fresh context " +
      `each time from a wide range such as ${otherThemes}. Also weave in what they like (${likes}). ` +
      "Never theme several questions in a row around the same thing."
    : "THEMING: keep it varied. Only about ONE question in THREE should have a friendly Minecraft " +
      "flavour (mining diamonds/emeralds, building with blocks, planting wheat, taming animals, " +
      "filling chests, crafting tools, counting sheep/pigs/cows, trading with villagers — gentle and " +
      "fun, no fighting or scary content). For the OTHER two in three, use a DIFFERENT, fresh context " +
      `each time from a wide range such as ${otherThemes}. Never theme several questions in a row ` +
      "around the same thing.";

  const reasoningRule =
    '"type" must be "short_text". Make it a REASONING question: ask the child to explain their ' +
    'thinking, say WHY, or describe HOW they would work it out, in a short sentence (e.g. "Why ' +
    'do you think...", "How would you...", "Explain how you know..."). It must need a written ' +
    "explanation, not just a number. Mark generously: accept any answer showing sensible reasoning.";

  // Reading & Writing deserves genuinely meaningful tasks, not "write a sentence
  // with a capital letter and a full stop". Lead with real comprehension and
  // inference, and rotate vocabulary and substantive writing, scaled to level.
  const readingRule =
    '"type" must be "short_text". Make it a GENUINELY useful literacy task for a strong young reader. ' +
    "VERY OFTEN (at least half the time) include a short passage to read INSIDE the prompt (1-3 " +
    "sentences, longer and richer at higher levels) and then ask a COMPREHENSION or INFERENCE " +
    "question about it: how a character feels and WHY, what might happen next, the main idea, or " +
    "what a word means in context. Otherwise rotate: a vocabulary task (synonym, antonym, or use a " +
    "word in a sentence), a punctuation/grammar-in-context fix, or a substantive WRITING prompt that " +
    "needs a real idea (describe, explain, persuade, or continue a tiny story). Avoid trivial " +
    "copy-the-rule tasks. Mark on meaning and effort, not perfect spelling.";

  // Paper worksheet: everything multiple-choice (easy to mark), calculation-heavy
  // and genuinely hard for the band.
  const worksheetRule =
    '"type" MUST be "multiple_choice" with EXACTLY four options and ONE correct answer. Make the ' +
    "three wrong options plausible and tempting (the kinds of answers a child gets from a common " +
    "mistake). Make it CALCULATION-HEAVY and genuinely hard for the band — real multi-step working, " +
    "not a one-liner. For reading, include a short passage in the prompt and ask a comprehension or " +
    "inference question with four answer choices. Put the full question and all four options in the prompt-appropriate fields.";

  // French quest: ONE task type per question across the set, chosen by the caller
  // (frenchTask) — never "what does this word mean?" every time. The child answers
  // by typing or speaking; multiple choice is for the printed worksheet only.
  const frenchVocab =
    '"type" must be "short_text" and you MUST set "expectMulti": true. Give FIVE French words or very ' +
    "short phrases suitable for the band, numbered 1-5 in the prompt, and VARY the theme (animals, " +
    "colours, food, family, numbers, school, actions). Ask the child for the ENGLISH meaning of ALL " +
    'FIVE, written on one line separated by commas. Put the five English meanings in "answer" as a ' +
    'comma-separated list IN THE SAME ORDER as the words. Put ONLY the five French words in "audioText".';
  const frenchInterview =
    '"type" must be "short_text". Ask ONE friendly, real INTERVIEW question in simple French that the ' +
    "child answers in French — about their name, age, family, pets, or a favourite colour/food/animal, " +
    'or what they did today (e.g. "Comment t\'appelles-tu ?", "Quel est ton animal préféré ?"). Put the ' +
    'French question in "audioText". Give a short, natural model answer in French in "answer" as a guide ' +
    "only; any sensible French reply is acceptable.";
  const frenchSentence =
    '"type" must be "short_text". Ask the child to MAKE their own short French sentence — using a given ' +
    'French word, or about a small topic (e.g. "Fais une phrase avec le mot « chat ».", "Écris une ' +
    'phrase sur ta famille."). Put the French instruction in "audioText". Give a correct model sentence ' +
    'in "answer" as a guide only; any sensible, well-formed French sentence is acceptable.';
  const frenchTranslate =
    '"type" must be "short_text". Show a short ENGLISH sentence for the child to put INTO French (KEEP ' +
    'that sentence in English, e.g. "I am happy", "The cat is black", "I would like an apple"); the ' +
    'child produces the French. Put the French in "answer" with variants in "acceptable". Set ' +
    '"audioText" to "" so the answer is never spoken and English is never read aloud. Scale the ' +
    "sentence length with the band.";
  const frenchRule =
    frenchTask === "vocab"
      ? frenchVocab
      : frenchTask === "interview"
        ? frenchInterview
        : frenchTask === "sentence"
          ? frenchSentence
          : frenchTranslate;

  let formatRule: string;
  if (worksheet) formatRule = worksheetRule;
  else if (reasoning) formatRule = reasoningRule;
  else if (subject === "reading") formatRule = readingRule;
  else if (subject === "french") formatRule = frenchRule;
  else formatRule = typeRules[meta.grading];

  // Maths gets extra variety: series, patterns, logic and the occasional trick.
  const mathsExtra =
    subject === "maths"
      ? "\nMATHS VARIETY (important): do NOT keep using the same operation. If the recent questions above " +
        "were multiplication (or any one skill), pick something DIFFERENT this time. Rotate widely across " +
        "addition, subtraction, multiplication, division, fractions, money, time, measurement, place value, " +
        "and especially NUMBER SERIES and sequences ('what number comes next', find the rule — include these " +
        "often), patterns, and simple logic/reasoning puzzles. Use multi-step word problems frequently. About " +
        "one question in four should be a TRICK question that looks simple but has a catch or targets a common " +
        "misconception. At higher bands use bigger numbers AND cleverer, olympiad-style problems that need an " +
        "insight, not just larger sums."
      : "";

  const langLine =
    language === "fr"
      ? "LANGUAGE: this is French. Write the child-facing instruction in SIMPLE French. The ONLY " +
        "exception is a short SOURCE phrase the child must translate INTO French — keep that phrase " +
        "in English. NEVER write the French answer in the prompt. Keep the 'hint' and 'solution' " +
        "(for the grown-up) in English."
      : "LANGUAGE: write the question in clear, simple English.";

  const avoidList = avoid.filter(Boolean).slice(0, 24);
  const avoidLine = avoidList.length
    ? `\nDO NOT REPEAT: the child has recently been asked the questions below. Do NOT reuse or lightly ` +
      `reword any of them — make something clearly different (different numbers, context AND idea):\n- ` +
      avoidList.join("\n- ")
    : "";

  const frenchAudio =
    subject === "french"
      ? `
FRENCH (required for this subject):
- The child answers by TYPING or SPEAKING. Do NOT use multiple choice and leave "options" as [].
- "displayText": the child-facing question text. Write instructions in simple French; the ONLY exception is an English source phrase the child must translate INTO French, which stays in English. Set "prompt" equal to "displayText".
- "audioText": ONLY French that is safe to read aloud and is NEVER the answer and NEVER English. Use "" when there is no safe French to speak (e.g. a translate-into-French task).
- "audioLanguage": "fr-FR" when audioText has French, otherwise "".`
      : "";

  return `Create one ${meta.label} question.

CHILD: ${profile.name}, age ${profile.age}, school year ${profile.year}.
DIFFICULTY: level ${difficulty}/15 -> ${band}
${focusLine}
${coverageLine}
${themeLine}
${langLine}${frenchAudio}
Avoid these recently-used topics: ${recent}.${avoidLine}${mathsExtra}

CHALLENGE: aim HIGH for the band — a multi-step word problem, a two-step calculation, a comparison,
a pattern, or a "what comes next" with a twist, not a trivial one-liner. It should make a bright
child pause and think. Keep it fair for the level but do not dumb it down.
LENGTH: "prompt" can be one to three short sentences (a small scenario is good). Plain words.
FORMAT: ${formatRule}

Return JSON with EXACTLY these keys:
{
  "type": "...",
  "topic": "short topic name (e.g. 'subtraction', 'colours')",
  "skill": "the specific skill area being tested, lower-case (use one of the areas above)",
  "difficulty": ${difficulty},
  "prompt": "the question, clear for the age",
  "displayText": "for French: the child-facing question text (French instruction; keep any to-translate source phrase in English). Otherwise the same as prompt",
  "audioText": "for French: ONLY French that is safe to read aloud (NEVER English, NEVER the answer); empty string if there is no safe French to speak. Otherwise empty string",
  "audioLanguage": "fr-FR when audioText is French, otherwise empty string",
  "listening": false,
  "expectMulti": false,
  "options": ["A","B","C","D"],
  "answer": "the single correct answer (option text, or the number, or '' for creative)",
  "acceptable": ["other acceptable answers if any"],
  "tolerance": 0,
  "hint": "a nudge that does NOT reveal the answer",
  "solution": "a short, clear, encouraging explanation (one or two lines)"
}
No multiple-choice option may be obviously silly. "options" must be [] unless the type is multiple_choice.`;
}

export const GRADE_SYSTEM =
  "You are a kind, encouraging tutor marking a very young child's answer. Be " +
  "generous about effort and gentle, but honest about correctness. Keep every " +
  "field short. You output STRICT JSON and nothing else.";

export function buildGradeUser(
  subject: string,
  question: Question,
  userAnswer: string,
  profile: ChildProfile,
): string {
  const meta = SUBJECTS[subject];
  const acc = (question.acceptable || []).filter(Boolean);
  const accLine = acc.length ? `\nALSO ACCEPTABLE: ${acc.join(" | ")}` : "";
  const frenchNote =
    subject === "french"
      ? "\nThis is French. Accept ANY correct French translation, including valid synonyms and the " +
        "gender or spelling a child might reasonably use; ignore missing accents and small spelling " +
        "or speech-to-text slips. Mark on MEANING, not perfection, and be encouraging."
      : "";
  return `Mark this ${meta.label} answer from a child age ${profile.age}.

QUESTION: ${question.prompt}
EXPECTED (guide, may be empty for open writing): ${question.answer}${accLine}
CHILD'S ANSWER: ${JSON.stringify(userAnswer)}${frenchNote}

Reply in JSON ONLY:
{
  "verdict": "correct" | "partial" | "incorrect",
  "feedback": "one warm sentence a 6-year-old understands",
  "correction": "the fixed or model answer, short",
  "tip": "one specific thing to remember next time"
}
'partial' is a good attempt with a small slip. Keep it brief and kind.`;
}

export const ART_SYSTEM =
  "You are a warm, fun art teacher cheering on a young child's drawing. Always " +
  "be positive and specific about what you can actually see. Reply in STRICT " +
  "JSON only.";

export function buildArtUser(profile: ChildProfile): string {
  const likes = (profile.interests_text || "").trim();
  const ctx = likes ? ` They like ${likes}.` : "";
  return (
    `A child age ${profile.age} drew this.${ctx} ` +
    'Reply in JSON: {"praise": "big cheerful reaction", ' +
    '"noticed": "one specific lovely detail you can actually see", ' +
    '"idea": "one gentle, fun idea to try next time"}'
  );
}

export const REPORT_SYSTEM =
  "You are an experienced, warm primary-school tutor writing a progress note to " +
  "a parent. Be SPECIFIC and PRACTICAL, never generic. Name the exact skill " +
  "areas to work on and give concrete, doable home activities with a tiny " +
  "example for each. Use plain British English, short paragraphs, and a few " +
  "clearly-labelled bullet points. No waffle, no inventing data.";

export function buildReportUser(
  profile: ChildProfile,
  statsText: string,
): string {
  return `Write a progress note for the parent of ${profile.name} (age ${profile.age}, year ${profile.year}).

Here is the data from their practice (accuracy, the difficulty they reach, and which specific skills they are strong or weak on):
${statsText}

Structure it EXACTLY like this, using the real data above:

**The big picture** — 2–3 sentences: are they ahead/on-track, working hard, where is the momentum.

**Going well** — 2–3 bullets naming specific skills they're strong on.

**Focus next** — for EACH subject that needs work, one bullet that names the exact skill area (e.g. "Maths — subtraction across ten") AND a concrete 5-minute home activity with a tiny worked example (e.g. "count back from 23 to 17 on fingers"). Be specific to the data; do not give the same advice for every subject.

**This week, try** — one or two small, realistic things to do at home.

Keep it warm, honest and brief. If there isn't enough data on a subject yet, say so plainly rather than guessing.`;
}

// --------------------------------------------------------------------------- //
// Marking a scanned paper worksheet (vision)
// --------------------------------------------------------------------------- //
export const WORKSHEET_MARK_SYSTEM =
  "You are a kind teacher marking a photo of a child's completed paper " +
  "worksheet. Read the child's handwritten answers from the image and compare " +
  "each to the expected answer. Be gentle but honest. You output STRICT JSON " +
  "and nothing else.";

export interface WorksheetMarkItem {
  n: number;
  prompt: string;
  expected: string;
  type: string;
  options?: string[];
}

export function buildWorksheetMarkUser(items: WorksheetMarkItem[]): string {
  const lines = items
    .map((it) => {
      const opts = it.options && it.options.length ? ` Options: ${it.options.join(" / ")}.` : "";
      return `${it.n}. ${it.prompt}${opts} (expected: ${it.expected || "open answer"})`;
    })
    .join("\n");

  return `Here is a photo of a child's completed worksheet. The questions, in order, are:

${lines}

Read the child's answer for EACH numbered question from the photo. If a question's answer is blank or unreadable, mark it "incorrect" and set child_answer to "".

Reply with JSON ONLY in this exact shape:
{
  "results": [
    { "n": 1, "verdict": "correct" | "partial" | "incorrect", "child_answer": "what they wrote" }
  ]
}
Include one entry per question, in order. 'partial' means close with a small slip.`;
}

// --------------------------------------------------------------------------- //
// Interactive "lab" framing
// --------------------------------------------------------------------------- //
export const LAB_SYSTEM =
  "You design tiny, playful science and learning experiments for a child aged " +
  "6 to 7. You do NOT write code. You pick ONE of the interactive templates " +
  "offered and write fresh, short, fun framing for it: a new everyday scenario, " +
  "a one-line intro, a quick prediction question, and a fun fact. Keep all text " +
  "very short and simple. You output STRICT JSON and nothing else.";

export function buildLabUser(
  subject: string,
  templates: Record<string, string>,
  recent: string[],
): string {
  const menu = Object.entries(templates)
    .map(([k, desc]) => `- ${k}: ${desc}`)
    .join("\n");
  const avoid = recent.length ? recent.join(", ") : "none yet";

  return `Design one ${subject} experiment for the child.

Choose ONE template from this list (and write framing that matches how it actually works):
${menu}

Prefer a template the child has not seen recently. Recently shown: ${avoid}.

Write a FRESH everyday scenario (playground, kitchen, park, sport, space, animals) and only sometimes a Minecraft one (about one time in three). Keep every piece of text short and simple for a 6-7 year old.

Return JSON with EXACTLY these keys:
{
  "template": "one of the template names above",
  "title": "a short, fun title (max 5 words)",
  "intro": "one short sentence explaining the idea in kid words",
  "predict": {
    "question": "a quick guess question they can test by playing",
    "options": ["three short options"],
    "answer": 0,
    "reveal": "one short sentence explaining the right answer"
  },
  "fact": "one short 'did you know' fact related to the experiment"
}
"answer" is the index (0, 1 or 2) of the correct option. The prediction must be answerable by playing with the chosen template.`;
}

// --------------------------------------------------------------------------- //
// Fully generated interactive experiment (rendered in a sandboxed iframe)
// --------------------------------------------------------------------------- //
export const LAB_HTML_SYSTEM =
  "You are a brilliant maker of tiny interactive learning toys for children " +
  "aged 6 to 7. You write ONE self-contained interactive experiment as a single " +
  "block of HTML + CSS + JavaScript (vanilla only, NO external libraries, NO " +
  "network requests). It must be visual, colourful, playful and genuinely " +
  "interactive (sliders, buttons, taps, drag, or an animated canvas/SVG). It " +
  "teaches the given idea by letting the child DO something and see what " +
  "happens. You output ONLY the markup, <style> and <script> — no markdown, no " +
  "code fences, no <html>/<head>/<body> tags, no explanation before or after.";

export function buildLabHtmlUser(subject: string, concept: string): string {
  return `Make one interactive experiment for a child aged 6-7.

SUBJECT: ${subject}
IDEA TO EXPLORE: ${concept}

Requirements:
- Self-contained: only inline HTML, <style> and <script>. No imports, no fetch, no external URLs, no images.
- Fits in a box about 440px tall and up to 640px wide. Use the full width. Avoid scrolling.
- Use a <canvas> (or rich animated SVG) with a smooth requestAnimationFrame animation loop as the centrepiece. Things should MOVE: falling, bouncing, swinging, flowing, growing — real motion, not a static bar that just resizes.
- Genuinely interactive: at least one control (slider/button/tap/drag) that visibly changes the animation in real time, plus a clear little goal or challenge ("Can you make the ball reach the flag?").
- Make it polished and alive: bright colours, smooth easing, particles or trails where it fits, a gentle bounce or glow on success. Aim for something a child says "wow" at, not a plain form.
- Child-friendly: big friendly text, very short words. A title at the top, one short instruction, and a short "what's happening" line that updates live as they play.
- You MAY use the Web Audio API for gentle, optional sound effects (a soft beep, pop or note on interaction/success). Keep it subtle and never autoplay loudly.
- Make each one feel DIFFERENT and surprising — vary the look, the controls and the scene. Never reuse a generic slider-and-coloured-bar layout.
- Theme: a light Minecraft / adventure flavour is welcome but not required.
- Style for a dark app: dark or transparent background, light text. Suggested colours: text #F4ECD8, accents #4AEDD9 (cyan), #7FB238 (green), #F8B617 (gold), #E03C28 (red).

Output ONLY the HTML/CSS/JS for the experiment.`;
}

// --------------------------------------------------------------------------- //
// French reading comprehension: a tiny story + listen + understand + answer
// --------------------------------------------------------------------------- //
export const READING_SYSTEM =
  "You write tiny, gentle French reading passages for a 6-7 year old who is just " +
  "starting to learn French. Vocabulary must be very basic and the grammar simple " +
  "(mostly present tense, short sentences). You output STRICT JSON and nothing else.";

// A spread of gentle themes so each new story feels different.
export const READING_THEMES = [
  "a cat and a dog who become friends",
  "a sunny trip to the park",
  "a birthday cake for grandma",
  "a little bird learning to fly",
  "a rainy day playing inside",
  "the walk to school",
  "a family dinner with soup",
  "building a snowman in winter",
  "a garden full of vegetables",
  "a day at the beach making castles",
  "a lost teddy bear that is found",
  "a busy market with lots of fruit",
  "playing football with friends",
  "a sleepy farm early in the morning",
  "a friendly fox in the forest",
  "a boat trip on the river",
  "a kitten who hides in a box",
  "baking bread with papa",
];

export function pickReadingTheme(): string {
  return READING_THEMES[Math.floor(Math.random() * READING_THEMES.length)];
}

export function buildReadingUser(theme = "", level = 2): string {
  const chosen = theme || pickReadingTheme();
  const lv = Math.max(1, Math.min(5, Math.round(level)));
  const levelLine =
    lv <= 1
      ? "LEVEL 1 (very beginner): 3 to 4 very short sentences. Only the most common words."
      : lv === 2
        ? "LEVEL 2 (beginner): about 5 short sentences with very common words."
        : lv === 3
          ? "LEVEL 3 (a bit harder): about 6 to 7 sentences. A few slightly less common words, still simple."
          : lv === 4
            ? "LEVEL 4 (growing): about 7 to 8 sentences with a little more variety and a simple connective (et, mais, parce que)."
            : "LEVEL 5 (confident beginner): about 8 sentences, a little richer vocabulary, still clear and age-appropriate.";

  return `Write a short French story for a 6-7 year old learning French. Start simple and build up like a kind teacher.

${levelLine}

Rules:
- Tell a little story with a clear beginning, middle and end. Keep each sentence short. Use mostly the present tense.
- Theme for this story: ${chosen}. Make it feel fresh and specific to this theme.
- Give a clear English translation of the whole paragraph.
- Write 3 comprehension questions IN ENGLISH that check the child understood the story. Each is multiple choice with 3 short options and the correct option text.
- Give one friendly "summary prompt" asking the child to say, in their own words, what the story was about.
- Add ONE speaking question the child answers OUT LOUD in French: a simple question about the story whose answer is a short French phrase or sentence (about 3 to 8 words) that a 6-7 year old can comfortably say. Provide the French question, its English translation, the expected French answer, and the English of that answer.
- Add a "glossary" of 4 to 6 KEY words or short phrases from the story that a young learner might not know. For each, give the French, its English meaning, and a gentle one-line hint that helps the child GUESS the meaning from the story (e.g. "You eat this for breakfast — can you guess?"). Do not simply repeat the English meaning in the hint.
- Add a "gloss": a word-by-word helper covering the MAIN content words used in the story (nouns, verbs, adjectives, numbers). For each, give the French word exactly as it appears (lowercase, no punctuation) and a short English meaning. Skip tiny grammar words like le, la, un, une, et, à. This lets the child tap any word to see what it means.

Return JSON with EXACTLY these keys:
{
  "title_fr": "short French title",
  "story_fr": "the story in French (one paragraph)",
  "story_en": "the English translation",
  "questions": [
    { "q": "an English comprehension question", "options": ["a","b","c"], "answer": "the correct option text" }
  ],
  "summary_prompt": "In your own words, what was the story about?",
  "speak": {
    "question_fr": "a simple French question about the story",
    "question_en": "the English translation of that question",
    "answer_fr": "the expected short French answer",
    "answer_en": "the English of that answer"
  },
  "glossary": [
    { "fr": "a key French word from the story", "en": "its English meaning", "hint": "a gentle clue to help the child guess" }
  ],
  "gloss": [
    { "fr": "chat", "en": "cat" }
  ]
}`;
}

// --------------------------------------------------------------------------- //
// French speaking lab: adaptive sentences, live conversations, sentence builder.
// All kept simple and warm for a 6-7 year old beginner.
// --------------------------------------------------------------------------- //

export const FRENCH_SENTENCE_SYSTEM =
  "You are a kind French teacher for a 6-7 year old beginner. You create short, " +
  "natural French phrases to say out loud. Always reply with ONLY valid JSON.";

export function buildFrenchSentenceUser(level = 1, recent: string[] = []): string {
  const lv = Math.max(1, Math.min(8, Math.round(level)));
  const lengths =
    lv <= 1
      ? "1 to 2 words"
      : lv <= 2
        ? "2 to 3 words"
        : lv <= 3
          ? "3 to 4 words"
          : lv <= 4
            ? "a short sentence of 4 to 5 words"
            : lv <= 5
              ? "a sentence of 5 to 6 words"
              : lv <= 6
                ? "a sentence of 6 to 7 words"
                : "a sentence of 7 to 9 words with a simple connective (et, mais, parce que)";
  const avoid = recent.length ? `\nDo NOT reuse these recent phrases: ${recent.slice(-12).join(" | ")}.` : "";
  return `Give ONE French phrase for the child to say out loud. Difficulty level ${lv} of 8.
Length: ${lengths}. Use the present tense and very common, child-friendly words (animals, food, family, colours, school, play, greetings, feelings).
Make it natural and fun to say. Avoid tongue-twisters.${avoid}

Return JSON with EXACTLY these keys:
{
  "fr": "the French phrase",
  "en": "its English meaning",
  "words": [ { "fr": "each French word lowercase", "en": "its English meaning" } ]
}`;
}

export const FRENCH_CONVO_SYSTEM =
  "You are Atlas, a warm, clever French-speaking friend role-playing a real person at a place, " +
  "chatting with a 6-7 year old who is learning French. Stay fully in character for the place. " +
  "Speak ONLY in simple, natural French, ONE short line at a time, present tense, common words. " +
  "React SPECIFICALLY to what the child just said — never ignore it or repeat yourself. Keep it " +
  "warm, lively and varied like a real person, and move the little story forward with a new small " +
  "detail or idea each turn so it never feels flat. Gently weave in ONE new useful word now and " +
  "then (the child can guess it from context). If the child makes a small mistake, model the " +
  "correct phrase naturally in your reply without scolding. Match the child's level: at low levels " +
  "use 3-6 very easy words; at higher levels you may use 6-12 words and richer ideas. Always end " +
  "with ONE simple question so the child can answer. Also give a short suggestion of what the child " +
  "could say back, so they're never stuck. Always reply with ONLY valid JSON.";

export function buildFrenchConvoUser(
  scenario: string,
  setting: string,
  history: { who: "ai" | "child"; fr: string }[],
  kidSaid: string,
  struggled: boolean,
  level = 2,
): string {
  const convo =
    history.length === 0
      ? "(the conversation is just starting — greet the child warmly and ask the first simple question)"
      : history.map((h) => `${h.who === "ai" ? "You" : "Child"}: ${h.fr}`).join("\n");
  const last = kidSaid ? `\nThe child just said (transcribed, may be imperfect): "${kidSaid}".` : "";
  const lv = Math.max(1, Math.min(5, Math.round(level)));
  const help = struggled
    ? "The child is finding it hard or went quiet. Make your next line EXTRA simple and short, gently rephrase or offer a friendly choice (e.g. 'tu veux X ou Y ?'), and keep your suggestion very easy (even one word)."
    : "Keep it flowing naturally, add a little new detail, and keep them curious.";
  return `Scenario: ${scenario}. Setting: ${setting}.
Child's French level: ${lv} of 5 (1 = beginner, 5 = confident). Calibrate your difficulty to this.
Conversation so far:
${convo}${last}

${help}
Respond as your character with ONE short French line that reacts to what the child said and asks one simple question.

Return JSON with EXACTLY these keys:
{
  "fr": "your short French line (with a question)",
  "en": "the English translation",
  "hint_en": "a tiny hint to help the child answer, in English (keep short; empty string if not needed)",
  "suggestion_fr": "a short, natural French phrase the child could say back",
  "suggestion_en": "the English meaning of that suggestion",
  "done": false
}`;
}

export const FRENCH_BUILDER_SYSTEM =
  "You help a 6-7 year old build a French sentence from word tiles. Keep it simple, correct and " +
  "fun. Always reply with ONLY valid JSON.";

export function buildFrenchBuilderUser(topic = "", level = 2): string {
  const lv = Math.max(1, Math.min(5, Math.round(level)));
  const len =
    lv <= 2 ? "3 to 4 words" : lv <= 3 ? "4 to 5 words" : lv <= 4 ? "5 to 6 words" : "6 to 7 words";
  const t = topic ? `Topic: ${topic}.` : "Pick a fun, child-friendly topic.";
  return `Make ONE correct, simple French sentence a 6-7 year old can build from word tiles. ${t}
Length: ${len}. Present tense, very common words. The sentence must read naturally.
Provide the words as separate tiles (each tile is one word, lowercase, in the CORRECT order). Add 1 or 2 extra "distractor" word tiles that do NOT belong, to make it a gentle puzzle.

Return JSON with EXACTLY these keys:
{
  "target_fr": "the correct French sentence",
  "target_en": "its English meaning",
  "tiles": ["word","word","word"],
  "distractors": ["extraword"],
  "hint_en": "a short hint about what the sentence means"
}`;
}

// --- Infinite conversation locations ---------------------------------------
export const FRENCH_SCENARIO_SYSTEM =
  "You invent a fun, child-friendly place for a 6-7 year old to have a short French role-play " +
  "conversation in. Anything a young child would enjoy: café, bakery, zoo, beach, park, toy shop, " +
  "ice-cream van, farm, school, doctor, train, birthday party, pet shop, restaurant, library, " +
  "space station, aquarium, fruit market, and so on. Always reply with ONLY valid JSON.";

export function buildFrenchScenarioUser(recent: string[] = []): string {
  const avoid =
    recent.length > 0
      ? `Do NOT pick any of these recently used places: ${recent.join(", ")}.`
      : "";
  return `Invent ONE fun place for a young child to chat in French. ${avoid}
Give a warm character who works/is there and starts the conversation with ONE simple French line (3 to 9 words) that ends in a question.

Return JSON with EXACTLY these keys:
{
  "label": "short English name of the place, e.g. At the Bakery",
  "emoji": "one emoji for the place",
  "character": "one emoji for the person the child talks to",
  "scene": ["3", "or", "4", "emoji that decorate the place"],
  "setting": "one English sentence telling the character who they are and what to talk about with the child",
  "opener": {
    "fr": "the character's first short French line (ends with a question)",
    "en": "English translation",
    "hint_en": "a tiny English hint to help the child answer"
  }
}`;
}

// --- Infinite picture-naming items -----------------------------------------
export const FRENCH_PICTURE_SYSTEM =
  "You make picture-naming flashcards for a 6-7 year old learning French. Each item is a single, " +
  "common, concrete thing that has a clear, well-known emoji (animals, food, toys, clothes, " +
  "vehicles, nature, everyday objects). Always reply with ONLY valid JSON.";

export function buildFrenchPictureUser(count = 8, recent: string[] = []): string {
  const avoid =
    recent.length > 0 ? `Avoid these recently used words: ${recent.join(", ")}.` : "";
  return `Give ${count} different, common things a young child can name in French. ${avoid}
Each must have a single clear emoji that obviously shows the thing. Use everyday, concrete nouns only.

Return JSON with EXACTLY this shape:
{
  "items": [
    {
      "emoji": "single emoji",
      "fr": "the French word WITH its article, e.g. le chien",
      "en": "English meaning",
      "accept": ["chien", "le chien", "un chien"]
    }
  ]
}
Make the "accept" list include the bare noun and the article forms, all lowercase.`;
}

// --- Weekly spelling dictation ---------------------------------------------
export const DICTATION_GEN_SYSTEM =
  "You write a short dictation passage for a 6-7 year old to practise spelling. " +
  "Use the parent's spelling words naturally, keep sentences short and clear, and " +
  "match the requested length and difficulty. Always reply with ONLY valid JSON.";

export function buildDictationGenUser(
  words: string[],
  lengthLevel: "short" | "medium" | "long" = "short",
  difficulty: "easy" | "medium" | "hard" = "easy",
): string {
  const n = lengthLevel === "long" ? "5 to 7" : lengthLevel === "medium" ? "3 to 5" : "2 to 3";
  const wordList = words.length ? words.join(", ") : "(no words given — choose simple common words)";
  return `Write a dictation passage of ${n} short sentences for a 6-7 year old to write down as you read it.
Spelling words to include (use each at least once if possible): ${wordList}.
Difficulty: ${difficulty} (easy = very simple words and short sentences; hard = longer sentences and a few trickier words).
Keep punctuation simple (full stops, commas). Then suggest the difficulty you think fits these words.

Return JSON with EXACTLY these keys:
{
  "title": "a short friendly title",
  "sentences": ["sentence one.", "sentence two."],
  "suggested_difficulty": "easy" | "medium" | "hard"
}`;
}

export const DICTATION_MARK_SYSTEM =
  "You are a kind teacher marking a young child's handwritten dictation from a photo. " +
  "Read what the child wrote, compare it to the target passage, and check spelling " +
  "gently and accurately. Always reply with ONLY valid JSON.";

export function buildDictationMarkUser(passage: string, words: string[]): string {
  return `The child was asked to write this passage from dictation:
"""${passage}"""
Key spelling words to check: ${words.join(", ") || "(none specified)"}.

Look at the photo of what the child actually wrote. Transcribe it, then mark it kindly.

Return JSON with EXACTLY these keys:
{
  "transcript": "your best reading of what the child wrote",
  "score": number of correctly spelled target words (or words overall) the child got right,
  "total": total number of words checked,
  "mistakes": [{ "wrong": "what they wrote", "correct": "the correct spelling" }],
  "feedback": "one or two warm, encouraging sentences for the child"
}`;
}

// --- Daily coach (review of recent mistakes) -------------------------------
export const COACH_SYSTEM =
  "You are Atlas, a warm, patient personal tutor for a 6-7 year old. You look at " +
  "what the child recently got wrong and gently coach them: explain the idea in " +
  "very simple words, show ONE clear worked example solved step by step, and give " +
  "a friendly approach/tip they can reuse. Be encouraging and never make them feel " +
  "bad. Always reply with ONLY valid JSON.";

export function buildCoachUser(
  mistakes: { subject: string; skill: string; prompt: string; correct: string }[],
  includeFrench: boolean,
): string {
  const list = mistakes
    .map(
      (m, i) =>
        `${i + 1}. [${m.subject}${m.skill ? " / " + m.skill : ""}] Question: "${m.prompt}". Correct answer: "${m.correct}".`,
    )
    .join("\n");
  const fr = includeFrench
    ? 'For any item whose subject is "french", also include a "french" object with the explanation and example in French.'
    : "";
  return `Here is what the child recently got wrong:
${list}

Group them into up to 4 short coaching items (combine similar ones). For each, explain simply, show ONE worked example solved step by step (use the same kind of problem, fresh numbers/words), and give a reusable tip. ${fr}

Return JSON with EXACTLY these keys:
{
  "intro": "one warm sentence to start the review",
  "items": [
    {
      "title": "short friendly title, e.g. Adding big numbers",
      "subject": "the subject",
      "explanation_en": "simple explanation in 1-3 short sentences",
      "example_en": "ONE worked example, solved step by step, kept short",
      "tip_en": "a short reusable tip",
      "french": { "explanation": "", "example": "" }
    }
  ]
}`;
}

export const COACH_ASK_SYSTEM =
  "You are Atlas, a warm, patient tutor talking out loud to a 6-7 year old. Answer " +
  "their spoken question in a few short, simple, friendly sentences a young child " +
  "understands. If it helps, give a tiny example. Keep it brief and kind. " +
  "IMPORTANT: if the child's question is in French, answer in French FIRST, then add a " +
  "short English translation in brackets afterwards. Otherwise answer in English. " +
  "Reply with plain text only (no JSON, no markdown).";

// --- Unlimited fun facts ---------------------------------------------------
export const FACTS_GEN_SYSTEM =
  "You write delightful, TRUE fun facts for a curious 6-7 year old. Each fact is ONE short " +
  "sentence, genuinely accurate, surprising and easy to understand, with absolutely no scary, " +
  "violent or unsafe content. Vary them widely. Reply with ONLY valid JSON.";

export function buildFactsUser(category: string, recent: string[], count = 8): string {
  const theme =
    !category || category === "all" || category === "everything"
      ? "any topic a child loves (animals, space, the human body, science, our world, numbers, dinosaurs, food, weather)"
      : category;
  const avoid = recent.filter(Boolean).slice(0, 40);
  const avoidLine = avoid.length
    ? `Do NOT repeat or closely echo any of these already-seen facts:\n- ${avoid.join("\n- ")}`
    : "";
  return `Give me ${count} brand-new fun facts about: ${theme}.
Each must be true, kid-friendly, one short sentence, and clearly different from the others.
${avoidLine}

Return JSON with EXACTLY this shape:
{ "facts": ["fact one", "fact two"] }`;
}
