// A broad, curated catalogue of free external learning labs that sit ALONGSIDE
// PhET in the Explore section.
//
// How each lab opens:
//  - engine  -> rendered in-page with the provider's official API (GeoGebra, Desmos)
//  - embedUrl -> rendered in-page in an iframe (sites that allow framing)
//  - neither -> opens in a new browser tab (sites that block framing or need a login)
//
// Many excellent sites (Polypad, Khan, most reading sites, Google Earth) set
// security headers that forbid embedding, so they are launch tiles by design to
// avoid a broken blank frame. Everything here is free for personal/educational use.

export type ExternalCategoryId =
  | "music"
  | "maths"
  | "science"
  | "coding"
  | "reading"
  | "languages"
  | "art"
  | "geography"
  | "history";

export interface ExternalCategory {
  id: ExternalCategoryId;
  label: string;
  emoji: string;
  blurb: string;
}

export const EXTERNAL_CATEGORIES: ExternalCategory[] = [
  { id: "maths", label: "Maths", emoji: "🧮", blurb: "Numbers, shapes, fractions, algebra" },
  { id: "science", label: "Science", emoji: "🔬", blurb: "Experiments and simulations" },
  { id: "geography", label: "Geography", emoji: "🗺️", blurb: "Maps, countries and our planet" },
  { id: "history", label: "History", emoji: "🏛️", blurb: "People and stories from the past" },
  { id: "music", label: "Music", emoji: "🎵", blurb: "Make songs, beats and sounds" },
  { id: "coding", label: "Coding", emoji: "💻", blurb: "Puzzles that teach programming" },
  { id: "reading", label: "Reading", emoji: "📖", blurb: "Phonics, books and word games" },
  { id: "languages", label: "French", emoji: "🇫🇷", blurb: "French words, games and audio" },
  { id: "art", label: "Art", emoji: "🎨", blurb: "Draw, create and play" },
];

export interface ExternalEngine {
  type: "geogebra" | "desmos";
  app: string;
}

export interface ExternalResource {
  id: string;
  title: string;
  emoji: string;
  description: string;
  provider: string;
  credit: string;
  category: ExternalCategoryId;
  url: string; // always present (new-tab fallback / launch tile)
  embedUrl?: string; // iframe in-page
  engine?: ExternalEngine; // official API in-page
  needsMic?: boolean;
}

const CML = "https://musiclab.chromeexperiments.com";
const CML_CREDIT = "Chrome Music Lab — a Google Chrome Experiment (musiclab.chromeexperiments.com)";
const GGB_CREDIT = "GeoGebra — free maths tools (geogebra.org)";
const DESMOS_CREDIT = "Desmos — free graphing & maths tools (desmos.com)";
const POLYPAD_CREDIT = "Polypad by Amplify / Mathigon (polypad.amplify.com)";
const CC_CREDIT = "The Concord Consortium — free STEM interactives (concord.org)";
const BLOCKLY_CREDIT = "Blockly Games — open-source coding games by Google (blockly.games)";
const DUCKSTERS_CREDIT = "Ducksters Education Site (ducksters.com)";
const CM4K_CREDIT = "Coolmath4Kids (coolmath4kids.com)";
const MOLVIEW_CREDIT = "MolView — open-source chemistry visualisation by Herman Bergwerf (molview.org)";
const FALSTAD_CREDIT = "CircuitJS — by Paul Falstad & Iain Sharp, free in the browser (falstad.com/circuit)";

const PHET_CREDIT =
  "PhET Interactive Simulations, University of Colorado Boulder — free and openly licensed (phet.colorado.edu)";
const MLC_CREDIT = "The Math Learning Center — free maths apps (mathlearningcenter.org)";

// PhET sims all embed from the same URL shape, so a helper keeps them tidy and
// typo-free. Every slug used below is one that already works in the PhET Lab.
function phet(slug: string, title: string, emoji: string, category: ExternalCategoryId, description: string): ExternalResource {
  const u = `https://phet.colorado.edu/sims/html/${slug}/latest/${slug}_en.html`;
  return { id: `phet-${slug}`, title, emoji, description, provider: "PhET", credit: PHET_CREDIT, category, url: u, embedUrl: u };
}

// Math Learning Center apps are standalone web apps that embed in an iframe.
function mlc(name: string, title: string, emoji: string, category: ExternalCategoryId, description: string): ExternalResource {
  const u = `https://apps.mathlearningcenter.org/${name}`;
  return { id: `mlc-${name}`, title, emoji, description, provider: "Math Learning Center", credit: MLC_CREDIT, category, url: u, embedUrl: u };
}

const MW_CREDIT =
  "Molecular Workbench by The Concord Consortium — open-source (BSD/MIT/Apache), built to be embedded (concord.org)";

// Concord's Molecular Workbench "Lab" interactives embed via an iframe whose URL
// carries the interactive path in the fragment. lab.concord.org serves https, so
// these load inside the app. The paths below come from Concord's own index.
function mw(id: string, path: string, title: string, emoji: string, description: string): ExternalResource {
  const u = `https://lab.concord.org/embeddable.html#interactives/${path}.json`;
  return { id: `mw-${id}`, title, emoji, description, provider: "Concord Consortium", credit: MW_CREDIT, category: "science", url: u, embedUrl: u };
}

