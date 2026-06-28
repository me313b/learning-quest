// A curated, comprehensive catalogue of free external learning labs that sit
// ALONGSIDE PhET in the Explore section. Each entry can either be embedded in an
// iframe (when the provider allows framing) or opened in a new tab (when it does
// not). Everything here is free to use; embedding is permitted for the apps that
// expose an embed/iframe option (GeoGebra, Desmos, Chrome Music Lab, etc.).
//
// Credits / attribution are shown in the player for every resource.

export type ExternalCategoryId = "music" | "maths" | "science" | "coding" | "reading" | "art";

export interface ExternalCategory {
  id: ExternalCategoryId;
  label: string;
  emoji: string;
  blurb: string;
}

export const EXTERNAL_CATEGORIES: ExternalCategory[] = [
  { id: "music", label: "Music", emoji: "🎵", blurb: "Make songs, beats and sounds" },
  { id: "maths", label: "Maths", emoji: "🧮", blurb: "Numbers, shapes, fractions, algebra" },
  { id: "science", label: "Science", emoji: "🔬", blurb: "Experiments and simulations" },
  { id: "coding", label: "Coding", emoji: "💻", blurb: "Puzzles that teach programming" },
  { id: "reading", label: "Reading", emoji: "📖", blurb: "Phonics, books and word games" },
  { id: "art", label: "Art", emoji: "🎨", blurb: "Draw, create and play" },
];

export interface ExternalResource {
  id: string;
  title: string;
  emoji: string;
  description: string;
  provider: string;
  credit: string; // attribution line shown in the player
  category: ExternalCategoryId;
  url: string; // always present — opens in a new tab
  embedUrl?: string; // present when the resource can be embedded in an iframe
  needsMic?: boolean; // request microphone permission in the iframe
}

const CML = "https://musiclab.chromeexperiments.com";
const CML_CREDIT = "Chrome Music Lab — a Google Chrome Experiment (musiclab.chromeexperiments.com)";
const GGB_CREDIT = "GeoGebra — free maths tools (geogebra.org)";
const DESMOS_CREDIT = "Desmos — free graphing & maths tools (desmos.com)";
const POLYPAD_CREDIT = "Polypad by Amplify / Mathigon (polypad.amplify.com)";
const CC_CREDIT = "The Concord Consortium — free STEM interactives (concord.org)";
const BLOCKLY_CREDIT = "Blockly Games — open-source coding games by Google (blockly.games)";

