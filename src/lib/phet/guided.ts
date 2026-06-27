// A guided learning wrapper for each PhET simulation: a short intro, a
// prediction question, a challenge to try, a reflection question, and a simple
// explanation. Rather than hand-write one for every sim, we build sensible
// prompts from the simulation's topics and title. (These can later be upgraded
// with AI-generated prompts; the simulation itself stays embedded as-is.)

import type { PhetSimulation } from "./catalog";

export interface GuidedPhetActivity {
  simSlug: string;
  intro: string;
  predictionQuestion: string;
  challenge: string;
  reflectionQuestion: string;
  explanation: string;
  rewardSeconds: number;
}

interface Template {
  intro: string;
  prediction: string;
  challenge: string;
  reflection: string;
  explanation: string;
}

// Topic-keyed templates. The first matching topic wins; otherwise a friendly
// generic explore-and-notice template is used.
const TEMPLATES: Record<string, Template> = {
  motion: {
    intro: "Let's explore what makes things move and stop.",
    prediction: "What do you think will happen if you push harder?",
    challenge: "Try pushing with a small force, then a big force. Watch the speed.",
    reflection: "Did a bigger push make it move faster or slower?",
    explanation: "A bigger push (force) makes an object speed up more. Less force, less speed.",
  },
  forces: {
    intro: "Forces are pushes and pulls. Let's see what they do.",
    prediction: "What do you think happens when two forces pull in opposite directions?",
    challenge: "Make one side pull harder than the other and watch which way it moves.",
    reflection: "Which way did it move — toward the bigger pull or the smaller one?",
    explanation: "Things move toward the bigger force. Equal forces cancel out and nothing moves.",
  },
  gravity: {
    intro: "Gravity is the invisible pull between things. Let's explore it.",
    prediction: "What do you think happens to the pull if things are closer together?",
    challenge: "Move the objects closer, then further apart, and watch the pull.",
    reflection: "Was the pull stronger when they were close or far apart?",
    explanation: "Gravity pulls harder when objects are closer and when they are heavier.",
  },
  energy: {
    intro: "Energy can move and change. Let's watch it happen.",
    prediction: "Where do you think the skater will go fastest?",
    challenge: "Send the skater from up high and watch where it speeds up.",
    reflection: "Was it faster at the top or the bottom?",
    explanation: "High up, energy is stored (potential). Coming down, it turns into movement (kinetic).",
  },
  springs: {
    intro: "Springs stretch and bounce. Let's find out what changes them.",
    prediction: "What do you think a heavier weight will do to the spring?",
    challenge: "Hang a light weight, then a heavy one, and watch the stretch.",
    reflection: "Did the heavier weight stretch the spring more or less?",
    explanation: "Heavier weights stretch a spring more. That's the spring's force at work.",
  },
  circuits: {
    intro: "Electricity flows in a loop called a circuit. Let's build one.",
    prediction: "What do you think you need to make the bulb light up?",
    challenge: "Connect a battery, wires and a bulb in a full loop.",
    reflection: "What happened when there was a gap in the loop?",
    explanation: "Electricity only flows in a complete loop. A gap stops it, so the bulb goes out.",
  },
  static: {
    intro: "Static electricity makes things stick and zap. Let's try it.",
    prediction: "What do you think happens after you rub the balloon?",
    challenge: "Rub the balloon, then bring it near the wall or hair.",
    reflection: "Did things move toward the balloon or away?",
    explanation: "Rubbing moves tiny charges. Opposite charges attract, so things are pulled together.",
  },
  magnets: {
    intro: "Magnets can pull and push without touching. Let's explore.",
    prediction: "What do you think the compass will do near the magnet?",
    challenge: "Move the magnet around and watch the compass needle.",
    reflection: "Which way did the needle point?",
    explanation: "Magnets make an invisible field. A compass needle lines up with that field.",
  },
  light: {
    intro: "Light can bend, bounce and make colours. Let's play with it.",
    prediction: "What do you think happens to light when it goes into water?",
    challenge: "Shine the light into the water at an angle and watch.",
    reflection: "Did the light go straight or bend?",
    explanation: "Light bends when it moves from air into water. That's called refraction.",
  },
  colour: {
    intro: "Let's mix coloured light and see what we get.",
    prediction: "What colour do you think red and green light make together?",
    challenge: "Turn on two colours of light at once and look at the result.",
    reflection: "What new colour did you make?",
    explanation: "Coloured lights add together. Red and green light make yellow!",
  },
  waves: {
    intro: "Waves carry energy. Let's make some and watch them move.",
    prediction: "What do you think makes a taller wave?",
    challenge: "Wiggle faster and bigger, and watch how the wave changes.",
    reflection: "What made the waves bigger or closer together?",
    explanation: "Bigger wiggles make taller waves; faster wiggles make waves closer together.",
  },
  sound: {
    intro: "Sound travels as waves through the air. Let's see it.",
    prediction: "What do you think happens to the wave when the sound is louder?",
    challenge: "Make the sound louder and quieter and watch the wave.",
    reflection: "Did a louder sound make a taller or shorter wave?",
    explanation: "Louder sounds make taller waves. Higher sounds make waves closer together.",
  },
  heat: {
    intro: "Heat can change things. Let's warm them up and cool them down.",
    prediction: "What do you think happens to the tiny particles when you add heat?",
    challenge: "Heat the substance up and watch the particles move.",
    reflection: "Did the particles move faster or slower when hot?",
    explanation: "Heat makes particles move faster. Enough heat can melt a solid or boil a liquid.",
  },
  gas: {
    intro: "Gases are made of tiny bouncing particles. Let's explore them.",
    prediction: "What do you think happens if you squeeze the gas into a smaller space?",
    challenge: "Make the box smaller and watch how often particles hit the walls.",
    reflection: "Did squeezing make the pressure bigger or smaller?",
    explanation: "Squeezing a gas makes particles hit the walls more often, so the pressure goes up.",
  },
  pressure: {
    intro: "Pressure is a push from water or air. Let's feel how it changes.",
    prediction: "What do you think happens to pressure as you go deeper underwater?",
    challenge: "Move the measure deeper and watch the pressure.",
    reflection: "Was the pressure bigger deep down or near the top?",
    explanation: "The deeper you go, the more water pushes down, so the pressure is bigger.",
  },
  density: {
    intro: "Some things float and some sink. Let's find out why.",
    prediction: "What do you think will float — the heavy block or the light one?",
    challenge: "Drop different blocks into the water and watch.",
    reflection: "What made something float instead of sink?",
    explanation: "Things float if they're light for their size (less dense than water).",
  },
  water: {
    intro: "Let's explore what happens with water.",
    prediction: "What do you think will happen in the water?",
    challenge: "Try changing things and watch the water react.",
    reflection: "What did you notice about the water?",
    explanation: "Water pushes up on things and presses harder the deeper you go.",
  },
  float: {
    intro: "Floating and sinking is all about density. Let's test it.",
    prediction: "Do you think a big heavy block always sinks?",
    challenge: "Try blocks of different sizes and weights in the water.",
    reflection: "What decided whether it floated?",
    explanation: "It's not just weight — it's how heavy something is for its size.",
  },
  space: {
    intro: "Let's explore space, planets and orbits.",
    prediction: "What do you think keeps the moon going around the earth?",
    challenge: "Start the sun, earth and moon and watch them orbit.",
    reflection: "What happened when you changed how heavy the sun was?",
    explanation: "Gravity pulls the planets and moons, keeping them in their orbits.",
  },
  planets: {
    intro: "Planets travel in big loops called orbits. Let's watch.",
    prediction: "What do you think happens if a planet is closer to the sun?",
    challenge: "Place planets at different distances and watch them move.",
    reflection: "Did closer planets go around faster or slower?",
    explanation: "Planets closer to the sun move faster around their orbit.",
  },
  weather: {
    intro: "Let's explore the air around our planet.",
    prediction: "What do you think the gases in the air do to the heat?",
    challenge: "Add more gas to the air and watch the temperature.",
    reflection: "Did the planet get warmer or cooler?",
    explanation: "Some gases trap heat like a blanket, keeping the planet warm.",
  },
  climate: {
    intro: "Let's see how our planet stays warm.",
    prediction: "What do you think more greenhouse gas does to the temperature?",
    challenge: "Change the amount of gas and watch the thermometer.",
    reflection: "Warmer or cooler with more gas?",
    explanation: "More greenhouse gas traps more heat, so the planet gets warmer.",
  },
  atoms: {
    intro: "Everything is made of tiny atoms. Let's build one.",
    prediction: "What do you think changes if you add a proton?",
    challenge: "Add protons, neutrons and electrons and watch the atom.",
    reflection: "What changed when you added a proton?",
    explanation: "The number of protons decides which element the atom is!",
  },
  molecules: {
    intro: "Atoms join up to make molecules. Let's build some.",
    prediction: "What do you think you can build from these atoms?",
    challenge: "Join atoms together to make a real molecule.",
    reflection: "What molecule did you make?",
    explanation: "Atoms join in special ways to make molecules like water (H₂O).",
  },
  reactions: {
    intro: "In a reaction, atoms swap to make new things. Let's try.",
    prediction: "Do you think the number of atoms changes in a reaction?",
    challenge: "Balance the atoms on both sides of the reaction.",
    reflection: "Were there the same number of atoms on each side?",
    explanation: "Atoms are never lost — they just rearrange, so both sides must match.",
  },
  acids: {
    intro: "Some liquids are acids and some are bases. Let's test them.",
    prediction: "Do you think lemon juice is an acid or a base?",
    challenge: "Test different liquids and read the pH.",
    reflection: "Which liquids were acids?",
    explanation: "Low pH means acid (like lemon), high pH means base (like soap).",
  },
  area: {
    intro: "Area is how much space a shape covers. Let's build some.",
    prediction: "How many tiles do you think will fill this shape?",
    challenge: "Cover the shape with tiles and count them.",
    reflection: "How did you work out the area?",
    explanation: "Area is the number of squares that fit inside. Rows times columns!",
  },
  fractions: {
    intro: "Fractions are equal parts of a whole. Let's make some.",
    prediction: "Which do you think is bigger, one half or one quarter?",
    challenge: "Build a half, then a quarter, and compare them.",
    reflection: "Which fraction was bigger?",
    explanation: "The more equal pieces you cut, the smaller each piece is.",
  },
  multiplication: {
    intro: "Multiplication is fast adding of equal groups. Let's explore.",
    prediction: "What do you think 3 rows of 4 makes?",
    challenge: "Build rows and columns and count the total.",
    reflection: "How did rows and columns help you?",
    explanation: "Rows times columns gives the total — that's multiplication.",
  },
  counting: {
    intro: "Let's count and play with numbers.",
    prediction: "How many do you think there are?",
    challenge: "Count the objects and build the number.",
    reflection: "Were you right about how many?",
    explanation: "Counting carefully, one by one, helps us find how many.",
  },
  numbers: {
    intro: "Let's explore how numbers work.",
    prediction: "Which group do you think has more?",
    challenge: "Build and compare the numbers.",
    reflection: "Which was bigger?",
    explanation: "Bigger numbers are further along the number line.",
  },
  graphs: {
    intro: "Graphs turn numbers into pictures. Let's make one.",
    prediction: "What do you think the line will look like?",
    challenge: "Change the numbers and watch the line move.",
    reflection: "What changed the steepness of the line?",
    explanation: "Graphs show how one thing changes with another.",
  },
  probability: {
    intro: "Let's explore chance by dropping balls.",
    prediction: "Where do you think most balls will land?",
    challenge: "Drop lots of balls and watch the piles grow.",
    reflection: "Where did the biggest pile end up?",
    explanation: "Most balls land in the middle — that's the most likely spot.",
  },
  balance: {
    intro: "Let's keep things balanced and fair.",
    prediction: "What do you need to do to make both sides equal?",
    challenge: "Add and remove things until the scale balances.",
    reflection: "How did you make it balance?",
    explanation: "Both sides must be equal to balance — just like in maths.",
  },
};

const GENERIC: Template = {
  intro: "Let's explore this simulation and discover how it works.",
  prediction: "What do you think will happen when you start changing things?",
  challenge: "Try moving the sliders and buttons, and watch carefully.",
  reflection: "What was the most surprising thing you noticed?",
  explanation: "Scientists learn by trying things and watching what happens — just like you did!",
};

export function guidedFor(simOrSlug: PhetSimulation): GuidedPhetActivity {
  const s = simOrSlug;
  let tpl: Template = GENERIC;
  for (const topic of s.topics) {
    if (TEMPLATES[topic]) {
      tpl = TEMPLATES[topic];
      break;
    }
  }
  return {
    simSlug: s.slug,
    intro: tpl.intro,
    predictionQuestion: tpl.prediction,
    challenge: tpl.challenge,
    reflectionQuestion: tpl.reflection,
    explanation: tpl.explanation,
    rewardSeconds: 60,
  };
}
