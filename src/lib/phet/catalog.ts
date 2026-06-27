// A catalog of PhET Interactive Simulations (University of Colorado Boulder).
//
// LICENSING — important:
// PhET's HTML5 simulations ("Regular HTML Simulation Files") are licensed under
// Creative Commons Attribution 4.0 (CC-BY-4.0). They are free to use and embed
// for educational use as long as attribution is shown. We embed them via PhET's
// official simulation URLs in an iframe (the supported "Embed" method); we do
// NOT copy or host PhET source code. The PhET name and logo are trademarks of
// the University of Colorado and are used here for attribution only.
//
// Attribution shown to users: "<Title> by PhET Interactive Simulations,
// University of Colorado Boulder, licensed under CC-BY-4.0 (https://phet.colorado.edu)."
//
// COMMERCIAL USE: PhET defines commercial use broadly (ad-supported sites,
// monetised channels, paid resources). If this app ever becomes commercial,
// public, paid or widely distributed, a commercial licence / partnership with
// CU Boulder may be required. Do not assume commercial rights from this file.
// See https://phet.colorado.edu/en/licensing

export const PHET_ATTRIBUTION =
  "Simulations by PhET Interactive Simulations, University of Colorado Boulder, licensed under CC-BY-4.0.";
export const PHET_HOME = "https://phet.colorado.edu";
export const PHET_LICENSE_URL = "https://phet.colorado.edu/en/licensing";

export type PhetSubject = "physics" | "maths" | "chemistry" | "biology" | "earth-space";
export type PhetLevel = "early-primary" | "primary" | "middle" | "secondary" | "advanced";
export type AgeSuitability = "good-for-6-7" | "with-parent" | "older-child";

// Friendly, child-facing groupings mapped onto PhET's subjects/topics.
export type ChildCategoryId =
  | "things-move"
  | "electricity"
  | "light-sound"
  | "water-air-heat"
  | "space-earth"
  | "numbers-shapes"
  | "atoms-molecules"
  | "life-body";

export interface PhetSimulation {
  slug: string;
  title: string;
  subject: PhetSubject;
  category: ChildCategoryId;
  topics: string[];
  level: PhetLevel;
  ageSuitability: AgeSuitability;
  description: string;
  phetUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  language: string;
  attribution: string;
}

// Build a full entry from compact data. URLs follow PhET's stable patterns:
//   sim page:   https://phet.colorado.edu/en/simulations/<slug>
//   embeddable: https://phet.colorado.edu/sims/html/<slug>/latest/<slug>_en.html
//   thumbnail:  https://phet.colorado.edu/sims/html/<slug>/latest/<slug>-600.png
function sim(
  slug: string,
  title: string,
  subject: PhetSubject,
  category: ChildCategoryId,
  level: PhetLevel,
  age: AgeSuitability,
  topics: string[],
  description: string,
): PhetSimulation {
  return {
    slug,
    title,
    subject,
    category,
    topics,
    level,
    ageSuitability: age,
    description,
    phetUrl: `https://phet.colorado.edu/en/simulations/${slug}`,
    embedUrl: `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_en.html`,
    thumbnailUrl: `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}-600.png`,
    language: "en",
    attribution: `${title} by PhET Interactive Simulations, University of Colorado Boulder, licensed under CC-BY-4.0 (https://phet.colorado.edu).`,
  };
}

export interface ChildCategory {
  id: ChildCategoryId;
  label: string;
  emoji: string;
  color: string; // hex, for colour-coding cards
  blurb: string;
}

export const CHILD_CATEGORIES: ChildCategory[] = [
  { id: "things-move", label: "Things Move", emoji: "🏎️", color: "#E03C28", blurb: "Forces, motion, gravity and energy" },
  { id: "electricity", label: "Electricity & Circuits", emoji: "⚡", color: "#F8B617", blurb: "Circuits, magnets and static" },
  { id: "light-sound", label: "Light & Sound", emoji: "🌈", color: "#4AEDD9", blurb: "Light, colour, waves and sound" },
  { id: "water-air-heat", label: "Water, Air & Heat", emoji: "💧", color: "#2C7BE5", blurb: "States of matter, pressure and heat" },
  { id: "space-earth", label: "Space & Earth", emoji: "🪐", color: "#7A5CCC", blurb: "Planets, orbits and our climate" },
  { id: "numbers-shapes", label: "Numbers & Shapes", emoji: "🔢", color: "#17DD62", blurb: "Counting, fractions, area and graphs" },
  { id: "atoms-molecules", label: "Tiny Things: Atoms & Molecules", emoji: "⚛️", color: "#9C5CE0", blurb: "Atoms, molecules and reactions" },
  { id: "life-body", label: "Life & Body", emoji: "🧬", color: "#3FA34D", blurb: "Living things and how bodies work" },
];

