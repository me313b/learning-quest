// Minecraft flavour + an offline question bank.
//
// When no API key is set (or the AI is unreachable) the app must still work, so
// every subject has a fallback. The contexts here are mostly everyday (animals,
// food, shopping, sport) with the occasional Minecraft nod, and they rotate
// across real skill areas so a child sees a proper spread.

import type { ChildProfile, Question } from "./types";

export const MINECRAFT_FACTS: string[] = [
  "A creeper is afraid of cats and ocelots, so a pet cat keeps them away!",
  "Lava flows slower than water, which gives you a moment to escape.",
  "Endermen hate water and take damage if they touch it or rain.",
  "A full stack of most blocks is 64. Tools and eggs stack to far fewer.",
  "Bees pollinate flowers and crops grow faster near a busy beehive.",
  "Diamonds spawn deep down, usually below layer 16, near the bedrock.",
  "If you name a tamed wolf 'Dinnerbone', it flips upside down!",
  "Slimes are biggest in swamp biomes and split into smaller slimes.",
  "A bed sets your spawn point, but trying to sleep in the Nether explodes!",
  "Gold tools mine quickly but break fast, so they're a bit of a trade-off.",
];

// A wider set of fun facts so the breaks aren't all about Minecraft.
export const FUN_FACTS: string[] = [
  "A group of flamingos is called a 'flamboyance'. ",
  "Octopuses have three hearts and blue blood!",
  "Honey never goes off — jars thousands of years old are still good.",
  "A bolt of lightning is hotter than the surface of the Sun.",
  "Butterflies taste with their feet.",
  "The Earth is closest to the Sun in January, not summer.",
  "A day on Venus is longer than its whole year.",
  "Sloths can hold their breath longer than dolphins can.",
  "Bananas are berries, but strawberries technically aren't!",
  "Your bones are about five times stronger than steel for their weight.",
  "A snail can sleep for up to three years.",
  "There are more stars in the sky than grains of sand on every beach.",
];

export const MINECRAFT_TIPS: string[] = [
  "Build tip: torches stop monsters spawning, so light up your base!",
  "Build tip: a 2-block-deep moat keeps most mobs out of your house.",
  "Build tip: stack slabs to make smooth stairs that mobs can't climb.",
  "Build tip: use trapdoors as fake stairs for a tidy castle wall.",
  "Build tip: glass blocks let light in but still keep creepers out.",
];

const PRAISE: string[] = [
  "Brilliant work! ⭐",
  "Boom! You nailed it! 💎",
  "Spot on! ✨",
  "You're on fire! 🔥",
  "Genius move! 🧠",
  "That was epic! 🏆",
];

