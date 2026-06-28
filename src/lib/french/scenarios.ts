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
  character?: string; // emoji for the person the child talks to
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
  {
    id: "restaurant",
    label: "At the Restaurant",
    emoji: "🍽️",
    setting:
      "You are a friendly waiter in a French restaurant taking a young child's order. Talk about simple dishes (des pâtes, une pizza, de la soupe, de l'eau) and dessert.",
    scene: ["🍝", "🍕", "🥗", "🍮"],
    bg: "linear-gradient(160deg, rgba(214,93,93,0.26), rgba(20,16,28,0.96))",
    character: "🧑‍🍳",
    opener: { fr: "Bonjour ! Tu veux manger quoi ?", en: "Hello! What would you like to eat?", hint_en: "Try: 'une pizza' or 'des pâtes' (pasta)." },
  },
  {
    id: "bakery",
    label: "At the Bakery",
    emoji: "🥖",
    setting:
      "You are a cheerful French baker (boulanger). Offer bread and pastries: un pain, un croissant, une baguette, un pain au chocolat.",
    scene: ["🥖", "🥐", "🍞", "🧁"],
    bg: "linear-gradient(160deg, rgba(214,160,74,0.26), rgba(20,16,28,0.96))",
    character: "👨‍🍳",
    opener: { fr: "Bonjour ! Tu veux un croissant ?", en: "Hello! Would you like a croissant?", hint_en: "Try: 'oui' or 'une baguette'." },
  },
  {
    id: "icecream",
    label: "Ice Cream Shop",
    emoji: "🍦",
    setting: "You sell ice cream to a young child. Talk about flavours: chocolat, vanille, fraise, citron, and colours.",
    scene: ["🍦", "🍨", "🍓", "🍫"],
    bg: "linear-gradient(160deg, rgba(124,92,224,0.24), rgba(20,16,28,0.96))",
    character: "🧑",
    opener: { fr: "Coucou ! Tu veux quelle glace ?", en: "Hi! Which ice cream would you like?", hint_en: "Try: 'chocolat' or 'fraise' (strawberry)." },
  },
  {
    id: "doctor",
    label: "At the Doctor",
    emoji: "🩺",
    setting:
      "You are a kind, gentle doctor talking to a young child. Ask where it hurts (la tête, le ventre, la main) and reassure them. Keep it light and friendly.",
    scene: ["🩺", "💊", "🧸", "❤️"],
    bg: "linear-gradient(160deg, rgba(74,170,214,0.24), rgba(20,16,28,0.96))",
    character: "👩‍⚕️",
    opener: { fr: "Bonjour ! Où ça fait mal ?", en: "Hello! Where does it hurt?", hint_en: "Try: 'la tête' (head) or 'le ventre' (tummy)." },
  },
  {
    id: "birthday",
    label: "Birthday Party",
    emoji: "🎂",
    setting:
      "You are a happy friend at a birthday party. Talk about cake, games, balloons, and ask how old the child is (Tu as quel âge ?).",
    scene: ["🎂", "🎈", "🎁", "🥳"],
    bg: "linear-gradient(160deg, rgba(242,99,178,0.24), rgba(20,16,28,0.96))",
    character: "🧒",
    opener: { fr: "Joyeux anniversaire ! Tu as quel âge ?", en: "Happy birthday! How old are you?", hint_en: "Say: 'J'ai six ans' (I'm six)." },
  },
  {
    id: "zoo",
    label: "At the Zoo",
    emoji: "🦁",
    setting:
      "You are a zookeeper showing animals to a young child. Talk about le lion, l'éléphant, le singe, la girafe and their sounds and colours.",
    scene: ["🦁", "🐘", "🐒", "🦒"],
    bg: "linear-gradient(160deg, rgba(214,170,74,0.24), rgba(20,16,28,0.96))",
    character: "🧑‍🌾",
    opener: { fr: "Regarde ! Tu aimes les animaux ?", en: "Look! Do you like animals?", hint_en: "Try: 'oui' or 'le lion'." },
  },
  {
    id: "beach",
    label: "At the Beach",
    emoji: "🏖️",
    setting:
      "You are a friendly child at the beach. Talk about the sea (la mer), sand (le sable), shells, swimming and the sun.",
    scene: ["🏖️", "🌊", "🐚", "☀️"],
    bg: "linear-gradient(160deg, rgba(74,194,214,0.24), rgba(20,16,28,0.96))",
    character: "🧒",
    opener: { fr: "Coucou ! On joue dans le sable ?", en: "Hey! Shall we play in the sand?", hint_en: "Try: 'oui' or 'la mer' (the sea)." },
  },
  {
    id: "airport",
    label: "At the Airport",
    emoji: "✈️",
    setting:
      "You work at an airport helping a young traveller. Ask where they are going (Tu vas où ?) and talk about the plane, suitcase and countries.",
    scene: ["✈️", "🧳", "🌍", "🎫"],
    bg: "linear-gradient(160deg, rgba(94,134,214,0.24), rgba(20,16,28,0.96))",
    character: "🧑‍✈️",
    opener: { fr: "Bonjour ! Tu vas où en avion ?", en: "Hello! Where are you flying to?", hint_en: "Try: 'à Paris' or a place you like." },
  },
  {
    id: "petshop",
    label: "Pet Shop",
    emoji: "🐹",
    setting:
      "You work in a pet shop. Talk about animals: un chien, un chat, un lapin, un poisson, and ask which pet the child likes.",
    scene: ["🐹", "🐶", "🐰", "🐠"],
    bg: "linear-gradient(160deg, rgba(63,163,77,0.24), rgba(20,16,28,0.96))",
    character: "🧑",
    opener: { fr: "Bonjour ! Tu aimes quel animal ?", en: "Hello! Which animal do you like?", hint_en: "Try: 'un chien' (a dog) or 'un chat' (a cat)." },
  },
  {
    id: "farm",
    label: "On the Farm",
    emoji: "🚜",
    setting:
      "You are a friendly farmer. Talk about farm animals (la vache, le cochon, la poule, le cheval) and their sounds.",
    scene: ["🐄", "🐖", "🐔", "🐴"],
    bg: "linear-gradient(160deg, rgba(150,194,74,0.24), rgba(20,16,28,0.96))",
    character: "🧑‍🌾",
    opener: { fr: "Salut ! Tu vois la vache ?", en: "Hi! Do you see the cow?", hint_en: "Try: 'oui' or 'la vache' (the cow)." },
  },
  {
    id: "toyshop",
    label: "Toy Shop",
    emoji: "🧸",
    setting: "You work in a toy shop. Talk about toys: une poupée, un ballon, un robot, un jeu, and colours.",
    scene: ["🧸", "🎈", "🤖", "🪀"],
    bg: "linear-gradient(160deg, rgba(242,178,51,0.22), rgba(20,16,28,0.96))",
    character: "🧑",
    opener: { fr: "Coucou ! Tu veux quel jouet ?", en: "Hi! Which toy would you like?", hint_en: "Try: 'un robot' or 'un ballon' (a ball)." },
  },
  {
    id: "space",
    label: "Space Adventure",
    emoji: "🚀",
    setting:
      "You are a fun astronaut friend on a rocket with the child. Talk about stars (les étoiles), the moon (la lune), planets, and pretend to fly. Be playful and imaginative.",
    scene: ["🚀", "🌙", "⭐", "🪐"],
    bg: "linear-gradient(160deg, rgba(94,94,224,0.26), rgba(20,16,28,0.96))",
    character: "🧑‍🚀",
    opener: { fr: "On vole dans l'espace ! Tu vois la lune ?", en: "We're flying in space! Do you see the moon?", hint_en: "Try: 'oui' or 'une étoile' (a star)." },
  },
  {
    id: "pirate",
    label: "Pirate Ship",
    emoji: "🏴‍☠️",
    setting:
      "You are a friendly pirate captain looking for treasure with the child. Talk about the boat (le bateau), the sea, the map, and treasure (le trésor). Be playful.",
    scene: ["🏴‍☠️", "⛵", "🗺️", "💰"],
    bg: "linear-gradient(160deg, rgba(74,134,154,0.26), rgba(20,16,28,0.96))",
    character: "🏴‍☠️",
    opener: { fr: "Ahoy ! On cherche le trésor ?", en: "Ahoy! Shall we look for treasure?", hint_en: "Try: 'oui' or 'le bateau' (the boat)." },
  },
  {
    id: "undersea",
    label: "Under the Sea",
    emoji: "🐠",
    setting:
      "You are a happy little fish or mermaid swimming with the child under the sea. Talk about fish, colours, water and sea animals (le poisson, la tortue, le crabe). Be gentle and imaginative.",
    scene: ["🐠", "🐢", "🦀", "🌊"],
    bg: "linear-gradient(160deg, rgba(74,170,214,0.26), rgba(20,16,28,0.96))",
    character: "🧜",
    opener: { fr: "Coucou ! Tu vois le poisson ?", en: "Hi! Do you see the fish?", hint_en: "Try: 'oui' or 'le poisson' (the fish)." },
  },
  {
    id: "castle",
    label: "At the Castle",
    emoji: "🏰",
    setting:
      "You are a friendly knight or princess at a castle. Talk about the castle, a gentle dragon, the crown, and being brave. Be playful and kind.",
    scene: ["🏰", "🐉", "👑", "🛡️"],
    bg: "linear-gradient(160deg, rgba(154,94,194,0.26), rgba(20,16,28,0.96))",
    character: "🤴",
    opener: { fr: "Bienvenue au château ! Tu es prêt ?", en: "Welcome to the castle! Are you ready?", hint_en: "Say: 'oui' (yes) or 'le dragon'." },
  },
  {
    id: "grandma",
    label: "At Grandma's",
    emoji: "👵",
    setting:
      "You are a warm, loving grandmother chatting with the child at home. Talk about food, family, the cat, and the day in gentle simple French.",
    scene: ["👵", "🍰", "🐱", "❤️"],
    bg: "linear-gradient(160deg, rgba(214,134,154,0.24), rgba(20,16,28,0.96))",
    character: "👵",
    opener: { fr: "Bonjour mon trésor ! Ça va ?", en: "Hello my treasure! How are you?", hint_en: "Say: 'ça va bien' (I'm good)." },
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