export const EXTERNAL_RESOURCES: ExternalResource[] = [
  // ---- MATHS: GeoGebra apps (in-page via official API) ----------------------
  { id: "ggb-graphing", title: "Graphing Calculator", emoji: "📈", description: "Type an equation and watch it draw a graph.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/graphing", engine: { type: "geogebra", app: "graphing" } },
  { id: "ggb-geometry", title: "Geometry", emoji: "📐", description: "Draw points, lines and shapes and measure them.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/geometry", engine: { type: "geogebra", app: "geometry" } },
  { id: "ggb-suite", title: "Calculator Suite", emoji: "🧰", description: "Graphing, geometry and tables all in one.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/calculator", engine: { type: "geogebra", app: "suite" } },
  { id: "ggb-3d", title: "3D Calculator", emoji: "🧊", description: "Build and spin 3D shapes and surfaces.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/3d", engine: { type: "geogebra", app: "3d" } },
  { id: "ggb-scientific", title: "Scientific Calculator", emoji: "🔢", description: "A full calculator for sums big and small.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/scientific", engine: { type: "geogebra", app: "scientific" } },
  { id: "ggb-cas", title: "CAS Calculator", emoji: "🟰", description: "Solve and simplify algebra step by step.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/cas", engine: { type: "geogebra", app: "cas" } },
  { id: "ggb-classic", title: "Classic", emoji: "🧮", description: "The full GeoGebra toolbox for older explorers.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/classic", engine: { type: "geogebra", app: "classic" } },
  { id: "ggb-notes", title: "Maths Whiteboard", emoji: "🖍️", description: "A blank canvas to draw and work out maths.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/notes", engine: { type: "geogebra", app: "notes" } },

  // ---- MATHS: Desmos (in-page via official API) -----------------------------
  { id: "desmos-graph", title: "Graphing Calculator", emoji: "📊", description: "Plot graphs and sliders, beautifully.", provider: "Desmos", credit: DESMOS_CREDIT, category: "maths", url: "https://www.desmos.com/calculator", engine: { type: "desmos", app: "graphing" } },
  { id: "desmos-four", title: "Four-Function Calculator", emoji: "➕", description: "Add, subtract, multiply and divide.", provider: "Desmos", credit: DESMOS_CREDIT, category: "maths", url: "https://www.desmos.com/fourfunction", engine: { type: "desmos", app: "fourfunction" } },
  { id: "desmos-sci", title: "Scientific Calculator", emoji: "🔬", description: "A friendly scientific calculator.", provider: "Desmos", credit: DESMOS_CREDIT, category: "maths", url: "https://www.desmos.com/scientific", engine: { type: "desmos", app: "scientific" } },
  { id: "desmos-geometry", title: "Desmos Geometry", emoji: "📐", description: "Construct shapes, angles and transformations with Desmos's slick geometry tool.", provider: "Desmos", credit: DESMOS_CREDIT, category: "maths", url: "https://www.desmos.com/geometry" },
  { id: "desmos-3d", title: "Desmos 3D", emoji: "🧊", description: "Plot 3D surfaces and shapes in JavaScript and spin them around.", provider: "Desmos", credit: DESMOS_CREDIT, category: "maths", url: "https://www.desmos.com/3d" },
  { id: "observable", title: "Observable Notebooks", emoji: "📓", description: "JavaScript notebooks for maths and data visualisation — the JS answer to Jupyter. Best for older explorers.", provider: "Observable", credit: "Observable (observablehq.com)", category: "maths", url: "https://observablehq.com/" },
  { id: "p5js", title: "p5.js Editor", emoji: "🎨", description: "Write JavaScript to make maths art, patterns and animations, and run it instantly.", provider: "p5.js", credit: "p5.js — Processing Foundation (editor.p5js.org)", category: "coding", url: "https://editor.p5js.org/" },

  // ---- MATHS: manipulatives & more (new tab) --------------------------------
  { id: "polypad", title: "Polypad Playground", emoji: "🟦", description: "Number tiles, fraction bars, algebra tiles, shapes, dice and a tangram.", provider: "Polypad", credit: POLYPAD_CREDIT, category: "maths", url: "https://polypad.amplify.com/p" },
  { id: "polypad-lessons", title: "Polypad Activities", emoji: "🧩", description: "A big library of maths puzzles and lessons.", provider: "Polypad", credit: POLYPAD_CREDIT, category: "maths", url: "https://polypad.amplify.com/lessons" },
  { id: "mlc-apps", title: "Math Learning Center Apps", emoji: "🔟", description: "Number frames, number lines, money, fractions and more.", provider: "Math Learning Center", credit: "The Math Learning Center (mathlearningcenter.org)", category: "maths", url: "https://www.mathlearningcenter.org/apps" },
  { id: "coolmath4kids", title: "Coolmath4Kids", emoji: "😎", description: "The Coolmath4Kids home — games, puzzles, lessons and manipulatives for younger children.", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/" },
  { id: "cm4k-games", title: "Coolmath4Kids: Games", emoji: "🎮", description: "Arcade-style maths games for every grade (addition, times tables, division and more).", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/math-games" },
  { id: "cm4k-lessons", title: "Coolmath4Kids: Lessons", emoji: "📘", description: "Step-by-step lessons with quizzes — adding, subtracting, multiplying, dividing and more.", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/math-help" },
  { id: "cm4k-brain-teasers", title: "Coolmath4Kids: Brain Teasers", emoji: "🧩", description: "Clever puzzles like the Penny Triangle, Toothpick Squares and the Handshake Puzzle.", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/brain-teasers" },
  { id: "cm4k-manipulatives", title: "Coolmath4Kids: Manipulatives", emoji: "🔢", description: "Hands-on number tools to explore and understand maths visually.", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/manipulatives" },
  { id: "cm4k-ten-frame", title: "Ten Frame", emoji: "🟧", description: "Build number sense by making and breaking numbers within 5, 10 and 20.", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/manipulatives/ten-frame" },
  { id: "cm4k-base-ten", title: "Base Ten Blocks", emoji: "🧱", description: "Place-value blocks for counting, regrouping, adding and subtracting.", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/manipulatives/base-ten-blocks" },
  { id: "cm4k-number-line", title: "Number Line", emoji: "📏", description: "A flexible number line for mental arithmetic and number relationships.", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/manipulatives/number-line" },
  { id: "cm4k-pattern-blocks", title: "Pattern Blocks", emoji: "🔷", description: "Shape tiles for spatial reasoning, patterns and early geometry.", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/manipulatives/pattern-blocks" },
  { id: "cm4k-more", title: "Coolmath4Kids: More", emoji: "✨", description: "Printable flash cards plus fun geometry — polyhedra and tessellations.", provider: "Coolmath4Kids", credit: CM4K_CREDIT, category: "maths", url: "https://www.coolmath4kids.com/more" },
  { id: "nrich", title: "NRICH Maths", emoji: "🧠", description: "Rich maths problems and games from the University of Cambridge.", provider: "NRICH", credit: "NRICH — University of Cambridge (nrich.maths.org)", category: "maths", url: "https://nrich.maths.org/primary" },
  { id: "toytheater", title: "Toy Theater Maths", emoji: "🎯", description: "Simple maths games and virtual manipulatives.", provider: "Toy Theater", credit: "Toy Theater (toytheater.com)", category: "maths", url: "https://toytheater.com/category/math-games/" },

  // ---- SCIENCE (new tab, plus PhET lives in its own science lab) -------------
  { id: "cc-interactives", title: "Concord Interactives", emoji: "🧪", description: "A huge free library of science and maths interactives.", provider: "Concord Consortium", credit: CC_CREDIT, category: "science", url: "https://learn.concord.org/interactives" },
  { id: "cc-codap", title: "CODAP Data Lab", emoji: "📂", description: "Play with real data, drag to make graphs and maps.", provider: "Concord Consortium", credit: CC_CREDIT, category: "science", url: "https://codap.concord.org/app/" },
  { id: "ophysics", title: "oPhysics", emoji: "⚛️", description: "Hundreds of interactive physics simulations.", provider: "oPhysics", credit: "oPhysics: Interactive Physics Simulations (ophysics.com)", category: "science", url: "https://www.ophysics.com/" },
  { id: "physics-aviary", title: "The Physics Aviary", emoji: "🦅", description: "Physics games, labs and problem simulators.", provider: "The Physics Aviary", credit: "The Physics Aviary (thephysicsaviary.com)", category: "science", url: "https://www.thephysicsaviary.com/Physics/singextentprograms.php" },
  { id: "climate-kids", title: "NASA Climate Kids", emoji: "🌎", description: "Games and activities about Earth and space.", provider: "NASA", credit: "NASA Climate Kids (climatekids.nasa.gov)", category: "science", url: "https://climatekids.nasa.gov/" },
  { id: "ducksters-science", title: "Ducksters Science", emoji: "🔭", description: "Easy-to-read science articles and quizzes.", provider: "Ducksters", credit: DUCKSTERS_CREDIT, category: "science", url: "https://www.ducksters.com/science/" },
  { id: "explorify", title: "Explorify", emoji: "🔎", description: "Think-like-a-scientist activities — Odd One Out, Zoom In, What If and big questions. Free sign-up.", provider: "Explorify", credit: "Explorify — Wellcome / PSTT / STEM Learning (explorify.uk)", category: "science", url: "https://explorify.uk/" },
  { id: "molview", title: "Molecule Builder", emoji: "🧬", description: "Draw a molecule, then press a button to turn it into a spinning 3D model. You can search real chemicals too.", provider: "MolView", credit: MOLVIEW_CREDIT, category: "science", url: "https://molview.org/", embedUrl: "https://molview.org/" },
  { id: "molview-water", title: "Water in 3D", emoji: "💧", description: "Spin a real water molecule (two hydrogen atoms and one oxygen) around in 3D.", provider: "MolView", credit: MOLVIEW_CREDIT, category: "science", url: "https://embed.molview.org/v1/?mode=balls&cid=962&bg=white", embedUrl: "https://embed.molview.org/v1/?mode=balls&cid=962&bg=white" },
  { id: "molview-caffeine", title: "Caffeine in 3D", emoji: "☕", description: "See the molecule that makes coffee and tea wake you up, spinning in 3D.", provider: "MolView", credit: MOLVIEW_CREDIT, category: "science", url: "https://embed.molview.org/v1/?mode=balls&cid=2519&bg=white", embedUrl: "https://embed.molview.org/v1/?mode=balls&cid=2519&bg=white" },
  { id: "molview-sugar", title: "Sugar in 3D", emoji: "🍬", description: "Spin a sugar molecule (sucrose) and see all the atoms that make it sweet.", provider: "MolView", credit: MOLVIEW_CREDIT, category: "science", url: "https://embed.molview.org/v1/?mode=balls&cid=5988&bg=white", embedUrl: "https://embed.molview.org/v1/?mode=balls&cid=5988&bg=white" },
  { id: "falstad-circuit", title: "Circuit Lab", emoji: "🔌", description: "Build real electric circuits with batteries, switches, bulbs and wires, and watch the current flow. A proper electronics lab.", provider: "Falstad / Sharp", credit: FALSTAD_CREDIT, category: "science", url: "https://www.falstad.com/circuit/circuitjs.html", embedUrl: "https://www.falstad.com/circuit/circuitjs.html" },

  // ---- PhET: the best of maths & algebra, embedded --------------------------
  phet("area-builder", "Area Builder", "🟩", "maths", "Build shapes from tiles and discover area and perimeter."),
  phet("area-model-multiplication", "Area Model Multiplication", "🔢", "maths", "See multiplication as the area of a rectangle."),
  phet("arithmetic", "Times Tables Arithmetic", "✖️", "maths", "Practise multiplication, division and factors as a game."),
  phet("fraction-matcher", "Fraction Matcher", "🍕", "maths", "Match pictures of fractions to the right numbers."),
  phet("build-a-fraction", "Build a Fraction", "🧩", "maths", "Make fractions from parts to hit a target."),
  phet("number-line-integers", "Number Line: Integers", "➖", "maths", "Jump along the number line into negative numbers."),
  phet("function-builder", "Function Machine", "⚙️", "maths", "Drop numbers into a machine and work out the hidden rule."),
  phet("graphing-lines", "Graphing Lines", "📈", "maths", "Move a line around and watch its equation change."),
  phet("equality-explorer-basics", "Balance Equations", "⚖️", "maths", "Keep both sides equal on a balance to solve for the unknown."),
  phet("plinko-probability", "Plinko Probability", "🎰", "maths", "Drop balls down a pin board and watch chance make a pattern."),
  phet("vector-addition", "Vector Addition", "➡️", "maths", "Add arrows together to learn about vectors."),

  // ---- PhET: more of the best maths & algebra, embedded --------------------
  phet("area-model-introduction", "Area Model: Intro", "🟫", "maths", "Build rectangles from parts to see multiplication and area."),
  phet("fractions-intro", "Fractions: Intro", "🍰", "maths", "Make fractions with bars, circles and number lines."),
  phet("fractions-equality", "Equivalent Fractions", "⚖️", "maths", "Find different fractions that are worth exactly the same."),
  phet("make-a-ten", "Make a Ten", "🔟", "maths", "Add cleverly by making friendly tens."),
  phet("number-play", "Number Play", "🔢", "maths", "Count, build and compare numbers up to twenty."),
  phet("number-compare", "Number Compare", "🔼", "maths", "Which group has more? Compare two numbers side by side."),
  phet("graphing-slope-intercept", "Graphing: y = mx + b", "📈", "maths", "Slide a straight line and read off its equation."),
  phet("graphing-quadratics", "Graphing Quadratics", "🛝", "maths", "Bend a parabola and explore how its equation changes."),
  phet("unit-rates", "Unit Rates Shopping", "🛒", "maths", "Shop for the best value and work out unit prices."),
  phet("proportion-playground", "Proportion Playground", "🎨", "maths", "Mix paints and juice to explore ratios and proportion."),
  phet("trig-tour", "Trig Tour", "🌀", "maths", "Travel around a circle to discover sine and cosine."),
  phet("curve-fitting", "Curve Fitting", "✏️", "maths", "Drop points and fit a curve through them."),
  phet("calculus-grapher", "Calculus Grapher", "📉", "maths", "Draw a function and watch its slope graph appear."),
  phet("mean-share-and-balance", "Mean: Share & Balance", "🍬", "maths", "Share out sweets evenly to understand the average."),

  // ---- Real Python in the browser: turtle graphics = maths art with code ----
  { id: "trinket-turtle", title: "Python Turtle", emoji: "🐢", description: "Write real Python code and watch a turtle draw shapes, spirals and patterns. Press Run, then change the numbers and run it again.", provider: "Trinket", credit: "Python turtle on Trinket — example by the Raspberry Pi Foundation (trinket.io)", category: "maths", url: "https://trinket.io/embed/python/b89b6f5457", embedUrl: "https://trinket.io/embed/python/b89b6f5457" },
  { id: "sagecell", title: "Sage Maths Cell", emoji: "🧮", description: "A real Python and Sage maths engine. Plot graphs, factor numbers, solve equations and explore algebra and calculus — type maths and press Run.", provider: "SageMath", credit: "SageMathCell — open-source SageMath, built to be embedded (sagecell.sagemath.org)", category: "maths", url: "https://sagecell.sagemath.org/", embedUrl: "/labs/sagecell.html" },

  // ---- More of the best maths on the web (these open in a new tab) ----------
  { id: "maths-is-fun", title: "Maths Is Fun", emoji: "😀", description: "Clear explanations, puzzles, games and tools for every maths topic.", provider: "Maths Is Fun", credit: "Maths Is Fun (mathsisfun.com)", category: "maths", url: "https://www.mathsisfun.com/" },
  { id: "transum", title: "Transum Maths", emoji: "🧮", description: "Daily maths starters, puzzles, games and challenges.", provider: "Transum", credit: "Transum (transum.org)", category: "maths", url: "https://www.transum.org/" },
  { id: "solveme-mobiles", title: "SolveMe Mobiles", emoji: "🎐", description: "Hanging-mobile balance puzzles that quietly teach algebra.", provider: "SolveMe Puzzles", credit: "SolveMe Puzzles — EDC (solveme.edc.org)", category: "maths", url: "https://solveme.edc.org/mobiles/" },
  { id: "wodb", title: "Which One Doesn't Belong?", emoji: "🤔", description: "Look at four things and argue which is the odd one out — every answer can be right.", provider: "WODB", credit: "Which One Doesn't Belong? (wodb.ca)", category: "maths", url: "https://wodb.ca/" },
  { id: "estimation180", title: "Estimation 180", emoji: "📷", description: "Sharpen number sense with a new estimation challenge each day.", provider: "Estimation 180", credit: "Estimation 180 — Andrew Stadel (estimation180.com)", category: "maths", url: "https://estimation180.com/" },
  { id: "open-middle", title: "Open Middle", emoji: "🎯", description: "Challenging problems with one answer but many ways to reach it.", provider: "Open Middle", credit: "Open Middle (openmiddle.com)", category: "maths", url: "https://www.openmiddle.com/" },
  { id: "coolmath-games", title: "Coolmath Games", emoji: "🧊", description: "Logic, number and strategy games that are genuinely fun.", provider: "Coolmath Games", credit: "Coolmath Games (coolmathgames.com)", category: "maths", url: "https://www.coolmathgames.com/" },
  { id: "mathpickle", title: "Math Pickle", emoji: "🥒", description: "Hard, playful maths puzzles sorted by school year.", provider: "Math Pickle", credit: "Math Pickle (mathpickle.com)", category: "maths", url: "https://mathpickle.com/" },
  { id: "trinket-python", title: "Python Playground", emoji: "🐍", description: "A full Python editor in the browser — write code and run it instantly, with no setup.", provider: "Trinket", credit: "Trinket — run Python in your browser (trinket.io)", category: "coding", url: "https://trinket.io/python" },
  { id: "hour-of-python", title: "Hour of Python", emoji: "⏱️", description: "Gentle, interactive lessons that teach Python from scratch.", provider: "Trinket", credit: "Hour of Python — Trinket (hourofpython.com)", category: "coding", url: "https://hourofpython.com/" },

  // ---- PhET: the best of physics, chemistry, space & biology, embedded ------
  phet("forces-and-motion-basics", "Forces and Motion", "🛷", "science", "Push, pull and play tug-of-war to learn about forces."),
  phet("balancing-act", "Balancing Act", "🤸", "science", "Balance a seesaw with different weights and distances."),
  phet("energy-skate-park-basics", "Energy Skate Park", "🛹", "science", "Skate a ramp and watch energy change as you go."),
  phet("pendulum-lab", "Pendulum Lab", "🕰️", "science", "Swing a pendulum and find out what changes its speed."),
  phet("projectile-motion", "Projectile Motion", "🎯", "science", "Fire a cannon and explore how things fly through the air."),
  phet("circuit-construction-kit-dc", "Circuit Construction Kit", "🔋", "science", "Wire up batteries, bulbs and switches to build circuits."),
  phet("balloons-and-static-electricity", "Static Electricity", "🎈", "science", "Rub a balloon on a jumper and zap things with static."),
  phet("magnets-and-electromagnets", "Magnets & Electromagnets", "🧲", "science", "Play with magnets and turn electricity into magnetism."),
  phet("bending-light", "Bending Light", "🌈", "science", "Shine a beam through water and glass and watch it bend."),
  phet("density", "Density: Float or Sink", "🛟", "science", "Find out why some things float and others sink."),
  phet("gravity-and-orbits", "Gravity and Orbits", "🪐", "science", "Move the Sun, Earth and Moon and watch gravity at work."),
  phet("my-solar-system", "My Solar System", "☀️", "science", "Build your own solar system and set the planets spinning."),
  phet("wave-on-a-string", "Wave on a String", "〰️", "science", "Wiggle a string and send waves travelling along it."),
  phet("natural-selection", "Natural Selection", "🐰", "science", "Watch rabbits change over time to survive their world."),
  phet("build-an-atom", "Build an Atom", "⚛️", "science", "Add protons, neutrons and electrons to build any atom."),
  phet("states-of-matter-basics", "States of Matter", "🧊", "science", "Heat and cool things into solids, liquids and gases."),
  phet("ph-scale-basics", "pH Scale: Acids & Bases", "🧪", "science", "Test everyday liquids to see if they are acid or base."),

  // ---- More PhET chemistry: reactions, gases & solutions, embedded ----------
  phet("reactions-and-rates", "Reactions and Rates", "💥", "science", "Make molecules collide and watch a chemical reaction happen."),
  phet("reactants-products-and-leftovers", "Reactants & Leftovers", "🥪", "science", "Combine ingredients into products and see what is left over."),
  phet("balancing-chemical-equations", "Balancing Equations", "⚗️", "science", "Balance the atoms on both sides of a chemical reaction."),
  phet("concentration", "Concentration: Dissolving", "🧫", "science", "Dissolve a solid in water and watch the colour get stronger."),
  phet("gases-intro", "Gases Intro", "🎈", "science", "Pump gas into a box and watch the tiny particles bounce."),
  phet("gas-properties", "Gas Properties", "🌡️", "science", "Squeeze and heat a gas to explore pressure and temperature."),
  phet("molecule-shapes-basics", "Molecule Shapes", "🔺", "science", "Build molecules and see the 3D shapes they make."),

  // ---- Concord Molecular Workbench: watch real atoms & molecules, embedded ---
  mw("oil-and-water", "sam/intermolecular-attractions/3-1-oil-and-water", "Oil & Water: Dissolving", "🧪", "Find out why some things dissolve in water and others do not, by watching the molecules."),
  mw("dye-diffusion", "sam/diffusion/1-dropping-dye-on-click", "Diffusion of a Drop", "💧", "Drop dye into water and watch the molecules spread out and mix all by themselves."),
  mw("diffusion-temperature", "sam/diffusion/2-temperature", "Diffusion & Temperature", "🌡️", "See how heating the water makes the dye spread out faster."),
  mw("gas-molecules", "sam/phase-change/2-two-types-of-gases", "Gas Particles", "💨", "Watch how the particles in a gas zoom around and fill all the space."),
  mw("liquid-molecules", "sam/phase-change/3-liquids", "Liquid Particles", "🌊", "See how the particles in a liquid slide and tumble past each other."),
  mw("solid-molecules", "sam/phase-change/4-solids", "Solid Particles", "🧊", "Look at how the particles in a solid lock together and only wobble."),
  mw("phase-change", "sam/phase-change/6-phase-changes-caused-by-energy-input", "Phase Change", "♨️", "Add or take away energy and watch a substance change between solid, liquid and gas."),
  mw("gas-pressure", "sam/gas-laws/2-what-is-pressure", "What is Pressure?", "🎈", "See how gas particles bumping the walls of a box make pressure."),
  mw("volume-pressure", "sam/gas-laws/3-volume-pressure-relationship", "Volume & Pressure", "🗜️", "Squeeze a gas into a smaller space and watch the pressure rise."),
  mw("attractions", "sam/intermolecular-attractions/1-introduction", "Molecule Attractions", "🧲", "Discover how all tiny particles gently pull on each other, a bit like magnets."),

  // ---- Math Learning Center: hands-on maths apps, embedded ------------------
  mlc("number-pieces", "Number Pieces", "🧱", "maths", "Place-value blocks for tens and ones, adding and regrouping."),
  mlc("number-frames", "Number Frames", "🔲", "maths", "Ten-frames and dots to build strong number sense."),
  mlc("number-line", "Number Line", "📏", "maths", "A flexible number line for counting and jumps."),
  mlc("number-rack", "Number Rack", "🧮", "maths", "Sliding beads (a rekenrek) for adding and subtracting."),
  mlc("money-pieces", "Money Pieces", "💷", "maths", "Coins and notes to count money and make change."),
  mlc("fractions", "Fractions", "🍰", "maths", "Bars and circles to build and compare fractions."),
  mlc("pattern-shapes", "Pattern Shapes", "🔷", "maths", "Fit pattern blocks together to explore shapes and angles."),
  mlc("geoboard", "Geoboard", "📐", "maths", "Stretch bands on pegs to make shapes and measure area."),
  mlc("math-clock", "Math Clock", "🕓", "maths", "Play with clocks and learn to tell the time."),
  mlc("partial-product-finder", "Partial Products", "✳️", "maths", "Break a multiplication into easy partial products."),

  // ---- More best-of activities (these open in a new tab) --------------------
  { id: "topmarks", title: "Topmarks Maths", emoji: "🎯", description: "Brilliant maths games including Hit the Button for quick recall.", provider: "Topmarks", credit: "Topmarks Education (topmarks.co.uk)", category: "maths", url: "https://www.topmarks.co.uk/maths-games/7-11-years/" },
  { id: "mathsframe", title: "Mathsframe", emoji: "🖼️", description: "Hundreds of UK primary maths games matched to the curriculum.", provider: "Mathsframe", credit: "Mathsframe (mathsframe.co.uk)", category: "maths", url: "https://mathsframe.co.uk/" },
  { id: "mathplayground", title: "Math Playground", emoji: "🛝", description: "Maths games, logic puzzles and thinking blocks.", provider: "Math Playground", credit: "Math Playground (mathplayground.com)", category: "maths", url: "https://www.mathplayground.com/" },
  { id: "gregtang", title: "Greg Tang Math", emoji: "🧠", description: "Clever number games like Kakooma that build mental maths.", provider: "Greg Tang Math", credit: "Greg Tang Math (gregtangmath.com)", category: "maths", url: "https://gregtangmath.com/games" },
  { id: "spaceplace", title: "NASA Space Place", emoji: "🚀", description: "Space games, crafts and easy science straight from NASA.", provider: "NASA", credit: "NASA Space Place (spaceplace.nasa.gov)", category: "science", url: "https://spaceplace.nasa.gov/" },
  { id: "natgeokids", title: "Nat Geo Kids", emoji: "🐾", description: "Animals, science and our planet, packed with facts and quizzes.", provider: "National Geographic", credit: "National Geographic Kids (kids.nationalgeographic.com)", category: "science", url: "https://kids.nationalgeographic.com/" },
  { id: "dkfindout-science", title: "DK Find Out: Science", emoji: "🔬", description: "Colourful, trustworthy science articles and quizzes.", provider: "DK", credit: "DK Find Out (dkfindout.com)", category: "science", url: "https://www.dkfindout.com/uk/science/" },
  { id: "mystery-science", title: "Mystery Science", emoji: "❓", description: "Free mini science lessons that answer the big questions kids ask.", provider: "Mystery Science", credit: "Mystery Science (mysteryscience.com)", category: "science", url: "https://mysteryscience.com/" },
  { id: "seterra", title: "Seterra Geography", emoji: "🗺️", description: "Map quizzes for countries, capitals, rivers and flags.", provider: "Seterra", credit: "Seterra / GeoGuessr (online.seterra.com)", category: "geography", url: "https://online.seterra.com/" },
  { id: "world-geography-games", title: "World Geography Games", emoji: "🌐", description: "Fun map and flag games for every continent.", provider: "World Geography Games", credit: "World Geography Games (world-geography-games.com)", category: "geography", url: "https://world-geography-games.com/en/" },
  { id: "dkfindout-history", title: "DK Find Out: History", emoji: "🏺", description: "Explore dinosaurs, Egypt, Romans, Vikings and more.", provider: "DK", credit: "DK Find Out (dkfindout.com)", category: "history", url: "https://www.dkfindout.com/uk/history/" },
  { id: "hour-of-code", title: "Hour of Code", emoji: "⏱️", description: "Short, fun coding activities with favourite characters.", provider: "Code.org", credit: "Hour of Code (hourofcode.com)", category: "coding", url: "https://hourofcode.com/uk/learn" },
  { id: "storyline-online", title: "Storyline Online", emoji: "📖", description: "Famous actors read lovely picture books aloud.", provider: "SAG-AFTRA Foundation", credit: "Storyline Online (storylineonline.net)", category: "reading", url: "https://storylineonline.net/" },
  { id: "teach-monster", title: "Teach Your Monster to Read", emoji: "👾", description: "A free, award-winning phonics adventure game.", provider: "Usborne Foundation", credit: "Teach Your Monster (teachyourmonster.org)", category: "reading", url: "https://www.teachyourmonster.org/" },
  { id: "autodraw", title: "AutoDraw", emoji: "🖌️", description: "Sketch roughly and watch AI tidy it into a neat drawing.", provider: "Google", credit: "AutoDraw — Google (autodraw.com)", category: "art", url: "https://www.autodraw.com/" },
  { id: "tate-kids", title: "Tate Kids", emoji: "🎨", description: "Make art, play games and explore famous artworks.", provider: "Tate", credit: "Tate Kids (tate.org.uk/kids)", category: "art", url: "https://www.tate.org.uk/kids" },

  // ---- GEOGRAPHY (new tab) --------------------------------------------------
  { id: "natgeo-kids", title: "Nat Geo Kids", emoji: "🌐", description: "Countries, animals and amazing places around the world.", provider: "National Geographic Kids", credit: "National Geographic Kids (kids.nationalgeographic.com)", category: "geography", url: "https://kids.nationalgeographic.com/" },
  { id: "world-geo-games", title: "World Geography Games", emoji: "🗺️", description: "Fun map quizzes: countries, capitals, flags, rivers.", provider: "World Geography Games", credit: "World Geography Games (world-geography-games.com)", category: "geography", url: "https://world-geography-games.com/en/" },
  { id: "google-earth", title: "Google Earth", emoji: "🛰️", description: "Fly anywhere on the planet in 3D.", provider: "Google Earth", credit: "Google Earth (earth.google.com)", category: "geography", url: "https://earth.google.com/web/" },
  { id: "ducksters-geo", title: "Ducksters Geography", emoji: "📍", description: "Country facts, maps and quizzes for kids.", provider: "Ducksters", credit: DUCKSTERS_CREDIT, category: "geography", url: "https://www.ducksters.com/geography/" },

  // ---- HISTORY (new tab) ----------------------------------------------------
  { id: "bbc-bitesize", title: "BBC Bitesize", emoji: "📺", description: "History, science and more for primary school.", provider: "BBC Bitesize", credit: "BBC Bitesize (bbc.co.uk/bitesize)", category: "history", url: "https://www.bbc.co.uk/bitesize/primary" },
  { id: "dk-findout", title: "DK Find Out!", emoji: "🔎", description: "Colourful facts about history, dinosaurs, space and more.", provider: "DK Find Out!", credit: "DK Find Out! (dkfindout.com)", category: "history", url: "https://www.dkfindout.com/uk/history/" },
  { id: "ducksters-history", title: "Ducksters History", emoji: "🏺", description: "Ancient civilisations and big moments, kid-friendly.", provider: "Ducksters", credit: DUCKSTERS_CREDIT, category: "history", url: "https://www.ducksters.com/history/" },
  { id: "smithsonian-lab", title: "Smithsonian Learning Lab", emoji: "🏛️", description: "Explore real museum objects and collections.", provider: "Smithsonian", credit: "Smithsonian Learning Lab (learninglab.si.edu)", category: "history", url: "https://learninglab.si.edu/" },

  // ---- MUSIC: ALL 14 Chrome Music Lab experiments (iframe in-page) ----------
  { id: "cml-song-maker", title: "Song Maker", emoji: "🎼", description: "Draw notes on a grid to compose a whole song.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Song-Maker/`, embedUrl: `${CML}/Song-Maker/` },
  { id: "cml-rhythm", title: "Rhythm", emoji: "🥁", description: "Tap out beats and build drum patterns.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Rhythm/`, embedUrl: `${CML}/Rhythm/` },
  { id: "cml-melody", title: "Melody Maker", emoji: "🎶", description: "Invent short melodies and hear them loop.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Melody-Maker/`, embedUrl: `${CML}/Melody-Maker/` },
  { id: "cml-chords", title: "Chords", emoji: "🎹", description: "Press a key and see how chords are built.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Chords/`, embedUrl: `${CML}/Chords/` },
  { id: "cml-arpeggios", title: "Arpeggios", emoji: "✨", description: "Hear chords played one note at a time.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Arpeggios/`, embedUrl: `${CML}/Arpeggios/` },
  { id: "cml-piano-roll", title: "Piano Roll", emoji: "🎵", description: "See music roll by like an old player piano.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Piano-Roll/`, embedUrl: `${CML}/Piano-Roll/` },
  { id: "cml-kandinsky", title: "Kandinsky", emoji: "🎨", description: "Draw shapes and turn them into music.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "art", url: `${CML}/Kandinsky/`, embedUrl: `${CML}/Kandinsky/` },
  { id: "cml-shared-piano", title: "Shared Piano", emoji: "🎹", description: "Play a piano together in real time.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Shared-Piano/`, embedUrl: `${CML}/Shared-Piano/` },
  { id: "cml-spectrogram", title: "Spectrogram", emoji: "🌈", description: "See the hidden shapes inside sounds.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Spectrogram/`, embedUrl: `${CML}/Spectrogram/`, needsMic: true },
  { id: "cml-sound-waves", title: "Sound Waves", emoji: "〰️", description: "Watch how sound makes the air wobble.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Sound-Waves/`, embedUrl: `${CML}/Sound-Waves/` },
  { id: "cml-oscillators", title: "Oscillators", emoji: "📈", description: "Stretch and squeeze waves to change the sound.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Oscillators/`, embedUrl: `${CML}/Oscillators/` },
  { id: "cml-strings", title: "Strings", emoji: "🎻", description: "Pluck strings and hear the pitch change.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Strings/`, embedUrl: `${CML}/Strings/` },
  { id: "cml-harmonics", title: "Harmonics", emoji: "🔔", description: "Discover the notes hiding inside one note.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Harmonics/`, embedUrl: `${CML}/Harmonics/` },
  { id: "cml-voice-spinner", title: "Voice Spinner", emoji: "🌀", description: "Record your voice and spin it fast and slow.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Voice-Spinner/`, embedUrl: `${CML}/Voice-Spinner/`, needsMic: true },

  // ---- CODING (new tab) -----------------------------------------------------
  { id: "blockly-puzzle", title: "Puzzle", emoji: "🧩", description: "A gentle first step into coding blocks.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/puzzle?lang=en" },
  { id: "blockly-maze", title: "Maze", emoji: "🚧", description: "Snap blocks together to solve a maze.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/maze?lang=en" },
  { id: "blockly-bird", title: "Bird", emoji: "🐦", description: "Use logic to help a bird find its worm.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/bird?lang=en" },
  { id: "blockly-turtle", title: "Turtle", emoji: "🐢", description: "Write code to draw pictures with a turtle.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/turtle?lang=en" },
  { id: "blockly-movie", title: "Movie", emoji: "🎬", description: "Code a little animated movie.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/movie?lang=en" },
  { id: "blockly-music", title: "Music", emoji: "🎼", description: "Make tunes by programming notes.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/music?lang=en" },
  { id: "scratch", title: "Scratch", emoji: "🐱", description: "Build your own games and animations with code blocks.", provider: "Scratch (MIT)", credit: "Scratch — MIT Media Lab (scratch.mit.edu)", category: "coding", url: "https://scratch.mit.edu/projects/editor/" },
  { id: "code-org", title: "Code.org", emoji: "💡", description: "Hour of Code and full coding courses for kids.", provider: "Code.org", credit: "Code.org (code.org)", category: "coding", url: "https://code.org/student/elementary" },
  { id: "typingclub", title: "TypingClub", emoji: "⌨️", description: "Learn to touch-type with fun lessons.", provider: "TypingClub", credit: "TypingClub (typingclub.com)", category: "coding", url: "https://www.typingclub.com/" },

  // ---- ART (new tab) --------------------------------------------------------
  { id: "quick-draw", title: "Quick, Draw!", emoji: "✏️", description: "Doodle and let the computer guess your drawing.", provider: "Google", credit: "Quick, Draw! by Google (quickdraw.withgoogle.com)", category: "art", url: "https://quickdraw.withgoogle.com/" },
  { id: "sketchpad", title: "Sketchpad", emoji: "🖌️", description: "A full online drawing and painting canvas.", provider: "Sketch.io", credit: "Sketchpad by Sketch.io (sketch.io/sketchpad)", category: "art", url: "https://sketch.io/sketchpad/" },

  // ---- READING (new tab; logins happen on the site) -------------------------
  { id: "starfall", title: "Starfall", emoji: "⭐", description: "Phonics games, songs and books for new readers.", provider: "Starfall", credit: "Starfall Education Foundation (starfall.com)", category: "reading", url: "https://www.starfall.com/h/" },
  { id: "tymtr", title: "Teach Your Monster to Read", emoji: "👾", description: "Award-winning phonics adventure.", provider: "Teach Your Monster", credit: "Teach Your Monster / Usborne Foundation (teachyourmonster.org)", category: "reading", url: "https://www.teachyourmonster.org/" },
  { id: "oxford-owl", title: "Oxford Owl eBooks", emoji: "🦉", description: "A free library of levelled story books (sign in on the site).", provider: "Oxford Owl", credit: "Oxford Owl — Oxford University Press (oxfordowl.co.uk)", category: "reading", url: "https://www.oxfordowl.co.uk/for-home/find-a-book/library-page/" },
  { id: "storyline", title: "Storyline Online", emoji: "📚", description: "Famous actors read lovely picture books aloud.", provider: "Storyline Online", credit: "Storyline Online — SAG-AFTRA Foundation (storylineonline.net)", category: "reading", url: "https://storylineonline.net/" },
  { id: "languageguide-fr", title: "French Visual Vocabulary", emoji: "🖼️", description: "Tap or hover over pictures to hear French words, with speaking and listening challenges.", provider: "LanguageGuide", credit: "LanguageGuide.org", category: "languages", url: "https://www.languageguide.org/french/vocabulary/" },
  { id: "french-games-net", title: "French Games", emoji: "🎯", description: "Over 100 topics with native audio, gentle lessons and 14 quick games.", provider: "French-Games.net", credit: "French-Games.net", category: "languages", url: "https://www.french-games.net/" },
  { id: "digital-dialects-fr", title: "Digital Dialects: French", emoji: "🗨️", description: "Simple free French games with audio for beginners — numbers, colours, food and more.", provider: "Digital Dialects", credit: "Digital Dialects (digitaldialects.com)", category: "languages", url: "https://www.digitaldialects.com/French.htm" },
  { id: "helpfulgames-fr", title: "Helpful Games: French", emoji: "🎲", description: "Vocabulary games for young learners — numbers, colours, days, months and more.", provider: "Helpful Games", credit: "Helpful Games (helpfulgames.com)", category: "languages", url: "https://www.helpfulgames.com/subjects/french/" },
];

export function resourcesByCategory(cat: ExternalCategoryId): ExternalResource[] {
  return EXTERNAL_RESOURCES.filter((r) => r.category === cat);
}

export function searchExternal(query: string): ExternalResource[] {
  const q = query.trim().toLowerCase();
  if (!q) return EXTERNAL_RESOURCES;
  return EXTERNAL_RESOURCES.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.provider.toLowerCase().includes(q),
  );
}

export function isInPage(r: ExternalResource): boolean {
  return Boolean(r.embedUrl || r.engine);
}