export const EXTERNAL_RESOURCES: ExternalResource[] = [
  // --- Chrome Music Lab: ALL 14 experiments ---------------------------------
  { id: "cml-song-maker", title: "Song Maker", emoji: "🎼", description: "Draw notes on a grid to compose a whole song, then play it back.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Song-Maker/`, embedUrl: `${CML}/Song-Maker/` },
  { id: "cml-rhythm", title: "Rhythm", emoji: "🥁", description: "Tap out beats and build drum patterns with friendly animals.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Rhythm/`, embedUrl: `${CML}/Rhythm/` },
  { id: "cml-melody", title: "Melody Maker", emoji: "🎶", description: "Invent short melodies and hear them loop.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Melody-Maker/`, embedUrl: `${CML}/Melody-Maker/` },
  { id: "cml-chords", title: "Chords", emoji: "🎹", description: "Press a key and see how chords are built from notes.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Chords/`, embedUrl: `${CML}/Chords/` },
  { id: "cml-arpeggios", title: "Arpeggios", emoji: "✨", description: "Hear chords played one note at a time in pretty patterns.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Arpeggios/`, embedUrl: `${CML}/Arpeggios/` },
  { id: "cml-piano-roll", title: "Piano Roll", emoji: "🎵", description: "See music roll by like an old player piano.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Piano-Roll/`, embedUrl: `${CML}/Piano-Roll/` },
  { id: "cml-kandinsky", title: "Kandinsky", emoji: "🎨", description: "Draw shapes and lines, then listen to them turn into music.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "art", url: `${CML}/Kandinsky/`, embedUrl: `${CML}/Kandinsky/` },
  { id: "cml-shared-piano", title: "Shared Piano", emoji: "🎹", description: "Play a piano together with others in real time.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Shared-Piano/`, embedUrl: `${CML}/Shared-Piano/` },
  { id: "cml-spectrogram", title: "Spectrogram", emoji: "🌈", description: "See the hidden shapes inside sounds and your own voice.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Spectrogram/`, embedUrl: `${CML}/Spectrogram/`, needsMic: true },
  { id: "cml-sound-waves", title: "Sound Waves", emoji: "〰️", description: "Watch how sound makes the air wobble.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Sound-Waves/`, embedUrl: `${CML}/Sound-Waves/` },
  { id: "cml-oscillators", title: "Oscillators", emoji: "📈", description: "Stretch and squeeze waves to change the sound.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Oscillators/`, embedUrl: `${CML}/Oscillators/` },
  { id: "cml-strings", title: "Strings", emoji: "🎻", description: "Pluck strings of different lengths and hear the pitch change.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Strings/`, embedUrl: `${CML}/Strings/` },
  { id: "cml-harmonics", title: "Harmonics", emoji: "🔔", description: "Discover the gentle notes hiding inside one note.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "science", url: `${CML}/Harmonics/`, embedUrl: `${CML}/Harmonics/` },
  { id: "cml-voice-spinner", title: "Voice Spinner", emoji: "🌀", description: "Record your voice and spin it fast and slow.", provider: "Chrome Music Lab", credit: CML_CREDIT, category: "music", url: `${CML}/Voice-Spinner/`, embedUrl: `${CML}/Voice-Spinner/`, needsMic: true },

  // --- GeoGebra: all the main free apps -------------------------------------
  { id: "ggb-graphing", title: "Graphing Calculator", emoji: "📈", description: "Type an equation and watch it draw a graph.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/graphing", embedUrl: "https://www.geogebra.org/graphing" },
  { id: "ggb-geometry", title: "Geometry", emoji: "📐", description: "Draw points, lines and shapes and measure them.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/geometry", embedUrl: "https://www.geogebra.org/geometry" },
  { id: "ggb-3d", title: "3D Calculator", emoji: "🧊", description: "Build and spin 3D shapes and surfaces.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/3d", embedUrl: "https://www.geogebra.org/3d" },
  { id: "ggb-scientific", title: "Scientific Calculator", emoji: "🔢", description: "A full calculator for sums big and small.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/scientific", embedUrl: "https://www.geogebra.org/scientific" },
  { id: "ggb-suite", title: "Calculator Suite", emoji: "🧰", description: "Graphing, geometry and more all in one place.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/calculator", embedUrl: "https://www.geogebra.org/calculator" },
  { id: "ggb-classic", title: "Classic", emoji: "🧮", description: "The full GeoGebra toolbox for older explorers.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/classic", embedUrl: "https://www.geogebra.org/classic" },
  { id: "ggb-cas", title: "CAS Calculator", emoji: "🟰", description: "Solve and simplify algebra step by step.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/cas", embedUrl: "https://www.geogebra.org/cas" },
  { id: "ggb-notes", title: "Maths Whiteboard", emoji: "🖍️", description: "A blank canvas to draw and work out maths.", provider: "GeoGebra", credit: GGB_CREDIT, category: "maths", url: "https://www.geogebra.org/notes", embedUrl: "https://www.geogebra.org/notes" },

  // --- Desmos: the free calculators -----------------------------------------
  { id: "desmos-graph", title: "Graphing Calculator", emoji: "📊", description: "Plot graphs and sliders, beautifully.", provider: "Desmos", credit: DESMOS_CREDIT, category: "maths", url: "https://www.desmos.com/calculator", embedUrl: "https://www.desmos.com/calculator" },
  { id: "desmos-four", title: "Four-Function Calculator", emoji: "➕", description: "Add, subtract, multiply and divide.", provider: "Desmos", credit: DESMOS_CREDIT, category: "maths", url: "https://www.desmos.com/fourfunction", embedUrl: "https://www.desmos.com/fourfunction" },
  { id: "desmos-sci", title: "Scientific Calculator", emoji: "🔬", description: "A friendly scientific calculator.", provider: "Desmos", credit: DESMOS_CREDIT, category: "maths", url: "https://www.desmos.com/scientific", embedUrl: "https://www.desmos.com/scientific" },
  { id: "desmos-geo", title: "Geometry", emoji: "📐", description: "Construct and explore shapes.", provider: "Desmos", credit: DESMOS_CREDIT, category: "maths", url: "https://www.desmos.com/geometry", embedUrl: "https://www.desmos.com/geometry" },

  // --- Polypad: virtual manipulatives ---------------------------------------
  { id: "polypad-canvas", title: "Polypad Playground", emoji: "🟦", description: "Number tiles, fraction bars, algebra tiles, shapes, dice, spinners and a tangram — drag and play.", provider: "Polypad", credit: POLYPAD_CREDIT, category: "maths", url: "https://polypad.amplify.com/p", embedUrl: "https://polypad.amplify.com/p" },
  { id: "polypad-lessons", title: "Polypad Activities", emoji: "🧩", description: "A big library of maths puzzles and lessons.", provider: "Polypad", credit: POLYPAD_CREDIT, category: "maths", url: "https://polypad.amplify.com/lessons" },

  // --- Concord Consortium: science & maths interactives ---------------------
  { id: "cc-interactives", title: "Concord Interactives", emoji: "🧪", description: "A huge free library of science and maths interactives.", provider: "Concord Consortium", credit: CC_CREDIT, category: "science", url: "https://learn.concord.org/interactives" },
  { id: "cc-codap", title: "CODAP Data Lab", emoji: "📂", description: "Play with real data, drag to make graphs and maps.", provider: "Concord Consortium", credit: CC_CREDIT, category: "science", url: "https://codap.concord.org/app/" },

  // --- Coding: Blockly Games (open source) ----------------------------------
  { id: "blockly-puzzle", title: "Puzzle", emoji: "🧩", description: "A gentle first step into coding blocks.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/puzzle?lang=en" },
  { id: "blockly-maze", title: "Maze", emoji: "🚧", description: "Snap blocks together to guide a player through a maze.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/maze?lang=en" },
  { id: "blockly-bird", title: "Bird", emoji: "🐦", description: "Use simple logic to help a bird find its worm.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/bird?lang=en" },
  { id: "blockly-turtle", title: "Turtle", emoji: "🐢", description: "Write code to draw pictures with a turtle.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/turtle?lang=en" },
  { id: "blockly-movie", title: "Movie", emoji: "🎬", description: "Code a little animated movie.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/movie?lang=en" },
  { id: "blockly-music", title: "Music", emoji: "🎼", description: "Make tunes by programming notes.", provider: "Blockly Games", credit: BLOCKLY_CREDIT, category: "coding", url: "https://blockly.games/music?lang=en" },
  { id: "scratch", title: "Scratch", emoji: "🐱", description: "Build your own games and animations with code blocks.", provider: "Scratch (MIT)", credit: "Scratch — MIT Media Lab (scratch.mit.edu)", category: "coding", url: "https://scratch.mit.edu/projects/editor/" },

  // --- Reading & phonics (open in a new tab) --------------------------------
  { id: "starfall", title: "Starfall", emoji: "⭐", description: "Phonics games, songs and books for new readers.", provider: "Starfall", credit: "Starfall Education Foundation (starfall.com)", category: "reading", url: "https://www.starfall.com/h/" },
  { id: "tymtr", title: "Teach Your Monster to Read", emoji: "👾", description: "Award-winning phonics adventure across friendly worlds.", provider: "Teach Your Monster", credit: "Teach Your Monster / Usborne Foundation (teachyourmonster.org)", category: "reading", url: "https://www.teachyourmonster.org/" },
  { id: "oxford-owl", title: "Oxford Owl eBooks", emoji: "🦉", description: "A free library of levelled story books to read together.", provider: "Oxford Owl", credit: "Oxford Owl — Oxford University Press (oxfordowl.co.uk)", category: "reading", url: "https://www.oxfordowl.co.uk/for-home/find-a-book/library-page/" },
  { id: "storyline", title: "Storyline Online", emoji: "📚", description: "Famous actors read lovely picture books aloud.", provider: "Storyline Online", credit: "Storyline Online — SAG-AFTRA Foundation (storylineonline.net)", category: "reading", url: "https://storylineonline.net/" },
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
