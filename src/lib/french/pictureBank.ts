// A bank of friendly "figures" (emoji) the child names in French. Each item has
// the French word, its English meaning, and a few accepted spellings/variants
// (with or without the article) so a 6-7 year old's answer is judged kindly.

export interface PictureItem {
  emoji: string;
  fr: string; // canonical French (with article, for display/teaching)
  en: string;
  accept: string[]; // normalised-acceptable answers (lowercase, no accents needed)
}

export const PICTURE_BANK: PictureItem[] = [
  // Animals
  { emoji: "🐶", fr: "le chien", en: "dog", accept: ["chien", "le chien", "un chien"] },
  { emoji: "🐱", fr: "le chat", en: "cat", accept: ["chat", "le chat", "un chat"] },
  { emoji: "🐭", fr: "la souris", en: "mouse", accept: ["souris", "la souris", "une souris"] },
  { emoji: "🐰", fr: "le lapin", en: "rabbit", accept: ["lapin", "le lapin", "un lapin"] },
  { emoji: "🦊", fr: "le renard", en: "fox", accept: ["renard", "le renard", "un renard"] },
  { emoji: "🐻", fr: "l'ours", en: "bear", accept: ["ours", "l'ours", "un ours", "lours"] },
  { emoji: "🐼", fr: "le panda", en: "panda", accept: ["panda", "le panda", "un panda"] },
  { emoji: "🐸", fr: "la grenouille", en: "frog", accept: ["grenouille", "la grenouille", "une grenouille"] },
  { emoji: "🐮", fr: "la vache", en: "cow", accept: ["vache", "la vache", "une vache"] },
  { emoji: "🐷", fr: "le cochon", en: "pig", accept: ["cochon", "le cochon", "un cochon"] },
  { emoji: "🐔", fr: "la poule", en: "hen", accept: ["poule", "la poule", "une poule"] },
  { emoji: "🐦", fr: "l'oiseau", en: "bird", accept: ["oiseau", "l'oiseau", "un oiseau", "loiseau"] },
  { emoji: "🐟", fr: "le poisson", en: "fish", accept: ["poisson", "le poisson", "un poisson"] },
  { emoji: "🦁", fr: "le lion", en: "lion", accept: ["lion", "le lion", "un lion"] },
  { emoji: "🐘", fr: "l'éléphant", en: "elephant", accept: ["elephant", "éléphant", "l'éléphant", "un elephant", "lelephant"] },
  { emoji: "🐝", fr: "l'abeille", en: "bee", accept: ["abeille", "l'abeille", "une abeille", "labeille"] },
  { emoji: "🦋", fr: "le papillon", en: "butterfly", accept: ["papillon", "le papillon", "un papillon"] },
  { emoji: "🐴", fr: "le cheval", en: "horse", accept: ["cheval", "le cheval", "un cheval"] },

  // Food
  { emoji: "🍎", fr: "la pomme", en: "apple", accept: ["pomme", "la pomme", "une pomme"] },
  { emoji: "🍌", fr: "la banane", en: "banana", accept: ["banane", "la banane", "une banane"] },
  { emoji: "🍓", fr: "la fraise", en: "strawberry", accept: ["fraise", "la fraise", "une fraise"] },
  { emoji: "🍊", fr: "l'orange", en: "orange", accept: ["orange", "l'orange", "une orange", "lorange"] },
  { emoji: "🍇", fr: "le raisin", en: "grapes", accept: ["raisin", "le raisin", "du raisin"] },
  { emoji: "🍞", fr: "le pain", en: "bread", accept: ["pain", "le pain", "du pain"] },
  { emoji: "🧀", fr: "le fromage", en: "cheese", accept: ["fromage", "le fromage", "du fromage"] },
  { emoji: "🥕", fr: "la carotte", en: "carrot", accept: ["carotte", "la carotte", "une carotte"] },
  { emoji: "🍅", fr: "la tomate", en: "tomato", accept: ["tomate", "la tomate", "une tomate"] },
  { emoji: "🥛", fr: "le lait", en: "milk", accept: ["lait", "le lait", "du lait"] },
  { emoji: "🍰", fr: "le gâteau", en: "cake", accept: ["gateau", "gâteau", "le gateau", "un gateau"] },
  { emoji: "🍫", fr: "le chocolat", en: "chocolate", accept: ["chocolat", "le chocolat", "du chocolat"] },

  // Things & places
  { emoji: "🏠", fr: "la maison", en: "house", accept: ["maison", "la maison", "une maison"] },
  { emoji: "🚗", fr: "la voiture", en: "car", accept: ["voiture", "la voiture", "une voiture"] },
  { emoji: "🚲", fr: "le vélo", en: "bike", accept: ["velo", "vélo", "le velo", "un velo"] },
  { emoji: "✈️", fr: "l'avion", en: "plane", accept: ["avion", "l'avion", "un avion", "lavion"] },
  { emoji: "⚽", fr: "le ballon", en: "ball", accept: ["ballon", "le ballon", "un ballon"] },
  { emoji: "📚", fr: "le livre", en: "book", accept: ["livre", "le livre", "un livre"] },
  { emoji: "✏️", fr: "le crayon", en: "pencil", accept: ["crayon", "le crayon", "un crayon"] },
  { emoji: "🪑", fr: "la chaise", en: "chair", accept: ["chaise", "la chaise", "une chaise"] },
  { emoji: "🛏️", fr: "le lit", en: "bed", accept: ["lit", "le lit", "un lit"] },
  { emoji: "🌳", fr: "l'arbre", en: "tree", accept: ["arbre", "l'arbre", "un arbre", "larbre"] },
  { emoji: "🌸", fr: "la fleur", en: "flower", accept: ["fleur", "la fleur", "une fleur"] },
  { emoji: "☀️", fr: "le soleil", en: "sun", accept: ["soleil", "le soleil", "un soleil"] },
  { emoji: "🌙", fr: "la lune", en: "moon", accept: ["lune", "la lune", "la lune"] },
  { emoji: "⭐", fr: "l'étoile", en: "star", accept: ["etoile", "étoile", "l'étoile", "une etoile", "letoile"] },
  { emoji: "🌧️", fr: "la pluie", en: "rain", accept: ["pluie", "la pluie", "de la pluie"] },

  // Colours (shown as coloured hearts)
  { emoji: "❤️", fr: "rouge", en: "red", accept: ["rouge"] },
  { emoji: "💙", fr: "bleu", en: "blue", accept: ["bleu"] },
  { emoji: "💚", fr: "vert", en: "green", accept: ["vert"] },
  { emoji: "💛", fr: "jaune", en: "yellow", accept: ["jaune"] },
  { emoji: "🖤", fr: "noir", en: "black", accept: ["noir"] },
  { emoji: "🤍", fr: "blanc", en: "white", accept: ["blanc"] },
];

export function shufflePictures(): PictureItem[] {
  const a = [...PICTURE_BANK];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