export const SUBJECT_LABELS: Record<PhetSubject, string> = {
  physics: "Physics",
  maths: "Maths & Statistics",
  chemistry: "Chemistry",
  biology: "Biology",
  "earth-space": "Earth & Space",
};

// "Easy / Medium / Advanced" buckets for the child-facing difficulty filter.
export function difficultyOf(s: PhetSimulation): "easy" | "medium" | "advanced" {
  if (s.ageSuitability === "good-for-6-7") return "easy";
  if (s.ageSuitability === "with-parent") return "medium";
  return "advanced";
}

// --------------------------------------------------------------------------- //
// The catalog. A broad selection of PhET's HTML5 simulations, grouped by a
// child-friendly category. Easily extended — add a sim() line.
// --------------------------------------------------------------------------- //
export const PHET_SIMS: PhetSimulation[] = [
  // ---- Things Move: forces, motion, energy --------------------------------
  sim("forces-and-motion-basics", "Forces and Motion: Basics", "physics", "things-move", "primary", "good-for-6-7", ["motion", "forces", "friction"], "Push objects, add friction, and tug-of-war to see what makes things move."),
  sim("forces-and-motion", "Forces and Motion", "physics", "things-move", "middle", "with-parent", ["motion", "forces", "acceleration"], "Explore how forces change the speed of an object."),
  sim("balancing-act", "Balancing Act", "physics", "things-move", "primary", "good-for-6-7", ["balance", "forces", "weight"], "Put objects on a seesaw and discover how to balance it."),
  sim("projectile-motion", "Projectile Motion", "physics", "things-move", "middle", "with-parent", ["motion", "gravity", "angle"], "Launch objects and see how angle and speed change where they land."),
  sim("energy-skate-park-basics", "Energy Skate Park: Basics", "physics", "things-move", "primary", "good-for-6-7", ["energy", "motion", "gravity"], "Build a skate track and watch energy change as the skater rolls."),
  sim("energy-skate-park", "Energy Skate Park", "physics", "things-move", "middle", "with-parent", ["energy", "motion", "friction"], "Explore kinetic and potential energy on a skate track."),
  sim("energy-forms-and-changes", "Energy Forms and Changes", "physics", "things-move", "middle", "with-parent", ["energy", "heat"], "Heat things up and watch energy move and change form."),
  sim("collision-lab", "Collision Lab", "physics", "things-move", "middle", "with-parent", ["motion", "collisions"], "Crash balls together and explore momentum."),
  sim("pendulum-lab", "Pendulum Lab", "physics", "things-move", "middle", "with-parent", ["motion", "gravity", "energy"], "Swing a pendulum and find what changes its rhythm."),
  sim("masses-and-springs-basics", "Masses and Springs: Basics", "physics", "things-move", "primary", "good-for-6-7", ["springs", "weight", "motion"], "Hang weights on springs and watch them bounce."),
  sim("masses-and-springs", "Masses and Springs", "physics", "things-move", "middle", "with-parent", ["springs", "energy", "gravity"], "Explore springs, weights and energy."),
  sim("hookes-law", "Hooke's Law", "physics", "things-move", "middle", "with-parent", ["springs", "forces"], "Stretch springs and see the force grow."),
  sim("gravity-force-lab-basics", "Gravity Force Lab: Basics", "physics", "things-move", "primary", "good-for-6-7", ["gravity", "forces"], "See how two objects pull on each other with gravity."),
  sim("gravity-force-lab", "Gravity Force Lab", "physics", "things-move", "middle", "with-parent", ["gravity", "forces", "mass"], "Change mass and distance to explore the pull of gravity."),

  // ---- Electricity & Circuits ---------------------------------------------
  sim("circuit-construction-kit-dc", "Circuit Construction Kit: DC", "physics", "electricity", "middle", "with-parent", ["circuits", "electricity"], "Build circuits with batteries, wires and bulbs."),
  sim("circuit-construction-kit-dc-virtual-lab", "Circuit Construction Kit: DC - Virtual Lab", "physics", "electricity", "middle", "with-parent", ["circuits", "electricity"], "A circuit playground with meters to measure as you build."),
  sim("circuit-construction-kit-ac", "Circuit Construction Kit: AC", "physics", "electricity", "secondary", "older-child", ["circuits", "electricity"], "Build alternating-current circuits with more components."),
  sim("ohms-law", "Ohm's Law", "physics", "electricity", "primary", "good-for-6-7", ["circuits", "electricity"], "See how voltage and resistance change the current."),
  sim("resistance-in-a-wire", "Resistance in a Wire", "physics", "electricity", "middle", "with-parent", ["circuits", "electricity"], "Change a wire's size and material to change its resistance."),
  sim("capacitor-lab-basics", "Capacitor Lab: Basics", "physics", "electricity", "secondary", "older-child", ["circuits", "electricity"], "Charge up a capacitor and explore how it stores energy."),
  sim("charges-and-fields", "Charges and Fields", "physics", "electricity", "secondary", "older-child", ["charge", "electricity"], "Place charges and map the electric field they make."),
  sim("coulombs-law", "Coulomb's Law", "physics", "electricity", "secondary", "older-child", ["charge", "forces"], "Explore the force between electric charges."),
  sim("balloons-and-static-electricity", "Balloons and Static Electricity", "physics", "electricity", "primary", "good-for-6-7", ["static", "charge"], "Rub a balloon on a jumper and watch static electricity."),
  sim("john-travoltage", "John Travoltage", "physics", "electricity", "primary", "good-for-6-7", ["static", "charge"], "Build up static and zap the doorknob!"),
  sim("faradays-law", "Faraday's Law", "physics", "electricity", "middle", "with-parent", ["magnets", "electricity"], "Move a magnet through a coil to make electricity."),
  sim("faradays-electromagnetic-lab", "Faraday's Electromagnetic Lab", "physics", "electricity", "secondary", "older-child", ["magnets", "electricity"], "Explore magnets, coils and electromagnets."),
  sim("magnets-and-electromagnets", "Magnets and Electromagnets", "physics", "electricity", "middle", "with-parent", ["magnets", "electricity"], "Compare a bar magnet with an electromagnet."),
  sim("magnet-and-compass", "Magnet and Compass", "physics", "electricity", "middle", "with-parent", ["magnets"], "See how a compass points near a magnet."),

  // ---- Light & Sound (and waves) ------------------------------------------
  sim("color-vision", "Color Vision", "physics", "light-sound", "primary", "good-for-6-7", ["light", "colour"], "Mix coloured light and see what colours you can make."),
  sim("bending-light", "Bending Light", "physics", "light-sound", "middle", "with-parent", ["light"], "Shine light into water and watch it bend."),
  sim("geometric-optics-basics", "Geometric Optics: Basics", "physics", "light-sound", "primary", "good-for-6-7", ["light", "lenses"], "Use a lens to make images of objects with light."),
  sim("geometric-optics", "Geometric Optics", "physics", "light-sound", "middle", "with-parent", ["light", "lenses"], "Explore lenses, mirrors and how images form."),
  sim("wave-on-a-string", "Wave on a String", "physics", "light-sound", "primary", "good-for-6-7", ["waves", "sound"], "Wiggle a string and watch waves travel along it."),
  sim("waves-intro", "Waves Intro", "physics", "light-sound", "primary", "good-for-6-7", ["waves", "sound", "light"], "Make waves with water, sound and light."),
  sim("sound-waves", "Sound Waves", "physics", "light-sound", "middle", "with-parent", ["sound", "waves"], "See how sound travels as waves through the air."),
  sim("wave-interference", "Wave Interference", "physics", "light-sound", "middle", "with-parent", ["waves", "light", "sound"], "Make waves overlap and watch the patterns."),
  sim("normal-modes", "Normal Modes", "physics", "light-sound", "advanced", "older-child", ["waves"], "Explore the special patterns waves can make."),
  sim("blackbody-spectrum", "Blackbody Spectrum", "physics", "light-sound", "secondary", "older-child", ["light", "colour", "heat"], "See how hot objects glow with different colours."),
  sim("molecules-and-light", "Molecules and Light", "chemistry", "light-sound", "middle", "with-parent", ["light", "molecules"], "Shine light on molecules and see what happens."),

  // ---- Water, Air & Heat (states of matter, pressure, density) ------------
  sim("states-of-matter-basics", "States of Matter: Basics", "chemistry", "water-air-heat", "primary", "good-for-6-7", ["heat", "molecules", "weather"], "Heat and cool things to make solids, liquids and gases."),
  sim("states-of-matter", "States of Matter", "chemistry", "water-air-heat", "middle", "with-parent", ["heat", "molecules"], "Explore how temperature changes a substance's state."),
  sim("gases-intro", "Gases Intro", "chemistry", "water-air-heat", "primary", "good-for-6-7", ["gas", "heat", "pressure"], "Pump gas into a box and watch the particles bounce."),
  sim("gas-properties", "Gas Properties", "chemistry", "water-air-heat", "middle", "with-parent", ["gas", "pressure", "heat"], "Squeeze and heat a gas to explore pressure and temperature."),
  sim("diffusion", "Diffusion", "chemistry", "water-air-heat", "middle", "with-parent", ["gas", "molecules"], "Watch particles spread out and mix."),
  sim("friction", "Friction", "physics", "water-air-heat", "primary", "good-for-6-7", ["friction", "heat", "molecules"], "Rub two things together and watch them heat up."),
  sim("under-pressure", "Under Pressure", "physics", "water-air-heat", "primary", "good-for-6-7", ["pressure", "water"], "Dive underwater and feel how pressure changes."),
  sim("density", "Density", "physics", "water-air-heat", "primary", "good-for-6-7", ["density", "water", "float"], "Find out why some things float and others sink."),
  sim("buoyancy-basics", "Buoyancy: Basics", "physics", "water-air-heat", "primary", "good-for-6-7", ["density", "water", "float"], "Drop blocks in water and see what floats."),
  sim("buoyancy", "Buoyancy", "physics", "water-air-heat", "middle", "with-parent", ["density", "water", "float"], "Explore why objects float or sink in water."),

  // ---- Space & Earth -------------------------------------------------------
  sim("gravity-and-orbits", "Gravity and Orbits", "physics", "space-earth", "primary", "good-for-6-7", ["gravity", "space", "planets"], "Move the sun, earth and moon and watch them orbit."),
  sim("my-solar-system", "My Solar System", "physics", "space-earth", "middle", "with-parent", ["gravity", "space", "planets"], "Build your own solar system and watch the planets dance."),
  sim("keplers-laws", "Kepler's Laws", "physics", "space-earth", "secondary", "older-child", ["space", "planets", "orbits"], "Explore the rules that planets follow as they orbit."),
  sim("greenhouse-effect", "The Greenhouse Effect", "chemistry", "space-earth", "middle", "with-parent", ["weather", "climate", "heat"], "See how gases in the air keep our planet warm."),

  // ---- Numbers & Shapes (maths) -------------------------------------------
  sim("area-builder", "Area Builder", "maths", "numbers-shapes", "primary", "good-for-6-7", ["area", "shapes", "fractions"], "Build shapes with tiles and find their area."),
  sim("area-model-introduction", "Area Model Introduction", "maths", "numbers-shapes", "primary", "good-for-6-7", ["area", "multiplication"], "Use rectangles to understand multiplication."),
  sim("area-model-multiplication", "Area Model Multiplication", "maths", "numbers-shapes", "middle", "with-parent", ["area", "multiplication"], "Break numbers apart to multiply with rectangles."),
  sim("area-model-decimals", "Area Model Decimals", "maths", "numbers-shapes", "middle", "with-parent", ["area", "decimals"], "Multiply decimals using area models."),
  sim("arithmetic", "Arithmetic", "maths", "numbers-shapes", "primary", "good-for-6-7", ["multiplication", "times-tables"], "Practise times tables and number facts as a game."),
  sim("make-a-ten", "Make a Ten", "maths", "numbers-shapes", "early-primary", "good-for-6-7", ["addition", "counting"], "Add numbers by making friendly tens."),
  sim("number-play", "Number Play", "maths", "numbers-shapes", "early-primary", "good-for-6-7", ["counting", "numbers"], "Count, build and play with numbers up to twenty."),
  sim("number-compare", "Number Compare", "maths", "numbers-shapes", "early-primary", "good-for-6-7", ["counting", "numbers"], "Compare groups and find which has more."),
  sim("fraction-matcher", "Fraction Matcher", "maths", "numbers-shapes", "primary", "good-for-6-7", ["fractions", "shapes"], "Match pictures and numbers that show the same fraction."),
  sim("fractions-intro", "Fractions: Intro", "maths", "numbers-shapes", "primary", "good-for-6-7", ["fractions"], "Build fractions with circles, bars and number lines."),
  sim("fractions-equality", "Fractions: Equality", "maths", "numbers-shapes", "middle", "with-parent", ["fractions"], "Discover when two fractions are equal."),
  sim("build-a-fraction", "Build a Fraction", "maths", "numbers-shapes", "primary", "good-for-6-7", ["fractions"], "Build fractions to match a target."),
  sim("number-line-integers", "Number Line: Integers", "maths", "numbers-shapes", "middle", "with-parent", ["numbers", "negative"], "Explore positive and negative numbers on a line."),
  sim("plinko-probability", "Plinko Probability", "maths", "numbers-shapes", "primary", "good-for-6-7", ["probability", "counting"], "Drop balls and watch where they pile up."),
  sim("equality-explorer-basics", "Equality Explorer: Basics", "maths", "numbers-shapes", "primary", "good-for-6-7", ["balance", "addition"], "Balance a scale to understand equals."),
  sim("equality-explorer", "Equality Explorer", "maths", "numbers-shapes", "middle", "with-parent", ["balance", "algebra"], "Keep a scale balanced to solve for unknowns."),
  sim("function-builder-basics", "Function Builder: Basics", "maths", "numbers-shapes", "primary", "good-for-6-7", ["patterns", "functions"], "Send shapes through a machine and spot the pattern."),
  sim("function-builder", "Function Builder", "maths", "numbers-shapes", "middle", "with-parent", ["patterns", "functions"], "Build machines that change numbers and shapes."),
  sim("unit-rates", "Unit Rates", "maths", "numbers-shapes", "middle", "with-parent", ["rates", "proportion"], "Shop and cook to explore rates and best buys."),
  sim("proportion-playground", "Proportion Playground", "maths", "numbers-shapes", "middle", "with-parent", ["proportion", "ratio"], "Mix and build to explore proportions."),
  sim("ratio-and-proportion", "Ratio and Proportion", "maths", "numbers-shapes", "middle", "with-parent", ["ratio", "proportion"], "Move two hands to keep a ratio just right."),
  sim("mean-share-and-balance", "Mean: Share and Balance", "maths", "numbers-shapes", "middle", "with-parent", ["average", "sharing"], "Share things out fairly to understand the mean."),
  sim("graphing-lines", "Graphing Lines", "maths", "numbers-shapes", "secondary", "older-child", ["graphs", "algebra"], "Plot and explore straight-line graphs."),
  sim("graphing-slope-intercept", "Graphing Slope-Intercept", "maths", "numbers-shapes", "secondary", "older-child", ["graphs", "algebra"], "Explore slope and intercept of a line."),
  sim("graphing-quadratics", "Graphing Quadratics", "maths", "numbers-shapes", "advanced", "older-child", ["graphs", "algebra"], "Explore parabolas and how they change."),
  sim("curve-fitting", "Curve Fitting", "maths", "numbers-shapes", "advanced", "older-child", ["graphs", "statistics"], "Fit a curve to data points."),
  sim("least-squares-regression", "Least-Squares Regression", "maths", "numbers-shapes", "advanced", "older-child", ["graphs", "statistics"], "Find the best-fit line through data."),
  sim("center-and-variability", "Center and Variability", "maths", "numbers-shapes", "advanced", "older-child", ["statistics", "average"], "Explore mean, median and how spread out data is."),
  sim("trig-tour", "Trig Tour", "maths", "numbers-shapes", "advanced", "older-child", ["trigonometry", "graphs"], "Take a tour of sine, cosine and tangent."),
  sim("vector-addition", "Vector Addition", "maths", "numbers-shapes", "secondary", "older-child", ["vectors"], "Add arrows together to explore vectors."),
  sim("calculus-grapher", "Calculus Grapher", "maths", "numbers-shapes", "advanced", "older-child", ["calculus", "graphs"], "Draw a curve and see its slope and area."),

  // ---- Tiny Things: Atoms & Molecules (chemistry) -------------------------
  sim("build-an-atom", "Build an Atom", "chemistry", "atoms-molecules", "primary", "good-for-6-7", ["atoms", "molecules"], "Add protons, neutrons and electrons to build an atom."),
  sim("build-a-molecule", "Build a Molecule", "chemistry", "atoms-molecules", "primary", "good-for-6-7", ["atoms", "molecules"], "Join atoms together to build real molecules."),
  sim("build-a-nucleus", "Build a Nucleus", "chemistry", "atoms-molecules", "middle", "with-parent", ["atoms"], "Build the centre of an atom and watch it change."),
  sim("molecule-shapes-basics", "Molecule Shapes: Basics", "chemistry", "atoms-molecules", "primary", "good-for-6-7", ["molecules", "shapes"], "See the 3D shapes that molecules make."),
  sim("molecule-shapes", "Molecule Shapes", "chemistry", "atoms-molecules", "middle", "with-parent", ["molecules", "shapes"], "Explore why molecules take certain shapes."),
  sim("balancing-chemical-equations", "Balancing Chemical Equations", "chemistry", "atoms-molecules", "middle", "with-parent", ["reactions", "molecules"], "Balance the atoms on both sides of a reaction."),
  sim("reactants-products-and-leftovers", "Reactants, Products and Leftovers", "chemistry", "atoms-molecules", "middle", "with-parent", ["reactions"], "Make sandwiches and molecules to learn about reactions."),
  sim("ph-scale-basics", "pH Scale: Basics", "chemistry", "atoms-molecules", "primary", "good-for-6-7", ["acids", "water"], "Test everyday liquids to see if they're acid or base."),
  sim("ph-scale", "pH Scale", "chemistry", "atoms-molecules", "middle", "with-parent", ["acids", "water"], "Explore the pH of many liquids."),
  sim("concentration", "Concentration", "chemistry", "atoms-molecules", "middle", "with-parent", ["solutions", "water"], "Mix solutions and watch the colour change."),
  sim("isotopes-and-atomic-mass", "Isotopes and Atomic Mass", "chemistry", "atoms-molecules", "secondary", "older-child", ["atoms"], "Explore isotopes and how we measure atomic mass."),
  sim("atomic-interactions", "Atomic Interactions", "chemistry", "atoms-molecules", "secondary", "older-child", ["atoms", "molecules"], "See how atoms attract and repel each other."),
  sim("molecule-polarity", "Molecule Polarity", "chemistry", "atoms-molecules", "secondary", "older-child", ["molecules"], "Explore why some molecules are lopsided."),
  sim("reactions-and-rates", "Reactions and Rates", "chemistry", "atoms-molecules", "secondary", "older-child", ["reactions"], "Discover what makes reactions fast or slow."),
  sim("acid-base-solutions", "Acid-Base Solutions", "chemistry", "atoms-molecules", "secondary", "older-child", ["acids"], "Explore acids and bases in solution."),
  sim("models-of-the-hydrogen-atom", "Models of the Hydrogen Atom", "chemistry", "atoms-molecules", "advanced", "older-child", ["atoms"], "Compare the famous models of the atom."),

  // ---- Life & Body (biology) ----------------------------------------------
  sim("natural-selection", "Natural Selection", "biology", "life-body", "middle", "with-parent", ["evolution", "animals"], "Watch rabbits change over time as the world changes."),
  sim("gene-expression-essentials", "Gene Expression Essentials", "biology", "life-body", "advanced", "older-child", ["dna", "cells"], "See how cells read DNA to build proteins."),
  sim("neuron", "Neuron", "biology", "life-body", "advanced", "older-child", ["body", "cells"], "Send a signal down a nerve cell."),
];

