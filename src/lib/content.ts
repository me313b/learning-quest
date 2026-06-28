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
  switch (level) {
    case 1: {
      const a = randInt(1, 5);
      const b = randInt(1, 5);
      return q({
        type: "numeric",
        topic: "addition",
        skill: "addition",
        difficulty: level,
        prompt: `${who} ${has} ${a} ${thing} and get ${b} more. How many now?`,
        answer: String(a + b),
        solution: `${a} + ${b} = ${a + b}.`,
      });
    }
    case 2: {
      const a = randInt(8, 18);
      const b = randInt(2, a - 1);
      return q({
        type: "numeric",
        topic: "subtraction",
        skill: "subtraction",
        difficulty: level,
        prompt: `${who} ${has} ${a} ${thing} and give away ${b}. How many are left?`,
        answer: String(a - b),
        solution: `${a} − ${b} = ${a - b}.`,
      });
    }
    case 3: {
      const t = choice([2, 5, 10]);
      const n = randInt(2, 9);
      return q({
        type: "numeric",
        topic: "multiplication",
        skill: "multiplication / times tables",
        difficulty: level,
        prompt: `There are ${t} ${thing} in each bag. How many in ${n} bags?`,
        answer: String(t * n),
        solution: `${n} × ${t} = ${t * n}.`,
      });
    }
    case 4: {
      const t = randInt(3, 12);
      const n = randInt(3, 12);
      return q({
        type: "numeric",
        topic: "multiplication",
        skill: "multiplication / times tables",
        difficulty: level,
        prompt: `Each box holds ${t} ${thing}. How many in ${n} boxes?`,
        answer: String(t * n),
        solution: `${n} × ${t} = ${t * n}.`,
      });
    }
    case 5: {
      const groups = choice([2, 3, 4, 5]);
      const per = randInt(2, 8);
      const total = per * groups;
      return q({
        type: "numeric",
        topic: "division",
        skill: "division and sharing",
        difficulty: level,
        prompt: `${total} ${thing} are shared equally between ${groups} friends. How many each?`,
        answer: String(per),
        solution: `${total} ÷ ${groups} = ${per}.`,
      });
    }
    case 6: {
      const a = randInt(15, 49);
      const b = randInt(15, 49);
      return q({
        type: "numeric",
        topic: "addition",
        skill: "place value (column addition)",
        difficulty: level,
        prompt: `Add these two numbers: ${a} + ${b} = ?`,
        answer: String(a + b),
        solution: `Add the units, then the tens: ${a} + ${b} = ${a + b}.`,
      });
    }
    case 7: {
      const denom = choice([2, 3, 4, 5]);
      const whole = denom * randInt(2, 6);
      const used = whole / denom;
      return q({
        type: "numeric",
        topic: "fractions",
        skill: "fractions of an amount",
        difficulty: level,
        prompt: `What is 1/${denom} of ${whole} ${thing}?`,
        answer: String(used),
        solution: `1/${denom} of ${whole} = ${whole} ÷ ${denom} = ${used}.`,
      });
    }
    case 8: {
      const w = randInt(3, 9);
      const h = randInt(3, 9);
      return q({
        type: "numeric",
        topic: "area",
        skill: "shape, area and perimeter",
        difficulty: level,
        prompt: `A rug is ${w} squares wide and ${h} squares long. What is its area in squares?`,
        answer: String(w * h),
        solution: `Area = width × length = ${w} × ${h} = ${w * h}.`,
      });
    }
    case 9: {
      const price = randInt(3, 7);
      const qty = randInt(4, 9);
      const paid = qty * price + randInt(1, 20);
      const change = paid - qty * price;
      return q({
        type: "numeric",
        topic: "money",
        skill: "money and change",
        difficulty: level,
        prompt: `Pens cost £${price} each. ${who} buy ${qty} and pay £${paid}. How much change in pounds?`,
        answer: String(change),
        solution: `Cost = ${qty} × £${price} = £${qty * price}. Change = £${paid} − £${qty * price} = £${change}.`,
      });
    }
    default: {
      const pick = randInt(1, 3);
      if (pick === 1) {
        // Number series (arithmetic): find the next term. Bigger steps higher up.
        const start = randInt(2, 9);
        const step = randInt(2, 9) + (level >= 12 ? randInt(2, 6) : 0);
        const seq = [start, start + step, start + 2 * step, start + 3 * step];
        return q({
          type: "numeric",
          topic: "number series",
          skill: "number series and what comes next",
          difficulty: level,
          prompt: `What number comes next in this pattern? ${seq.join(", ")}, ?`,
          answer: String(start + 4 * step),
          solution: `Each step adds ${step}, so the next number is ${start + 4 * step}.`,
        });
      }
      if (pick === 2) {
        // Two-step "work backwards" with larger numbers at higher levels.
        const mag = level >= 12 ? 14 : 9;
        const x = randInt(4, mag);
        const mult = randInt(3, level >= 12 ? 9 : 6);
        const add = randInt(5, 30);
        const result = x * mult + add;
        return q({
          type: "numeric",
          topic: "missing number",
          skill: "word problems (multi-step)",
          difficulty: level,
          prompt: `A number is multiplied by ${mult}, then ${add} is added, giving ${result}. What is the number?`,
          answer: String(x),
          solution: `Work backwards: (${result} − ${add}) ÷ ${mult} = ${x}.`,
        });
      }
      // Doubling series at the very top.
      const base = randInt(2, 5);
      const seq = [base, base * 2, base * 4, base * 8];
      return q({
        type: "numeric",
        topic: "number series",
        skill: "number series and what comes next",
        difficulty: level,
        prompt: `What comes next? ${seq.join(", ")}, ?`,
        answer: String(base * 16),
        solution: `Each number doubles, so the next one is ${base * 16}.`,
      });
    }
  }
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

function frenchQuestion(level: number): Question {
  const [en, fr, distractors, area] = choice(FRENCH_BANK);
  const options = [fr, ...distractors].sort(() => Math.random() - 0.5);
  return q({
    type: "multiple_choice",
    topic: area,
    skill: area,
    difficulty: level,
    prompt: `Which French word means "${en}"?`,
    options,
    answer: fr,
    hint: "Say each word out loud and listen for the one you know.",
    solution: `"${en}" in French is "${fr}".`,
  });
}

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
): Question {
  const level = Math.max(1, Math.min(15, Math.round(difficulty)));
  switch (subject) {
    case "maths":
      return mathsQuestion(level);
    case "french":
      return frenchQuestion(level);
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
      "A single bolt of the Amazon River carries more water than the next several biggest rivers combined.",
      "There are more trees on Earth than stars you can see in the night sky.",
      "The deepest part of the ocean is deeper than Mount Everest is tall.",
      "Lake Baikal holds about a fifth of all the fresh water on the planet.",
      "Some sand dunes can 'sing' a low humming sound as the sand slides.",
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
      "Counting all the ways to shuffle a deck of cards gives a number bigger than the seconds since the universe began.",
    ],
  },
];

export function factsForCategory(id: string): string[] {
  return FACT_CATEGORIES.find((c) => c.id === id)?.facts || [];
}
