// Original, simple-French retellings of well-known PUBLIC-DOMAIN tales, written
// for a young learner (roughly A1). Each line has a short French sentence and an
// English gloss so the child can follow along while it is read aloud. These are
// our own wording — not copied from any other site — so they are free to use.

export interface StoryLine {
  fr: string;
  en: string;
}

export interface Story {
  id: string;
  title: string; // French title
  titleEn: string; // English title
  emoji: string;
  tint: string; // poster accent colour
  level: string; // friendly difficulty hint
  blurb: string;
  lines: StoryLine[];
}

export const STORIES: Story[] = [
  {
    id: "trois-cochons",
    title: "Les Trois Petits Cochons",
    titleEn: "The Three Little Pigs",
    emoji: "🐷",
    tint: "#E0533D",
    level: "Beginner",
    blurb: "Three pigs, three houses and a big bad wolf.",
    lines: [
      { fr: "Il était une fois trois petits cochons.", en: "Once upon a time, there were three little pigs." },
      { fr: "Le premier cochon construit une maison de paille.", en: "The first pig builds a house of straw." },
      { fr: "Le deuxième cochon construit une maison de bois.", en: "The second pig builds a house of wood." },
      { fr: "Le troisième cochon construit une maison de briques.", en: "The third pig builds a house of bricks." },
      { fr: "Un grand loup arrive. Il a très faim.", en: "A big wolf arrives. He is very hungry." },
      { fr: "« Petit cochon, laisse-moi entrer ! » dit le loup.", en: "\"Little pig, let me come in!\" says the wolf." },
      { fr: "« Non, non, non ! » répond le petit cochon.", en: "\"No, no, no!\" answers the little pig." },
      { fr: "Le loup souffle et la maison de paille tombe.", en: "The wolf blows and the straw house falls." },
      { fr: "Le loup souffle et la maison de bois tombe aussi.", en: "The wolf blows and the wood house falls too." },
      { fr: "Mais la maison de briques est très solide.", en: "But the brick house is very strong." },
      { fr: "Le loup souffle, mais la maison ne tombe pas.", en: "The wolf blows, but the house does not fall." },
      { fr: "Les trois petits cochons sont contents et en sécurité.", en: "The three little pigs are happy and safe." },
    ],
  },
  {
    id: "lievre-tortue",
    title: "Le Lièvre et la Tortue",
    titleEn: "The Tortoise and the Hare",
    emoji: "🐢",
    tint: "#7BC043",
    level: "Beginner",
    blurb: "A fast hare, a slow tortoise and a famous race.",
    lines: [
      { fr: "Un lièvre rapide rit d'une petite tortue.", en: "A fast hare laughs at a little tortoise." },
      { fr: "« Tu es très lente ! » dit le lièvre.", en: "\"You are very slow!\" says the hare." },
      { fr: "« Faisons une course ! » répond la tortue.", en: "\"Let's have a race!\" answers the tortoise." },
      { fr: "Le lièvre court très vite et prend de l'avance.", en: "The hare runs very fast and takes the lead." },
      { fr: "La tortue marche lentement, pas après pas.", en: "The tortoise walks slowly, step after step." },
      { fr: "Le lièvre est fatigué. Il décide de dormir.", en: "The hare is tired. He decides to sleep." },
      { fr: "La tortue continue de marcher sans s'arrêter.", en: "The tortoise keeps walking without stopping." },
      { fr: "Le lièvre se réveille et court vers la ligne.", en: "The hare wakes up and runs to the line." },
      { fr: "Mais la tortue est déjà arrivée !", en: "But the tortoise has already arrived!" },
      { fr: "La tortue gagne la course.", en: "The tortoise wins the race." },
      { fr: "Lentement mais sûrement, on gagne la course.", en: "Slowly but surely, you win the race." },
    ],
  },
  {
    id: "boucle-or",
    title: "Boucle d'Or et les Trois Ours",
    titleEn: "Goldilocks and the Three Bears",
    emoji: "🐻",
    tint: "#F2B233",
    level: "Easy",
    blurb: "A curious girl visits a house in the woods.",
    lines: [
      { fr: "Une petite fille s'appelle Boucle d'Or.", en: "A little girl is called Goldilocks." },
      { fr: "Elle entre dans la maison de trois ours.", en: "She enters the house of three bears." },
      { fr: "Sur la table, il y a trois bols de soupe.", en: "On the table, there are three bowls of soup." },
      { fr: "Le premier bol est trop chaud.", en: "The first bowl is too hot." },
      { fr: "Le deuxième bol est trop froid.", en: "The second bowl is too cold." },
      { fr: "Le troisième bol est parfait. Elle mange tout.", en: "The third bowl is perfect. She eats it all." },
      { fr: "Puis elle trouve trois chaises.", en: "Then she finds three chairs." },
      { fr: "La petite chaise casse !", en: "The little chair breaks!" },
      { fr: "Fatiguée, elle monte et trouve trois lits.", en: "Tired, she goes up and finds three beds." },
      { fr: "Le petit lit est parfait et elle s'endort.", en: "The little bed is perfect and she falls asleep." },
      { fr: "Les trois ours rentrent à la maison.", en: "The three bears come home." },
      { fr: "Boucle d'Or se réveille et part en courant.", en: "Goldilocks wakes up and runs away." },
    ],
  },
  {
    id: "chaperon-rouge",
    title: "Le Petit Chaperon Rouge",
    titleEn: "Little Red Riding Hood",
    emoji: "🧺",
    tint: "#C0392B",
    level: "Easy",
    blurb: "A girl, a basket, a forest and a sly wolf.",
    lines: [
      { fr: "Une petite fille porte un chaperon rouge.", en: "A little girl wears a red hood." },
      { fr: "Elle va voir sa grand-mère dans la forêt.", en: "She goes to see her grandmother in the forest." },
      { fr: "Elle porte un panier avec du pain et du gâteau.", en: "She carries a basket with bread and cake." },
      { fr: "Dans la forêt, elle rencontre un loup.", en: "In the forest, she meets a wolf." },
      { fr: "« Où vas-tu ? » demande le loup.", en: "\"Where are you going?\" asks the wolf." },
      { fr: "« Chez ma grand-mère », répond la petite fille.", en: "\"To my grandmother's,\" answers the little girl." },
      { fr: "Le loup court vite à la maison de la grand-mère.", en: "The wolf runs fast to the grandmother's house." },
      { fr: "La petite fille arrive et trouve le loup dans le lit.", en: "The little girl arrives and finds the wolf in the bed." },
      { fr: "« Comme tu as de grandes dents ! » dit-elle.", en: "\"What big teeth you have!\" she says." },
      { fr: "Un chasseur entend le bruit et arrive vite.", en: "A hunter hears the noise and comes quickly." },
      { fr: "Le chasseur sauve la petite fille et la grand-mère.", en: "The hunter saves the little girl and the grandmother." },
      { fr: "Tout le monde est sain et sauf.", en: "Everyone is safe and sound." },
    ],
  },
  {
    id: "lion-souris",
    title: "Le Lion et la Souris",
    titleEn: "The Lion and the Mouse",
    emoji: "🦁",
    tint: "#D4862A",
    level: "Easy",
    blurb: "A tiny mouse and a mighty lion become friends.",
    lines: [
      { fr: "Un grand lion dort sous un arbre.", en: "A big lion sleeps under a tree." },
      { fr: "Une petite souris court sur le lion.", en: "A little mouse runs on the lion." },
      { fr: "Le lion se réveille et attrape la souris.", en: "The lion wakes up and catches the mouse." },
      { fr: "« Pardon ! Laisse-moi partir ! » dit la souris.", en: "\"Sorry! Let me go!\" says the mouse." },
      { fr: "« Un jour, je vais t'aider. »", en: "\"One day, I will help you.\"" },
      { fr: "Le lion rit, mais il laisse partir la souris.", en: "The lion laughs, but he lets the mouse go." },
      { fr: "Plus tard, le lion tombe dans un filet.", en: "Later, the lion falls into a net." },
      { fr: "Il ne peut pas sortir. Il rugit fort.", en: "He cannot get out. He roars loudly." },
      { fr: "La petite souris entend le lion.", en: "The little mouse hears the lion." },
      { fr: "Elle coupe le filet avec ses petites dents.", en: "She cuts the net with her little teeth." },
      { fr: "Le lion est libre ! Il dit merci à la souris.", en: "The lion is free! He says thank you to the mouse." },
      { fr: "Même les petits amis peuvent beaucoup aider.", en: "Even small friends can help a lot." },
    ],
  },
  {
    id: "vilain-canard",
    title: "Le Vilain Petit Canard",
    titleEn: "The Ugly Duckling",
    emoji: "🦆",
    tint: "#4FD6D6",
    level: "Medium",
    blurb: "A little duck who is different finds where he belongs.",
    lines: [
      { fr: "Dans une ferme, des œufs vont éclore.", en: "On a farm, some eggs are going to hatch." },
      { fr: "Un petit canard est différent des autres.", en: "One little duck is different from the others." },
      { fr: "Il est gris et un peu plus grand.", en: "He is grey and a little bigger." },
      { fr: "Les autres canards rient de lui.", en: "The other ducks laugh at him." },
      { fr: "Le petit canard est très triste.", en: "The little duck is very sad." },
      { fr: "Il part tout seul sur l'étang.", en: "He leaves all alone on the pond." },
      { fr: "L'hiver arrive et il a froid.", en: "Winter comes and he is cold." },
      { fr: "Puis le printemps revient, doux et chaud.", en: "Then spring comes back, soft and warm." },
      { fr: "Le petit canard se regarde dans l'eau.", en: "The little duck looks at himself in the water." },
      { fr: "Il n'est pas un canard : c'est un beau cygne !", en: "He is not a duck: he is a beautiful swan!" },
      { fr: "Tous les cygnes l'accueillent avec joie.", en: "All the swans welcome him with joy." },
      { fr: "Il est enfin heureux d'être lui-même.", en: "He is finally happy to be himself." },
    ],
  },
];

export function storyById(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}
