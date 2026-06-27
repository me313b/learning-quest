// The "lab" engine. A lab is a small, hands-on interactive experiment a child
// pokes at to learn something. Crucially the AI never writes code: it picks one
// of a fixed set of *vetted templates* (the interactive bit lives in trusted
// React components) and supplies fresh framing each visit — a new scenario,
// title, a prediction challenge, and a fun fact. That keeps labs endlessly
// varied but always safe and never broken.
//
// This file owns the shared types, the list of templates allowed per subject
// (with a one-line description the AI uses to pick), and deterministic fallback
// instances used when there's no API key or the model hiccups.

export interface PredictSpec {
  question: string;
  options: string[];
  answer: number; // index into options
  reveal: string;
}

export interface LabInstance {
  subject: string;
  template: string;
  title: string;
  intro: string;
  predict?: PredictSpec;
  fact?: string;
}

// Templates available per subject, each with a short description so the AI can
// choose one and write framing that matches the actual interactive mechanic.
export const LAB_TEMPLATES: Record<string, Record<string, string>> = {
  physics: {
    ramp: "A ball rolls down a ramp; a steeper ramp makes it roll faster (speed = distance / time).",
    push: "Push a block; the same push moves a heavier block more slowly (force = mass x acceleration).",
    falling:
      "Drop a feather against an anvil with air resistance on or off; gravity pulls both equally, only air slows the feather.",
    float: "Drop objects into water; things lighter than water float, heavier ones sink (density).",
    shadow: "Move the sun up and down; a low sun makes long shadows, a high sun makes short ones.",
  },
};

export function templateKeys(subject: string): string[] {
  return Object.keys(LAB_TEMPLATES[subject] || {});
}

function pickAvoiding(keys: string[], recent: string[]): string {
  const fresh = keys.filter((k) => !recent.includes(k));
  const pool = fresh.length ? fresh : keys;
  return pool[Math.floor(Math.random() * pool.length)] || keys[0];
}

// Hand-written fallback framing per template. Also used as the instant content
// when a child taps a specific experiment, so there's no wait for the AI.
const FALLBACKS: Record<string, Omit<LabInstance, "subject">> = {
  ramp: {
    template: "ramp",
    title: "Roll down the ramp",
    intro: "A steeper ramp makes the ball roll faster. Speed = distance shared by time.",
    predict: {
      question: "Make the ramp steeper. Will the ball reach the bottom faster or slower?",
      options: ["Faster", "Slower", "Same"],
      answer: 0,
      reveal: "Steeper ramps pull the ball down harder, so it speeds up.",
    },
    fact: "Skate ramps and ski slopes use this: the steeper the drop, the faster you go.",
  },
  push: {
    template: "push",
    title: "Give it a push",
    intro: "The same push moves a heavy block more slowly than a light one.",
    predict: {
      question: "Keep the push the same but double the weight. Faster or slower?",
      options: ["Faster", "Slower", "Same"],
      answer: 1,
      reveal: "Heavier means harder to get moving, so it speeds up more slowly.",
    },
    fact: "A loaded minecart is harder to start than an empty one: more mass, less speed-up.",
  },
  falling: {
    template: "falling",
    title: "Feather versus anvil",
    intro: "Gravity pulls everything down the same. Only the air slows the feather.",
    predict: {
      question: "With the air turned OFF, which lands first?",
      options: ["The feather", "The anvil", "They tie"],
      answer: 2,
      reveal: "With no air, gravity treats them equally, so they land together.",
    },
    fact: "An astronaut really dropped a hammer and a feather on the Moon. They hit the ground together.",
  },
  float: {
    template: "float",
    title: "Float or sink?",
    intro: "Drop something in the water. Lighter than water floats, heavier sinks.",
    predict: {
      question: "Which one floats?",
      options: ["A rock", "A wooden boat", "A metal key"],
      answer: 1,
      reveal: "Wood traps air and is lighter than water, so it floats.",
    },
    fact: "Huge metal ships float because their shape traps lots of air.",
  },
  shadow: {
    template: "shadow",
    title: "Sun and shadows",
    intro: "Move the sun. A low sun makes long shadows, a high sun makes short ones.",
    predict: {
      question: "When is your shadow longest?",
      options: ["Sunrise and sunset", "Midday", "Never changes"],
      answer: 0,
      reveal: "Early and late the sun is low, so shadows stretch out long.",
    },
    fact: "Sundials tell the time using exactly this as the shadow moves across the day.",
  },
};

