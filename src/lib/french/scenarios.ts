// Conversation scenarios for the French lab, plus small offline fallback banks
// used when the OpenAI key isn't available so every activity still does
// something useful.

export interface Scenario {
  id: string;
  label: string;
  emoji: string;
  setting: string; // English description that steers the AI character
  scene: string[]; // emoji used to animate the place
  bg: string; // card gradient
  opener: { fr: string; en: string; hint_en: string }; // used if AI is offline
}

export const SCENARIOS: Scenario[] = [
  {
    id: "cafe",
    label: "At the Café",
    emoji: "☕",
    setting: "You are a friendly waiter in a French café talking to a young child customer. Offer drinks and cakes (un jus, un chocolat chaud, un gâteau).",
    scene: ["☕", "🧁", "🥐", "🍫"],
    bg: "linear-gradient(160deg, rgba(193,127,73,0.28), rgba(20,16,28,0.96))",
    opener: { fr: "Bonjour ! Bienvenue au café. Tu veux quoi ?", en: "Hello! Welcome to the café. What would you like?", hint_en: "Try: 'un jus' (a juice) or 'un gâteau' (a cake)." },
  },
  {
    id: "market",
    label: "At the Market",
    emoji: "🧺",
    setting: "You are a cheerful market seller with fruit and vegetables, talking to a young child. Talk about pommes, bananes, carottes and prices like 'un euro'.",
    scene: ["🍎", "🍌", "🥕", "🍓"],
    bg: "linear-gradient(160deg, rgba(23,221,98,0.22), rgba(20,16,28,0.96))",
    opener: { fr: "Bonjour ! Tu veux un fruit ?", en: "Hello! Would you like a fruit?", hint_en: "Try: 'une pomme' (an apple) or 'oui' (yes)." },
  },
  {
    id: "library",
    label: "At the Library",
    emoji: "📚",
    setting: "You are a kind librarian helping a young child find a book. Talk about livres, histoires, animaux and colours of books.",
    scene: ["📚", "📖", "🔖", "🦉"],
    bg: "linear-gradient(160deg, rgba(124,92,204,0.24), rgba(20,16,28,0.96))",
    opener: { fr: "Bonjour ! Tu cherches un livre ?", en: "Hello! Are you looking for a book?", hint_en: "Try: 'oui' (yes) or 'un livre' (a book)." },
  },
  {
    id: "school",
    label: "At School",
    emoji: "🏫",
    setting: "You are a friendly classmate at school talking to the child. Talk about colours, numbers, animals, and what you like to play.",
    scene: ["🏫", "✏️", "🎒", "⚽"],
    bg: "linear-gradient(160deg, rgba(58,111,216,0.26), rgba(20,16,28,0.96))",
    opener: { fr: "Salut ! Comment tu t'appelles ?", en: "Hi! What's your name?", hint_en: "Say: 'Je m'appelle ...' (My name is ...)." },
  },
  {
    id: "park",
    label: "At the Park",
    emoji: "🌳",
    setting: "You are a friendly child at the park talking to the child about playing, the weather, animals and games.",
    scene: ["🌳", "⚽", "🐶", "☀️"],
    bg: "linear-gradient(160deg, rgba(63,163,77,0.26), rgba(20,16,28,0.96))",
    opener: { fr: "Coucou ! Tu veux jouer ?", en: "Hey! Do you want to play?", hint_en: "Try: 'oui' (yes) or 'on joue au ballon' (let's play ball)." },
  },
  {
    id: "home",
    label: "At Home",
    emoji: "🏠",
    setting: "You are a warm family member at home talking to the child about food, family, pets and the day.",
    scene: ["🏠", "🍽️", "🐱", "❤️"],
    bg: "linear-gradient(160deg, rgba(242,178,51,0.2), rgba(20,16,28,0.96))",
    opener: { fr: "Bonjour mon petit ! Tu as faim ?", en: "Hello little one! Are you hungry?", hint_en: "Try: 'oui' (yes) or 'non' (no)." },
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

// Simple offline replies if the AI is unavailable: keep nudging warmly.
export const CONVO_FALLBACK: { fr: string; en: string; hint_en: string }[] = [
  { fr: "Super ! Et après ?", en: "Great! And then?", hint_en: "Say anything in French you can!" },
  { fr: "Génial ! Dis-moi plus.", en: "Awesome! Tell me more.", hint_en: "Even one word is great." },
  { fr: "Très bien ! Encore ?", en: "Very good! More?", hint_en: "Keep going, you can do it!" },
  { fr: "Bravo ! Continue.", en: "Well done! Carry on.", hint_en: "Try a short French word." },
];

// Offline fallback sentences for hands-free speaking, by difficulty level.
export const SENTENCE_BANK: Record<number, { fr: string; en: string }[]> = {
  1: [
    { fr: "Bonjour", en: "Hello" },
    { fr: "Merci", en: "Thank you" },
    { fr: "Un chat", en: "A cat" },
    { fr: "Le chien", en: "The dog" },
    { fr: "Au revoir", en: "Goodbye" },
  ],
  2: [
    { fr: "J'aime le chocolat", en: "I like chocolate" },
    { fr: "Le chat est noir", en: "The cat is black" },
    { fr: "Une grande maison", en: "A big house" },
    { fr: "Bonjour, ça va ?", en: "Hello, how are you?" },
  ],
  3: [
    { fr: "Je mange une pomme rouge", en: "I eat a red apple" },
    { fr: "Le chien joue dans le parc", en: "The dog plays in the park" },
    { fr: "J'ai un petit lapin blanc", en: "I have a small white rabbit" },
  ],
  4: [
    { fr: "Je vais à l'école avec mon ami", en: "I go to school with my friend" },
    { fr: "Le soleil brille et il fait chaud", en: "The sun shines and it is hot" },
  ],
};

export function fallbackSentence(level: number): { fr: string; en: string } {
  const lv = Math.max(1, Math.min(4, Math.round(level)));
  const pool = SENTENCE_BANK[lv] || SENTENCE_BANK[1];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Offline fallback builder exercise.
export const BUILDER_FALLBACK = [
  { target_fr: "le chat est noir", target_en: "the cat is black", tiles: ["le", "chat", "est", "noir"], distractors: ["chien"], hint_en: "An animal and its colour." },
  { target_fr: "j'aime les pommes", target_en: "I like apples", tiles: ["j'aime", "les", "pommes"], distractors: ["bananes"], hint_en: "You like this fruit." },
  { target_fr: "je joue dans le parc", target_en: "I play in the park", tiles: ["je", "joue", "dans", "le", "parc"], distractors: ["école"], hint_en: "Where you play outside." },
];

export function fallbackBuilder() {
  return BUILDER_FALLBACK[Math.floor(Math.random() * BUILDER_FALLBACK.length)];
}