// All distinct topic tags, handy for the tag row in the UI.
export const PHET_TAGS = Array.from(new Set(PHET_SIMS.flatMap((s) => s.topics))).sort();

export function getSim(slug: string): PhetSimulation | undefined {
  return PHET_SIMS.find((s) => s.slug === slug);
}

export function simsByCategory(categoryId: ChildCategoryId): PhetSimulation[] {
  return PHET_SIMS.filter((s) => s.category === categoryId);
}

// Simulations most suitable for a 6-7 year old, for the default child view.
export function recommendedSims(): PhetSimulation[] {
  return PHET_SIMS.filter((s) => s.ageSuitability === "good-for-6-7");
}

// A small "Recommended for today" set that rotates daily so it feels fresh.
export function recommendedToday(count = 6): PhetSimulation[] {
  const pool = recommendedSims();
  const day = Math.floor(Date.now() / 86_400_000);
  const start = pool.length ? day % pool.length : 0;
  const out: PhetSimulation[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    out.push(pool[(start + i) % pool.length]);
  }
  return out;
}

export function searchSims(query: string): PhetSimulation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PHET_SIMS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.topics.some((t) => t.toLowerCase().includes(q)) ||
      SUBJECT_LABELS[s.subject].toLowerCase().includes(q),
  );
}