const ENCOURAGE: string[] = [
  "Good try! Every expert started right here. Let's look together.",
  "Almost! Mistakes help us level up. Here's the trick.",
  "Nice effort! Let's dig a bit deeper into this one.",
  "So close! Let's rebuild it step by step.",
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomFact(): string {
  // Mostly fun facts, sometimes a Minecraft fact or build tip.
  const r = Math.random();
  if (r < 0.6) return choice(FUN_FACTS);
  if (r < 0.85) return choice(MINECRAFT_FACTS);
  return choice(MINECRAFT_TIPS);
}

export function randomPraise(): string {
  return choice(PRAISE);
}

export function randomEncourage(): string {
  return choice(ENCOURAGE);
}

export function randomTip(): string {
  return choice(MINECRAFT_TIPS);
}

// --------------------------------------------------------------------------- //
// Shared question builder
// --------------------------------------------------------------------------- //
function q(
  partial: Partial<Question> & { prompt: string; answer: string; type: Question["type"] },
): Question {
  return {
    type: partial.type,
    topic: partial.topic ?? "maths",
    skill: partial.skill ?? "maths",
    difficulty: partial.difficulty ?? 1,
    prompt: partial.prompt,
    options: partial.options ?? [],
    answer: partial.answer,
    acceptable: partial.acceptable ?? [],
    tolerance: partial.tolerance ?? 0,
    hint: partial.hint ?? "Take it one step at a time.",
    solution: partial.solution ?? "",
    source: "fallback",
    audioText: partial.audioText,
    audioLanguage: partial.audioLanguage,
    displayText: partial.displayText,
    listening: partial.listening,
    expectMulti: partial.expectMulti,
  };
}

// --------------------------------------------------------------------------- //
// Maths: fully procedural, level 1..10, varied everyday contexts
// --------------------------------------------------------------------------- //
// Mostly neutral items, with a couple of Minecraft ones so it isn't all themed.
const THINGS = [
  "stickers",
  "marbles",
  "sweets",
  "apples",
  "coins",
  "crayons",
  "footballs",
  "shells",
  "books",
  "cookies",
  "diamonds",
  "emeralds",
];
const PEOPLE = ["You", "Sam", "Mia", "Leo", "Aria", "Noah"];

function mathsQuestion(level: number): Question {
  const thing = choice(THINGS);
  const who = choice(PEOPLE);
  const has = who === "You" ? "have" : "has";
  const L = Math.max(1, Math.min(15, Math.round(level)));

  // Small helper so every branch reads cleanly.
  const num = (topic: string, skill: string, prompt: string, answer: number, solution: string): Question =>
    q({ type: "numeric", topic, skill, difficulty: L, prompt, answer: String(answer), solution });

  // BAND 1-2 — single-step add / subtract, small numbers.
  if (L <= 2) {
    if (L === 1) {
      const a = randInt(2, 6);
      const b = randInt(2, 6);
      return num("addition", "addition", `${who} ${has} ${a} ${thing} and get ${b} more. How many now?`, a + b, `${a} + ${b} = ${a + b}.`);
    }
    const a = randInt(11, 20);
    const b = randInt(3, a - 1);
    return num("subtraction", "subtraction", `${who} ${has} ${a} ${thing} and give away ${b}. How many are left?`, a - b, `${a} − ${b} = ${a - b}.`);
  }

  // BAND 3-4 — multiplication, sharing, two-digit addition (one step).
  if (L <= 4) {
    const r = randInt(1, 3);
    if (r === 1) {
      const t = randInt(3, 9);
      const n = randInt(3, 9);
      return num("multiplication", "multiplication / times tables", `Each box holds ${t} ${thing}. How many in ${n} boxes?`, t * n, `${n} × ${t} = ${t * n}.`);
    }
    if (r === 2) {
      const g = randInt(2, 5);
      const per = randInt(3, 8);
      const tot = g * per;
      return num("division", "division and sharing", `${tot} ${thing} are shared equally between ${g} friends. How many each?`, per, `${tot} ÷ ${g} = ${per}.`);
    }
    const a = randInt(15, 49);
    const b = randInt(15, 49);
    return num("addition", "place value (column addition)", `Add these two numbers: ${a} + ${b} = ?`, a + b, `${a} + ${b} = ${a + b}.`);
  }

  // BAND 5-6 — first TWO-STEP problems, fractions, missing number.
  if (L <= 6) {
    const r = randInt(1, 3);
    if (r === 1) {
      const p = randInt(2, 6);
      const n = randInt(3, 7);
      const start = randInt(n * p + 5, n * p + 25);
      return num("money", "word problems (multi-step)", `${thing} cost ${p} coins each. ${who} buy ${n} of them with ${start} coins. How many coins are left?`, start - n * p, `Cost ${n} × ${p} = ${n * p}. Left: ${start} − ${n * p} = ${start - n * p}.`);
    }
    if (r === 2) {
      const d = choice([2, 3, 4, 5]);
      const whole = d * randInt(3, 8);
      return num("fractions", "fractions of an amount", `What is 1/${d} of ${whole} ${thing}?`, whole / d, `1/${d} of ${whole} = ${whole} ÷ ${d} = ${whole / d}.`);
    }
    const a = randInt(10, 40);
    const s = randInt(5, 30);
    return num("missing number", "missing number / inverse", `${a} + ? = ${a + s}. What is the missing number?`, s, `${a + s} − ${a} = ${s}.`);
  }

  // BAND 7-9 — genuine multi-step reasoning, larger numbers, comparison.
  if (L <= 9) {
    const r = randInt(1, 4);
    if (r === 1) {
      const per = randInt(4, 9);
      const boxes = randInt(3, 6);
      const loose = randInt(2, 9);
      const tot = per * boxes + loose;
      return num("multiplication", "word problems (multi-step)", `There are ${boxes} boxes with ${per} ${thing} in each, plus ${loose} loose ${thing}. How many altogether?`, tot, `${boxes} × ${per} = ${per * boxes}, then + ${loose} = ${tot}.`);
    }
    if (r === 2) {
      const p1 = randInt(2, 6);
      const p2 = randInt(2, 6);
      const q1 = randInt(2, 4);
      const q2 = randInt(2, 4);
      const cost = p1 * q1 + p2 * q2;
      const paid = randInt(cost + 1, cost + 20);
      return num("money", "money and change", `${q1} apples cost ${p1} coins each and ${q2} pears cost ${p2} coins each. ${who} pay ${paid} coins. How much change?`, paid - cost, `Cost: ${p1 * q1} + ${p2 * q2} = ${cost}. Change: ${paid} − ${cost} = ${paid - cost}.`);
    }
    if (r === 3) {
      const d = choice([2, 3, 4]);
      const whole = d * randInt(3, 8);
      const frac = whole / d;
      const extra = randInt(3, 12);
      return num("fractions", "fractions and reasoning", `${who} ${has} ${whole} ${thing}. ${who} give away 1/${d} of them, then find ${extra} more. How many ${thing} now?`, whole - frac + extra, `1/${d} of ${whole} = ${frac}. ${whole} − ${frac} + ${extra} = ${whole - frac + extra}.`);
    }
    const a = randInt(20, 60);
    const b = randInt(20, 60);
    const who1 = "Sam";
    const who2 = "Alex";
    return num("comparison", "comparing and reasoning", `${who1} has ${a} ${thing} and ${who2} has ${b}. How many more does ${a > b ? who1 : who2} have?`, Math.abs(a - b), `${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}.`);
  }

  // BAND 10-15 — genuinely hard: insight patterns and multi-step working.
  const r = randInt(1, 5);
  if (r === 1) {
    const start = randInt(3, 12);
    const step = L >= 12 ? randInt(6, 14) : randInt(4, 9);
    const seq = [start, start + step, start + 2 * step, start + 3 * step];
    return num("number series", "number series and what comes next", `What number comes next? ${seq.join(", ")}, ?`, start + 4 * step, `Each step adds ${step}, so the next number is ${start + 4 * step}.`);
  }
  if (r === 2) {
    const x = randInt(5, L >= 12 ? 20 : 12);
    const mult = randInt(3, L >= 12 ? 12 : 7);
    const sub = randInt(5, 40);
    const result = x * mult - sub;
    return num("missing number", "word problems (multi-step)", `A number is multiplied by ${mult}, then ${sub} is taken away, giving ${result}. What is the number?`, x, `Work backwards: (${result} + ${sub}) ÷ ${mult} = ${x}.`);
  }
  if (r === 3) {
    const a0 = randInt(1, 6);
    const d = randInt(2, 6);
    const a1 = a0 + d;
    const a2 = a1 + (d + 2);
    const a3 = a2 + (d + 4);
    const next = a3 + (d + 6);
    return num("number series", "number series and what comes next", `What comes next? ${a0}, ${a1}, ${a2}, ${a3}, ?`, next, `The gaps grow by 2 each time (${d}, ${d + 2}, ${d + 4}, then ${d + 6}), so the next number is ${next}.`);
  }
  if (r === 4) {
    const f0 = randInt(1, 4);
    const f1 = randInt(2, 6);
    const f2 = f0 + f1;
    const f3 = f1 + f2;
    const f4 = f2 + f3;
    const f5 = f3 + f4;
    return num("number series", "number series and what comes next", `What comes next? ${f0}, ${f1}, ${f2}, ${f3}, ${f4}, ?`, f5, `Each number is the two before it added together, so ${f3} + ${f4} = ${f5}.`);
  }
  const squares = [1, 4, 9, 16, 25, 36, 49, 64, 81];
  const idx = randInt(0, 3);
  const seq = squares.slice(idx, idx + 4);
  const nextSq = squares[idx + 4];
  const root = Math.round(Math.sqrt(nextSq));
  return num("number series", "number patterns and reasoning", `What comes next? ${seq.join(", ")}, ?`, nextSq, `These are square numbers (1×1, 2×2, 3×3 …). The next is ${root} × ${root} = ${nextSq}.`);
}

// --------------------------------------------------------------------------- //
// French: multiple-choice across several areas (grades locally without a key)
// --------------------------------------------------------------------------- //
// [english clue, french answer, three wrong options, area]
const FRENCH_BANK: Array<[string, string, string[], string]> = [
  ["hello", "bonjour", ["merci", "au revoir", "oui"], "greetings and politeness"],
  ["thank you", "merci", ["bonjour", "non", "chat"], "greetings and politeness"],
  ["goodbye", "au revoir", ["bonjour", "merci", "rouge"], "greetings and politeness"],
  ["yes", "oui", ["non", "merci", "trois"], "greetings and politeness"],
  ["no", "non", ["oui", "bonjour", "bleu"], "greetings and politeness"],
  ["one", "un", ["deux", "trois", "dix"], "numbers 1 to 20"],
  ["two", "deux", ["un", "quatre", "cinq"], "numbers 1 to 20"],
  ["three", "trois", ["deux", "quatre", "dix"], "numbers 1 to 20"],
  ["five", "cinq", ["quatre", "six", "deux"], "numbers 1 to 20"],
  ["ten", "dix", ["deux", "trois", "huit"], "numbers 1 to 20"],
  ["red", "rouge", ["bleu", "vert", "noir"], "colours"],
  ["blue", "bleu", ["rouge", "vert", "jaune"], "colours"],
  ["green", "vert", ["rouge", "bleu", "noir"], "colours"],
  ["yellow", "jaune", ["rouge", "vert", "bleu"], "colours"],
  ["black", "noir", ["blanc", "rouge", "vert"], "colours"],
  ["cat", "chat", ["chien", "oiseau", "poisson"], "animals"],
  ["dog", "chien", ["chat", "cheval", "poisson"], "animals"],
  ["bird", "oiseau", ["chat", "chien", "cheval"], "animals"],
  ["fish", "poisson", ["chat", "oiseau", "chien"], "animals"],
  ["horse", "cheval", ["chien", "chat", "oiseau"], "animals"],
  ["bread", "pain", ["eau", "lait", "pomme"], "food and drink"],
  ["water", "eau", ["pain", "lait", "fromage"], "food and drink"],
  ["apple", "pomme", ["pain", "eau", "lait"], "food and drink"],
  ["milk", "lait", ["eau", "pain", "pomme"], "food and drink"],
  ["cheese", "fromage", ["pain", "eau", "pomme"], "food and drink"],
];

function frenchQuestion(level: number, task = ""): Question {
  // At hard bands the "vocab" slot becomes a small listening/comprehension task
  // rather than single-word recall, so even offline it isn't trivial at Expert.
  if (task === "vocab" && level >= 7) {
    const [fr, en] = choice(FRENCH_COMPREHENSION);
    return q({
      type: "short_text",
      topic: "comprehension",
      skill: "understanding French",
      difficulty: level,
      prompt: `What does this mean in English?\n"${fr}"`,
      answer: en,
      audioText: fr,
      audioLanguage: "fr-FR",
      hint: "Listen for the number and the thing they want.",
      solution: `It means: ${en}`,
    });
  }
  // Vocabulary: five words at once, marked by how many are right. Goes both ways.
  if (task === "vocab") {
    const pool = [...FRENCH_BANK].sort(() => Math.random() - 0.5).slice(0, 5);
    if (Math.random() < 0.5) {
      // French -> English
      const lines = pool.map(([, fr], i) => `${i + 1}) ${fr}`).join("   ");
      const answers = pool.map(([en]) => en).join(", ");
      const frWords = pool.map(([, fr]) => fr).join(", ");
      return q({
        type: "short_text",
        topic: "vocabulary",
        skill: "French vocabulary",
        difficulty: level,
        prompt: `What do these five French words mean? Write all five in English, separated by commas.\n${lines}`,
        answer: answers,
        audioText: frWords,
        audioLanguage: "fr-FR",
        expectMulti: true,
        hint: "Say each one out loud — some sound like the English word.",
        solution: `The meanings are: ${answers}.`,
      });
    }
    // English -> French (the child writes the French)
    const lines = pool.map(([en], i) => `${i + 1}) ${en}`).join("   ");
    const answers = pool.map(([, fr]) => fr).join(", ");
    return q({
      type: "short_text",
      topic: "vocabulary",
      skill: "French vocabulary",
      difficulty: level,
      prompt: `Write these five words in French, separated by commas.\n${lines}`,
      answer: answers,
      audioText: "",
      expectMulti: true,
      hint: "Think of the French word you have learned for each one.",
      solution: `In French: ${answers}.`,
    });
  }
  // Translate a short English sentence into French (answer hidden, never spoken).
  if (task === "translate") {
    const [en, fr] = choice(FRENCH_BANK);
    return q({
      type: "short_text",
      topic: "translation",
      skill: "translating into French",
      difficulty: level,
      prompt: `Say this in French: "${en}"`,
      answer: fr,
      audioText: "",
      hint: "Think of the French word you have learned for this.",
      solution: `"${en}" in French is "${fr}".`,
    });
  }
  // Interview: a real French question the child answers in French (open).
  if (task === "interview") {
    const [ask, model] = choice(FRENCH_INTERVIEW);
    return q({
      type: "short_text",
      topic: "speaking",
      skill: "answering in French",
      difficulty: level,
      prompt: ask,
      answer: "",
      audioText: ask,
      audioLanguage: "fr-FR",
      hint: "Answer with a short French sentence — say it out loud if you like.",
      solution: `One way to answer: ${model}`,
    });
  }
  // Make a sentence (open). Default for any other French question.
  const [ask, model] = choice(FRENCH_SENTENCE);
  return q({
    type: "short_text",
    topic: "writing",
    skill: "making a French sentence",
    difficulty: level,
    prompt: ask,
    answer: "",
    audioText: ask,
    audioLanguage: "fr-FR",
    hint: "Keep it short — a few French words that go together.",
    solution: `For example: ${model}`,
  });
}

// French interview questions with a sample answer (used only as a guide).
const FRENCH_INTERVIEW: Array<[string, string]> = [
  ["Comment t'appelles-tu ?", "Je m'appelle Aiden."],
  ["Quel âge as-tu ?", "J'ai sept ans."],
  ["Quel est ton animal préféré ?", "Mon animal préféré est le chien."],
  ["Quelle est ta couleur préférée ?", "Ma couleur préférée est le bleu."],
  ["Qu'est-ce que tu aimes manger ?", "J'aime manger des pâtes."],
  ["As-tu un frère ou une sœur ?", "Oui, j'ai une sœur."],
  ["Comment vas-tu aujourd'hui ?", "Je vais très bien, merci."],
];

// Make-a-sentence prompts with a sample correct sentence (guide only).
const FRENCH_SENTENCE: Array<[string, string]> = [
  ["Fais une phrase avec le mot « chat ».", "Le chat est noir."],
  ["Fais une phrase avec le mot « rouge ».", "La pomme est rouge."],
  ["Écris une phrase sur ta famille.", "J'ai une grande famille."],
  ["Fais une phrase avec le mot « école ».", "Je vais à l'école."],
  ["Écris une phrase sur ce que tu aimes.", "J'aime jouer au football."],
  ["Fais une phrase avec le mot « pomme ».", "Je mange une pomme."],
];

// Short real-life French sentences with their English meaning, for hard-band
// listening/comprehension questions (each has a number and an item).
const FRENCH_COMPREHENSION: Array<[string, string]> = [
  ["Je voudrais un croissant, s'il vous plaît.", "I would like one croissant, please."],
  ["Je voudrais deux pommes et un pain.", "I would like two apples and one bread."],
  ["J'ai trois chats et un chien.", "I have three cats and one dog."],
  ["Je voudrais un verre d'eau, s'il vous plaît.", "I would like a glass of water, please."],
  ["Il y a quatre enfants dans la classe.", "There are four children in the class."],
  ["Je voudrais une glace au chocolat, s'il vous plaît.", "I would like a chocolate ice cream, please."],
  ["Le petit chien mange deux biscuits.", "The little dog eats two biscuits."],
];

// --------------------------------------------------------------------------- //
// Reading: open sentence work across a few areas
// --------------------------------------------------------------------------- //
const READING_PROMPTS: Array<[string, string]> = [
  ["building a full sentence", "Write one full sentence about something you did today. Start with a capital and end with a full stop."],
  ["joining ideas with because / and / but", "Finish this with 'because': 'I like the weekend because...'"],
  ["using describing words (adjectives)", "Describe your favourite animal in one sentence, using a describing word."],
  ["building a full sentence", "Write a sentence about your best friend."],
  ["what a word means (vocabulary)", "Use the word 'enormous' in a sentence of your own."],
  ["punctuation (capital letters and full stops)", "Write a question you would ask an astronaut. Remember the question mark!"],
];

function readingQuestion(level: number): Question {
  const [area, prompt] = choice(READING_PROMPTS);
  return q({
    type: "short_text",
    topic: area,
    skill: area,
    difficulty: level,
    prompt,
    answer: "",
    hint: "A full sentence has a capital letter at the start and a full stop at the end.",
    solution: "A clear sentence names something and tells us about it, like 'My dog runs very fast.'",
  });
}

// --------------------------------------------------------------------------- //
// Art: creative upload, varied subjects
// --------------------------------------------------------------------------- //
const ART_PROMPTS: Array<[string, string]> = [
  ["drawing from imagination", "Draw your dream house and snap a photo of it."],
  ["drawing an animal", "Draw your favourite animal, then take a picture."],
  ["drawing a landscape or scene", "Draw a colourful sunset over hills, then photograph it."],
  ["designing something brand new", "Invent a brand-new creature and draw what it looks like."],
  ["colour and shading", "Draw a rainbow and colour it in carefully, then snap it."],
  ["pattern and symmetry", "Draw a butterfly with matching patterns on both wings."],
];

function artQuestion(level: number): Question {
  const [area, prompt] = choice(ART_PROMPTS);
  return q({
    type: "creative",
    topic: area,
    skill: area,
    difficulty: level,
    prompt,
    answer: "",
    hint: "Take your time and use lots of colour!",
    solution: "",
  });
}

// --------------------------------------------------------------------------- //
// Science / Geometry: small multiple-choice banks
// --------------------------------------------------------------------------- //
// [prompt, answer, wrong options, area]
const SCIENCE_BANK: Array<[string, string, string[], string]> = [
  ["Which gives us light in the daytime?", "The Sun", ["The Moon", "A rock", "A lamp post"], "space and the planets"],
  ["What do plants need to grow?", "Sunlight and water", ["Only darkness", "Only sand", "Ice"], "plants and how they grow"],
  ["Which animal lays eggs?", "Chicken", ["Cow", "Dog", "Cat"], "living things and habitats"],
  ["What happens to water when it freezes?", "It turns to ice", ["It boils", "It vanishes", "It turns to gas"], "materials and their properties"],
  ["Which body part helps you smell?", "Nose", ["Ear", "Elbow", "Knee"], "the human body and senses"],
  ["Which season is usually coldest?", "Winter", ["Summer", "Spring", "Autumn"], "weather and the seasons"],
  ["What pulls things down to the ground?", "Gravity", ["Wind", "Light", "Sound"], "forces and movement"],
  ["How many legs does an insect have?", "6", ["4", "8", "2"], "living things and habitats"],
];

const GEOMETRY_BANK: Array<[string, string, string[], string]> = [
  ["How many sides does a square have?", "4", ["3", "5", "6"], "2D shapes and their sides"],
  ["How many corners does a triangle have?", "3", ["4", "2", "5"], "2D shapes and their sides"],
  ["How many faces does a cube have?", "6", ["4", "8", "12"], "3D shapes and their faces"],
  ["Which shape is perfectly round?", "Circle", ["Square", "Triangle", "Hexagon"], "2D shapes and their sides"],
  ["How many sides does a hexagon have?", "6", ["5", "7", "8"], "2D shapes and their sides"],
  ["A full turn is how many degrees?", "360", ["90", "180", "270"], "angles and turns"],
  ["Which shape has no straight edges?", "Circle", ["Square", "Rectangle", "Triangle"], "2D shapes and their sides"],
];

function bankQuestion(
  bank: Array<[string, string, string[], string]>,
  level: number,
): Question {
  const [prompt, answer, distractors, area] = choice(bank);
  const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
  return q({
    type: "multiple_choice",
    topic: area,
    skill: area,
    difficulty: level,
    prompt,
    options,
    answer,
    solution: `The answer is "${answer}".`,
  });
}

// --------------------------------------------------------------------------- //
// Public entry point
// --------------------------------------------------------------------------- //
export function fallbackQuestion(
  subject: string,
  difficulty: number,
  _profile: ChildProfile,
  frenchTask = "",
): Question {
  const level = Math.max(1, Math.min(15, Math.round(difficulty)));
  switch (subject) {
    case "maths":
      return mathsQuestion(level);
    case "french":
      return frenchQuestion(level, frenchTask);
    case "reading":
      return readingQuestion(level);
    case "art":
      return artQuestion(level);
    case "science":
      return bankQuestion(SCIENCE_BANK, level);
    case "geometry":
      return bankQuestion(GEOMETRY_BANK, level);
    case "physics":
      return bankQuestion(SCIENCE_BANK, level);
    default:
      return mathsQuestion(level);
  }
}

// --- Categorised fun facts for the Fun Facts lab ---------------------------
export interface FactCategory {
  id: string;
  label: string;
  emoji: string;
  facts: string[];
}

export const FACT_CATEGORIES: FactCategory[] = [
  {
    id: "animals",
    label: "Animals",
    emoji: "🐾",
    facts: [
      "A group of flamingos is called a flamboyance.",
      "Octopuses have three hearts and blue blood.",
      "A snail can sleep for up to three years.",
      "Sea otters hold hands while they sleep so they don't float apart.",
      "A shrimp's heart is in its head.",
      "Cows have best friends and get upset when they are apart.",
      "Sloths can hold their breath longer than dolphins can.",
      "A hummingbird can flap its wings about fifty times every second.",
      "Elephants are the only animals that can't jump.",
      "A blue whale's heart is so big a small child could crawl through its blood vessels.",
      "Penguins propose to each other with a pebble.",
      "Butterflies taste with their feet.",
      "A group of owls is called a parliament.",
      "Crocodiles cannot stick their tongues out.",
      "Honeybees can recognise human faces.",
      "A starfish has no brain and no blood.",
      "Tigers have striped skin, not just striped fur.",
      "Frogs drink water through their skin instead of their mouths.",
      "A group of crows is called a murder.",
      "Giraffes only need about 30 minutes of sleep a day.",
      "Wombats make cube-shaped poo.",
      "A cheetah can go from standing still to very fast in just a few seconds.",
      "Koalas have fingerprints almost exactly like humans.",
      "An octopus can squeeze through any gap bigger than its beak.",
      "Polar bears have black skin under their white fur.",
      "A snail can have thousands of tiny teeth on its tongue.",
      "Dolphins give each other names using special whistles.",
      "Hummingbirds are the only birds that can fly backwards.",
      "A group of kittens is called a kindle.",
      "Pigs can't look up at the sky very easily.",
      "Sharks existed before trees did.",
      "An ostrich's eye is bigger than its brain.",
      "Bats always turn left when they leave a cave.",
      "A rhino's horn is made of the same stuff as your hair and nails.",
      "Some turtles can breathe through their bottoms.",
      "A group of jellyfish is called a smack.",
      "Reindeer eyes turn blue in winter to help them see in the dark.",
      "Snails can regrow their eyes if they lose them.",
    ],
  },
  {
    id: "space",
    label: "Space",
    emoji: "🚀",
    facts: [
      "A day on Venus is longer than its whole year.",
      "There are more stars in the universe than grains of sand on every beach on Earth.",
      "Footprints left on the Moon will stay for millions of years because there is no wind.",
      "The Sun is so big that about one million Earths could fit inside it.",
      "Saturn would float if you could find a bathtub big enough, because it's so light for its size.",
      "Space is completely silent because there is no air to carry sound.",
      "A spoonful of a neutron star would weigh about a billion tonnes.",
      "Jupiter has a storm bigger than the whole Earth that has lasted for hundreds of years.",
      "It takes sunlight about eight minutes to travel all the way to Earth.",
      "There is a planet made largely of diamond-like carbon.",
      "The Moon is slowly drifting away from Earth, a few centimetres every year.",
      "Astronauts can grow a little taller in space because their spines stretch out.",
      "Mars has the tallest volcano in the solar system, about three times higher than Mount Everest.",
      "One year on Neptune lasts about 165 Earth years.",
      "Shooting stars are usually tiny specks of dust burning up in the sky.",
      "The footsteps of astronauts on the Moon could last longer than the pyramids.",
      "Saturn's rings are made of billions of pieces of ice and rock.",
      "The hottest planet is Venus, even though Mercury is closer to the Sun.",
      "A full suit for a spacewalk can cost as much as a small house.",
      "There is no 'up' or 'down' in space.",
      "The Sun makes up about 99 percent of all the mass in our solar system.",
      "If you could drive a car to the Sun, it would take over a hundred years.",
      "Some stars are so big that if one replaced our Sun, it would swallow several planets.",
      "Galaxies can crash into each other, but the stars almost never hit.",
      "The Milky Way is just one of billions and billions of galaxies.",
      "A sunset on Mars looks blue, not orange.",
      "Comets grow long glowing tails when they get close to the Sun.",
      "The coldest place we know of is a cloud of gas in space, colder than empty space itself.",
      "Light from some stars you see at night left them before you were born.",
    ],
  },
  {
    id: "body",
    label: "Your Body",
    emoji: "🧠",
    facts: [
      "Your body has enough blood vessels to wrap around the Earth more than twice.",
      "You are a tiny bit taller in the morning than at night.",
      "Your nose can remember about fifty thousand different smells.",
      "The strongest muscle in your body for its size is the one you chew with.",
      "Your heart beats about 100,000 times every single day.",
      "You blink about twenty thousand times a day.",
      "Babies are born with around 300 bones, but adults have 206 because some join together.",
      "Your brain uses about a fifth of all the energy your body makes.",
      "The tiny bones in your ear are the smallest bones in your body.",
      "Your stomach gets a brand new lining every few days so it doesn't digest itself.",
      "If you stretched out all the wrinkles in your brain, it would be about the size of a pillowcase.",
      "You can't tickle yourself because your brain knows it's coming.",
      "Your fingernails grow faster than your toenails.",
      "Sneezes can shoot out of your nose faster than a car drives on the motorway.",
      "Your taste buds are replaced every couple of weeks.",
      "Your body makes a brand new skeleton roughly every ten years.",
      "You have about the same number of bones in your hand as a bat has in its wing.",
      "Your eyes can tell apart millions of different colours.",
      "The hardest thing in your whole body is the enamel on your teeth.",
      "You shed about a million tiny skin flakes every day.",
      "Your brain can hold an enormous amount of information, far more than any computer at home.",
      "When you blush, the inside of your stomach goes a little red too.",
      "Your left lung is slightly smaller than your right to make room for your heart.",
      "A grown-up walks far enough in a lifetime to go around the world several times.",
      "Goosebumps are left over from when our ancestors had thicker hair.",
      "Your ears and nose keep growing slowly your whole life.",
      "It is impossible to sneeze with your eyes open without trying very hard.",
      "Your funny bone isn't a bone at all, it's a nerve.",
    ],
  },
  {
    id: "science",
    label: "Science",
    emoji: "🔬",
    facts: [
      "Honey never goes bad. Honey found in ancient tombs was still good to eat.",
      "Hot water can sometimes freeze faster than cold water.",
      "Lightning is hotter than the surface of the Sun.",
      "Bananas are slightly radioactive, but far too little to hurt you.",
      "A bolt of lightning could toast about 100,000 slices of bread.",
      "Glass is made mostly from melted sand.",
      "Water is the only thing on Earth found naturally as a solid, a liquid and a gas.",
      "Rubber bands last longer when you keep them in the fridge.",
      "Sound travels about four times faster in water than in air.",
      "A rainbow is actually a full circle, but the ground hides the bottom half.",
      "If you could fold a piece of paper 42 times, it would reach the Moon.",
      "Metals can be 'glued' together in space just by touching, with no heat needed.",
      "Some metals are so light they would float on water.",
      "The air you breathe is mostly nitrogen, not oxygen.",
      "Static electricity is the same kind of spark as lightning, just much smaller.",
      "Heat makes most things grow a tiny bit bigger, even metal bridges.",
      "A magnet always has two ends, and cutting it just makes two smaller magnets.",
      "Light travels faster than anything else in the universe.",
      "Ice floats because frozen water takes up more space than liquid water.",
      "You can bend light with water, which is how a straw looks broken in a glass.",
      "Helium makes your voice squeaky because sound moves faster through it.",
      "The centre of the Earth is about as hot as the surface of the Sun.",
      "Plants 'breathe in' the gas we breathe out and give us oxygen back.",
      "Diamonds are made of the same stuff as pencil lead, just packed differently.",
      "A coin and a feather fall at exactly the same speed where there is no air.",
      "Bubbles are always round because that shape uses the least skin to hold the air.",
      "Some clouds weigh as much as hundreds of elephants.",
      "Mixing two clear liquids can sometimes suddenly make a colour appear.",
    ],
  },
  {
    id: "world",
    label: "Our World",
    emoji: "🌍",
    facts: [
      "The Eiffel Tower can grow about 15 centimetres taller on a hot day.",
      "There is a place in Norway where the sun doesn't set for weeks in summer.",
      "The Great Barrier Reef is the largest living thing on Earth.",
      "Antarctica is the largest desert in the world, even though it's covered in ice.",
      "Some of the oldest trees alive today are over four thousand years old.",
      "The Amazon rainforest makes a huge amount of the world's oxygen.",
      "Mount Everest grows a tiny bit taller each year as the Earth pushes it up.",
      "The Pacific Ocean is so big it could hold all the land on Earth with room to spare.",
      "Iceland has no mosquitoes at all.",
      "The Sahara desert can get cold enough to snow.",
      "The Amazon River carries more water than the next several biggest rivers combined.",
      "There are more trees on Earth than stars you can see in the night sky.",
      "The deepest part of the ocean is deeper than Mount Everest is tall.",
      "Lake Baikal holds about a fifth of all the fresh water on the planet.",
      "Some sand dunes can 'sing' a low humming sound as the sand slides.",
      "There are places on Earth where it has not rained for hundreds of years.",
      "A bolt of lightning strikes somewhere on Earth about a hundred times every second.",
      "The Dead Sea is so salty you can float on it without trying.",
      "Australia is wider than the Moon.",
      "There is enough gold in the Earth's core to coat the whole planet.",
      "The longest mountain range on Earth is hidden underwater.",
      "Some volcanoes shoot out lightning as well as lava.",
      "Waterfalls can flow upwards when strong winds blow them back.",
      "A year isn't exactly 365 days, which is why we add a leap day.",
      "The flag on the Moon is now bleached white by the Sun.",
      "Rivers can have waterfalls under the sea, made of heavier salty water.",
      "Earth is the only planet we know of with liquid water on its surface.",
      "The hottest temperature ever recorded was hot enough to cook an egg on the ground.",
    ],
  },
  {
    id: "numbers",
    label: "Numbers & Maths",
    emoji: "🔢",
    facts: [
      "Zero is the only number that can't be written in Roman numerals.",
      "A 'googol' is a 1 with one hundred zeros after it.",
      "If you add up all the numbers from 1 to 100, you get 5,050.",
      "The number 4 is the only number with the same number of letters as its value in English.",
      "Honeycomb cells are hexagons because that shape uses the least wax for the most space.",
      "Multiplying any number by 9 and adding the digits always gives 9.",
      "A circle has an endless number of corners, or none at all, depending on how you look.",
      "The word 'hundred' comes from an old word that actually meant 120.",
      "There are exactly 60 minutes in an hour because of counting used thousands of years ago.",
      "Palindrome numbers read the same forwards and backwards, like 1221.",
      "Every odd number has the letter 'e' in its English spelling.",
      "A 'baker's dozen' is 13, not 12.",
      "The plus and minus signs are over five hundred years old.",
      "There are more ways to shuffle a deck of cards than there are seconds since the universe began.",
      "If you keep doubling a single grain of rice on a chessboard, you'd need more rice than the world makes.",
      "The number pi goes on forever without ever repeating.",
      "A 'jiffy' is a real unit of time used in science, and it's tiny.",
      "Counting to a billion out loud would take you about thirty years.",
      "Any number times zero is always zero.",
      "Even and odd numbers take turns forever and never run out.",
      "A triangle is the strongest shape, which is why bridges use lots of them.",
      "The same three digits, 1, 2 and 3, can make six different numbers.",
      "Sharing 10 sweets between 3 friends leaves 1 left over.",
      "Numbers that only divide by 1 and themselves are called prime numbers.",
      "The biggest number with a proper name keeps getting bigger as people invent new ones.",
    ],
  },
  {
    id: "dinosaurs",
    label: "Dinosaurs",
    emoji: "🦕",
    facts: [
      "Some dinosaurs were smaller than a chicken.",
      "Birds are the living relatives of dinosaurs.",
      "The word 'dinosaur' means 'terrible lizard'.",
      "Tyrannosaurus rex had teeth as long as bananas.",
      "Some long-necked dinosaurs were as tall as a four-storey building.",
      "Many dinosaurs had feathers, not just scales.",
      "Dinosaurs lived on Earth for over 150 million years.",
      "We learn about dinosaurs from fossils, which are bones turned to stone.",
      "Some dinosaurs swallowed stones to help grind up their food.",
      "Stegosaurus had a brain about the size of a walnut.",
      "The fastest dinosaurs could run as quick as a car in a town.",
      "Triceratops had three horns and a huge bony frill.",
      "A dinosaur called Velociraptor was actually about the size of a turkey.",
      "Some dinosaur eggs were as big as footballs.",
      "Dinosaur poo turned to stone is called a coprolite, and scientists study it.",
      "The biggest dinosaurs were plant-eaters, not meat-eaters.",
      "Dinosaurs lived long before the first humans, with a huge gap in between.",
      "A new kind of dinosaur is discovered roughly every week somewhere in the world.",
      "Some dinosaurs had spikes, armour or clubs on their tails for protection.",
      "Nobody has ever found a fossil of dinosaur lips, so we have to guess.",
    ],
  },
  {
    id: "ocean",
    label: "Ocean",
    emoji: "🌊",
    facts: [
      "We have explored more of space than we have of our own deep oceans.",
      "The blue whale is the biggest animal that has ever lived, bigger than any dinosaur.",
      "Most of the oxygen we breathe comes from tiny ocean plants, not trees.",
      "Some deep-sea fish make their own light to see in the dark.",
      "The ocean has underwater mountains taller than any on land.",
      "A jellyfish is about 95 percent water.",
      "Seahorses are fish, and it's the dads who carry the babies.",
      "There are waterfalls and rivers hidden under the sea.",
      "The loudest animal in the ocean is the tiny pistol shrimp, with a snapping claw.",
      "Octopuses can change colour in less than a second.",
      "A group of fish swimming together is called a school.",
      "The deepest part of the ocean could swallow Mount Everest whole.",
      "Sea turtles can hold their breath for hours while resting.",
      "Coral reefs are alive and are home to a quarter of all sea creatures.",
      "Some sharks can sense a single drop of blood in a huge amount of water.",
      "Starfish can grow a whole new arm if they lose one.",
      "The sea is salty because rivers carry salt from rocks into it.",
      "Clownfish live safely among the stinging arms of sea anemones.",
      "Waves are made by the wind pushing on the water.",
      "More than half of all living things on Earth live in the ocean.",
    ],
  },
  {
    id: "food",
    label: "Food",
    emoji: "🍎",
    facts: [
      "Carrots used to be purple before orange ones became popular.",
      "Honey is the only food that never goes off.",
      "A strawberry isn't really a berry, but a banana is.",
      "Chocolate was once used as money by an ancient people.",
      "Apples float in water because a quarter of them is air.",
      "Cucumbers are about 95 percent water.",
      "Peanuts aren't nuts, they grow underground like beans.",
      "It takes about 12 bees their whole lives to make one spoon of honey.",
      "Pineapples take about two years to grow.",
      "Ketchup was once sold as a medicine.",
      "The holes in cheese are made by tiny bubbles of gas.",
      "Popcorn pops because tiny drops of water inside the kernel turn to steam.",
      "Some chillies are so hot they are used to make safety sprays.",
      "Bananas are berries, but strawberries are not.",
      "White chocolate isn't really chocolate because it has no cocoa solids.",
      "An ear of corn almost always has an even number of rows.",
      "Bread rises because tiny living yeast makes bubbles of gas.",
      "The most stolen food in the world is cheese.",
    ],
  },
  {
    id: "inventions",
    label: "Inventions",
    emoji: "💡",
    facts: [
      "The first computer was so big it filled a whole room.",
      "Bubble wrap was first invented to be wallpaper.",
      "The trampoline was invented by watching circus acrobats in their safety nets.",
      "Sticky notes were invented by accident from a glue that didn't stick well.",
      "The first photograph ever taken needed about eight hours of light.",
      "Crisps were invented by a chef trying to annoy a fussy customer.",
      "The very first website is still online today.",
      "Velcro was inspired by the way prickly seeds stuck to a dog's fur.",
      "People used to set their clocks by a man who walked around carrying the time.",
      "The wheel was invented after sewing needles and even boats.",
      "Roller skates were once worn into a party with no way to stop.",
      "The microwave was discovered when a chocolate bar melted in someone's pocket.",
      "The first alarm clock could only ring at one fixed time.",
      "Pencils can write upside down and even underwater.",
      "The first message sent on the internet crashed after just two letters.",
      "Umbrellas were used for shade from the sun long before rain.",
      "The first ever video game was a simple bouncing dot of tennis.",
      "Lego bricks made today still fit bricks made over fifty years ago.",
    ],
  },
];

export function factsForCategory(id: string): string[] {
  return FACT_CATEGORIES.find((c) => c.id === id)?.facts || [];
}
