import type { Book, Chapter } from "./types"

export function buildChapters(
  title: string,
  author: string,
  description: string,
  themes: string[],
): Chapter[] {
  const titles = [
    "Ouverture",
    "Les racines",
    "Le seuil",
    "La traversée",
    "Le retour",
    "Épilogue",
  ]

  return titles.map((chapterTitle, index) => ({
    title: chapterTitle,
    content: [
      `Dès les premières lignes de « ${title} », ${author} installe une voix qui ne ressemble à aucune autre. ${description}`,
      `Le récit avance à son rythme, porté par ${themes[index % themes.length]} et par une langue qui pèse chaque mot. On sent, page après page, la mémoire d'un continent qui parle à travers celui qui écrit — sans jamais céder à la facilité ni à la nostalgie.`,
      `Ici, ${themes[(index + 1) % themes.length]} traverse la scène comme un fil tendu entre le passé et ce qui vient. Les personnages hésitent, choisissent, se trompent, recommencent ; et c'est dans cette hésitation même que le texte trouve sa vérité la plus nue.`,
      `À la fin de ce chapitre, rien n'est encore résolu, et pourtant tout a changé. ${author} referme la porte doucement, laissant au lecteur le soin de deviner ce qui, déjà, se prépare de l'autre côté.`,
    ],
  }))
}