export function fallbackLab(subject: string, recent: string[] = []): LabInstance {
  const keys = templateKeys(subject);
  const t = pickAvoiding(keys, recent);
  const base = FALLBACKS[t] || FALLBACKS.ramp;
  return { subject, ...base };
}

/** A complete instance for a specific template (used by the "pick" chips). */
export function labForTemplate(subject: string, template: string): LabInstance {
  const base = FALLBACKS[template] || FALLBACKS.ramp;
  return { subject, ...base };
}

// --------------------------------------------------------------------------- //
// Concepts for the fully-generated labs (used by the picker and the prompt).
// Each subject lists many ideas so a child can get lots of genuinely different
// experiments, including several on the same theme (e.g. multiple gravity ones).
// --------------------------------------------------------------------------- //
export interface LabSubject {
  key: string;
  label: string;
  emoji: string;
  concepts: string[];
}

export const LAB_SUBJECTS: LabSubject[] = [
  {
    key: "physics",
    label: "Physics",
    emoji: "⚛️",
    concepts: [
      "gravity: how fast things fall",
      "gravity: dropping a heavy and a light object together",
      "gravity: bouncing balls losing height",
      "gravity on different planets (Moon vs Earth)",
      "forces: pushing a block, heavier needs more push",
      "forces and friction: sliding on ice versus grass",
      "speed: a minecart on a ramp, steeper is faster",
      "light and shadows: moving a torch around a block",
      "light: reflecting a beam off a mirror to a target",
      "floating and sinking: testing objects in water",
      "magnets: which things stick and which do not",
      "sound: making a string or bar vibrate to change pitch",
      "energy: a swinging pendulum",
      "simple machines: a lever and a see-saw balance",
      "air resistance: a parachute falling slowly",
    ],
  },
  {
    key: "maths",
    label: "Maths",
    emoji: "🔢",
    concepts: [
      "addition: trading emeralds at a shop",
      "subtraction: spending coins and counting change",
      "multiplication: building a tower in equal rows",
      "division: sharing items equally between friends",
      "fractions: cutting a cake or pizza into parts",
      "place value: tens and units with blocks",
      "number patterns: a treasure-hunt sequence",
      "counting in 2s, 5s and 10s",
      "measuring length with blocks",
      "telling the time on a clock",
    ],
  },
  {
    key: "geometry",
    label: "Geometry",
    emoji: "📐",
    concepts: [
      "2D shapes: building with squares, triangles and circles",
      "3D shapes: counting faces of a cube and pyramid",
      "symmetry: making a butterfly's wings match",
      "angles and turns: pointing a compass",
      "area and perimeter: fencing a Minecraft plot",
      "patterns: making a repeating tile pattern",
      "position and direction: moving on a grid",
    ],
  },
  {
    key: "science",
    label: "Science",
    emoji: "🔬",
    concepts: [
      "plants: growing a seed with sun and water",
      "materials: sorting things that float, bend or melt",
      "animals and habitats: matching animals to homes",
      "weather: making clouds and rain",
      "the human body: the senses",
      "day and night: spinning the Earth",
      "states of matter: ice melting to water to steam",
    ],
  },
  {
    key: "french",
    label: "French",
    emoji: "🇫🇷",
    concepts: [
      "colours in French with things to colour",
      "numbers 1 to 10 in French",
      "animals in French",
      "greetings: bonjour, merci, au revoir",
      "food words in French",
      "matching French words to pictures",
    ],
  },
  {
    key: "music",
    label: "Music",
    emoji: "🎵",
    concepts: [
      "pitch: high and low notes you can hear",
      "rhythm: tap-along and repeat a beat",
      "make a simple tune on coloured keys",
      "loud and soft sounds",
      "match the sound to the instrument",
      "fast and slow tempo",
    ],
  },
];

export function labSubject(key: string): LabSubject | undefined {
  return LAB_SUBJECTS.find((s) => s.key === key);
}