export const PREVIEW_BOOKS: Book[] = [
  {
    id: 1,
    slug: "lenfant-noir",
    title: "L'Enfant noir",
    author: "Camara Laye",
    price: 2500,
    category: "Roman",
    rating: 4.8,
    reviews: 342,
    pages: 224,
    year: 1953,
    language: "fr",
    publishedAt: "2026-05-12",
    cover:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=1200&fit=crop&auto=format",
    description:
      "Une œuvre autobiographique majeure qui retrace l'enfance de l'auteur en Haute-Guinée. Un témoignage poignant sur les traditions, la culture mandingue et le passage à l'âge adulte dans l'Afrique pré-coloniale.",
    chapters: buildChapters(
      "L'Enfant noir",
      "Camara Laye",
      "Une œuvre autobiographique qui retrace l'enfance de l'auteur en Haute-Guinée, entre l'atelier du père forgeron et les champs de la saison des pluies.",
      [
        "la magie de l'atelier paternel",
        "les récoltes partagées du village",
        "la peur et l'émerveillement de l'enfance",
        "l'appel lointain de l'école",
      ],
    ),
  },
  {
    id: 2,
    slug: "le-soleil-des-independances",
    title: "Le Soleil des Indépendances",
    author: "Ahmadou Kourouma",
    price: 3000,
    category: "Roman",
    rating: 4.9,
    reviews: 518,
    pages: 208,
    year: 1968,
    language: "fr",
    publishedAt: "2026-04-28",
    cover:
      "https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=1200&fit=crop&auto=format",
    description:
      "Un chef-d'œuvre de la littérature africaine francophone qui dresse le portrait sans concession des désillusions ayant suivi les indépendances, à travers le destin tragique de Fama, prince déchu.",
    chapters: buildChapters(
      "Le Soleil des Indépendances",
      "Ahmadou Kourouma",
      "Le portrait sans concession des désillusions qui ont suivi les indépendances, à travers le destin de Fama, prince déchu réduit à courir les funérailles.",
      [
        "la déchéance d'un prince",
        "l'ironie mordante du griot",
        "les promesses trahies de la nation",
        "la dignité têtue des vaincus",
      ],
    ),
  },
  {
    id: 3,
    slug: "soundjata-lepopee-mandingue",
    title: "Soundjata, l'épopée mandingue",
    author: "Djibril Tamsir Niane",
    price: 2000,
    category: "Histoire",
    rating: 4.7,
    reviews: 196,
    pages: 160,
    year: 1960,
    language: "fr",
    publishedAt: "2026-05-30",
    cover:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=1200&fit=crop&auto=format",
    description:
      "La transcription fidèle de la tradition orale relatant l'histoire de Soundjata Keïta, fondateur de l'Empire du Mali au XIIIᵉ siècle. Un texte fondamental pour comprendre l'Afrique de l'Ouest.",
    chapters: buildChapters(
      "Soundjata, l'épopée mandingue",
      "Djibril Tamsir Niane",
      "La transcription de la tradition orale relatant l'ascension de Soundjata Keïta, l'enfant qui ne marchait pas et devint fondateur de l'Empire du Mali.",
      [
        "la parole du griot dépositaire",
        "l'enfant qui se dresse enfin",
        "l'exil et l'alliance des peuples",
        "la victoire de Kirina",
      ],
    ),
  },
  {
    id: 4,
    slug: "une-si-longue-lettre",
    title: "Une si longue lettre",
    author: "Mariama Bâ",
    price: 2500,
    category: "Roman",
    rating: 5.0,
    reviews: 623,
    pages: 165,
    year: 1979,
    language: "fr",
    publishedAt: "2026-06-08",
    cover:
      "https://images.unsplash.com/photo-1476275466078-4007374efac4?w=800&h=1200&fit=crop&auto=format",
    description:
      "Sous forme épistolaire, Ramatoulaye, fraîchement veuve, se confie à sa meilleure amie Aïssatou. Une réflexion profonde et lumineuse sur la condition féminine, le mariage et la polygamie au Sénégal.",
    chapters: buildChapters(
      "Une si longue lettre",
      "Mariama Bâ",
      "Sous forme de lettre, Ramatoulaye, fraîchement veuve, se confie à son amie Aïssatou et médite sur l'amour, la trahison et la liberté des femmes.",
      [
        "le deuil et ses rituels",
        "l'amitié comme refuge",
        "la blessure de la polygamie",
        "l'espoir d'un recommencement",
      ],
    ),
  },
  {
    id: 5,
    slug: "les-bouts-de-bois-de-dieu",
    title: "Les Bouts de bois de Dieu",
    author: "Ousmane Sembène",
    price: 3200,
    category: "Roman",
    rating: 4.6,
    reviews: 271,
    pages: 384,
    year: 1960,
    language: "fr",
    publishedAt: "2026-03-19",
    cover:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=1200&fit=crop&auto=format",
    description:
      "Le récit épique de la grève des cheminots du Dakar-Niger en 1947. Une fresque sociale puissante où hommes et femmes s'unissent pour la dignité et la justice.",
    chapters: buildChapters(
      "Les Bouts de bois de Dieu",
      "Ousmane Sembène",
      "Le récit épique de la grève des cheminots du Dakar-Niger en 1947, où hommes et femmes s'unissent pour la dignité et la justice.",
      [
        "l'arrêt des locomotives",
        "la faim et la solidarité",
        "l'éveil des femmes",
        "la longue marche vers Dakar",
      ],
    ),
  },
  {
    id: 6,
    slug: "cahier-dun-retour-au-pays-natal",
    title: "Cahier d'un retour au pays natal",
    author: "Aimé Césaire",
    price: 2800,
    category: "Poésie",
    rating: 4.9,
    reviews: 158,
    pages: 96,
    year: 1939,
    language: "fr",
    publishedAt: "2026-02-11",
    cover:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&h=1200&fit=crop&auto=format",
    description:
      "Poème fondateur de la négritude, incandescent et incantatoire. Un chant de révolte et de réappropriation identitaire qui a marqué à jamais la littérature francophone.",
    chapters: buildChapters(
      "Cahier d'un retour au pays natal",
      "Aimé Césaire",
      "Poème fondateur de la négritude, incandescent et incantatoire, chant de révolte et de réappropriation identitaire.",
      [
        "l'aube blessée des Antilles",
        "la descente au plus bas de la douleur",
        "le sursaut de la parole",
        "l'élan debout de la négritude",
      ],
    ),
  },
  {
    id: 7,
    slug: "laventure-ambigue",
    title: "L'Aventure ambiguë",
    author: "Cheikh Hamidou Kane",
    price: 2700,
    category: "Roman",
    rating: 4.8,
    reviews: 289,
    pages: 190,
    year: 1961,
    language: "fr",
    publishedAt: "2026-01-22",
    cover:
      "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800&h=1200&fit=crop&auto=format",
    description:
      "Samba Diallo, tiraillé entre l'école coranique et l'école occidentale, incarne le déchirement d'une génération. Un roman philosophique d'une rare intensité méditative.",
    chapters: buildChapters(
      "L'Aventure ambiguë",
      "Cheikh Hamidou Kane",
      "Samba Diallo, tiraillé entre l'école coranique et l'école occidentale, incarne le déchirement méditatif d'une génération.",
      [
        "le feu de la parole sacrée",
        "le départ vers l'ailleurs",
        "le vertige de la raison",
        "le retour impossible",
      ],
    ),
  },
  {
    id: 8,
    slug: "contes-et-legendes-dafrique",
    title: "Contes et légendes d'Afrique",
    author: "Birago Diop",
    price: 1800,
    category: "Contes",
    rating: 4.7,
    reviews: 204,
    pages: 176,
    year: 1947,
    language: "fr",
    publishedAt: "2025-12-06",
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=1200&fit=crop&auto=format",
    description:
      "Les récits du griot Amadou Koumba, entre sagesse et malice. Une collection intemporelle qui fait résonner la voix des veillées et la mémoire des ancêtres.",
    chapters: buildChapters(
      "Contes et légendes d'Afrique",
      "Birago Diop",
      "Les récits du griot Amadou Koumba, entre sagesse et malice, qui font résonner la voix des veillées et la mémoire des ancêtres.",
      [
        "la ruse du lièvre Leuk",
        "la leçon de l'os",
        "les souffles des ancêtres",
        "la morale au coin du feu",
      ],
    ),
  },
]
