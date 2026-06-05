export const RANKS = [
  { id: 'wanderer', label: 'Wanderer', arabic: 'مسافر', minXP: 0, color: '#5C5451' },
  { id: 'nomad', label: 'Nomad', arabic: 'بدوي', minXP: 75, color: '#aa7c11' },
  { id: 'merchant', label: 'Merchant', arabic: 'تاجر', minXP: 250, color: '#c07b2a' },
  { id: 'chronicler', label: 'Chronicler', arabic: 'مؤرخ', minXP: 600, color: '#D11A38' },
  { id: 'pearldiver', label: 'Pearl Diver', arabic: 'غواص لؤلؤ', minXP: 1200, color: '#2563eb' },
  { id: 'dilmun', label: 'Dilmun Pearl', arabic: 'لؤلؤة دلمون', minXP: 2200, color: '#7c3aed' },
]

export function getRank(xp) {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r
  }
  return rank
}

export function getNextRank(xp) {
  for (const r of RANKS) {
    if (xp < r.minXP) return r
  }
  return null
}

export const RIDDLES = {
  'qal-at-al-bahrain': {
    question: "Which empire's legendary seals were discovered in the archaeological strata here?",
    options: ["Dilmun Empire", "Roman Empire", "Byzantine Empire"],
    correct: 0,
    insider: "Dilmun clay seals carved with bulls and celestial marks were used by merchants 4,000 years ago to secure cargo bound for ancient Mesopotamia!"
  },
  'muharraq-souq': {
    question: "What signature botanical spices give Bahraini Halwa its warm, legendary aroma?",
    options: ["Saffron & Cardamom", "Ginger & Cinnamon", "Clove & Star Anise"],
    correct: 0,
    insider: "Generational copper-pot halwa makers cook date syrup and almonds with cardamom and highly precious saffron threads to produce that authentic scarlet glow."
  },
  'pearling-path': {
    question: "How did historical Bahraini pearl divers block their ears/noses during oyster dives?",
    options: ["Beeswax & horn-clips", "Sea-sponges & olive oil", "Fine linen & clay plugs"],
    correct: 0,
    insider: "Divers plugged their ears with natural beeswax and clamped their noses with 'Fattah' noseclips carved from sheep horn to withstand the deep seafloor pressure."
  },
  'block-338': {
    question: "Block 338 is celebrated today as Manama's creative core. What defines its bohemian layout?",
    options: ["Vibrant street murals & art", "Date palm gardens", "Ancient brick-kilns"],
    correct: 0,
    insider: "Walking behind the main lanes reveals hidden alleyways packed with glowing street murals, local printshops, and contemporary art courtyards!"
  },
  'jarada-island': {
    question: "What oceanographic mystery makes a speedboat voyage to Jarada Island unique?",
    options: ["It completely vanishes under tide", "It features deep sea moats", "It is covered in green palm woods"],
    correct: 0,
    insider: "Jarada is an ephemeral sandbar that completely vanishes under the turquoise sea waves twice a day, leaving only marine shells and birds."
  },
  'tree-of-life': {
    question: "How old is this solitary green canopy growing without any apparent water source in the desert?",
    options: ["Over 400 years old", "Around 50 years old", "Nearly 10,000 years old"],
    correct: 0,
    insider: "Botanists believe the tree's roots descend over 50 meters deep to reach subterranean fresh water aquifers, letting it defy the hyper-saline Sakhir sands."
  },
  'haji-cafe': {
    question: "Established in 1950 inside Manama Souq, what legendary policy makes dining at Haji's unique?",
    options: ["There is no printed menu", "It is inside a military fort", "Servings are done by robots"],
    correct: 0,
    insider: "There is no menu! You sit on the rustic wooden benches and the cooks simply serve you whatever local dishes are boiling fresh in the kitchen pots."
  },
  'aali-pottery': {
    question: "What generational method do potting masters in A'ali still use to shape their red clay jars?",
    options: ["Foot-kick pottery wheels", "Modern CNC routers", "Liquid silicon molding"],
    correct: 0,
    insider: "Generational potters spin clay harvested from local Sakhir marshes using kick-wheels that mimic designs seen on ancient Dilmun tablets."
  },
  'arad-fort': {
    question: "Arad Fort stands guard over the Muharraq coast. What is its highly unique structural layout?",
    options: ["Strictly square military shape", "Circular star-pattern moat", "Octagonal limestone tower"],
    correct: 0,
    insider: "Arad was built in a compact square shape in the 15th century, with heavy cylindrical corner towers to defend sea channels from all angles."
  },
  'national-museum': {
    question: "Which ancient Mesopotamian epic inscribed on clay tablets is preserved inside the galleries here?",
    options: ["The Epic of Gilgamesh", "The Odyssey", "The Hammurabi Codex"],
    correct: 0,
    insider: "The Epic of Gilgamesh describes Dilmun (ancient Bahrain) as a paradise land of pure fresh waters where the hero sought the secret to eternal life!"
  },
  'al-dar-islands': {
    question: "Which local marine wildlife are shallow sea-kayak trips around Sitra shores most famous for?",
    options: ["Starfish & blue swimming crabs", "Hammerhead shark packs", "Sub-tropical sea penguins"],
    correct: 0,
    insider: "Kayaking near the seagrass beds reveals millions of small blue swimming crabs, native clams, and orange starfish in crystal warm waters."
  },
  'reef-island': {
    question: "Reef Island promenade sits on Manama's northern shore. What view does it showcase at night?",
    options: ["Skyscraper neon lights & marina", "Ancient volcanic dunes", "Deep pearl oyster diving fleets"],
    correct: 0,
    insider: "The pedestrian sea promenade provides the absolute best breeze point to watch the capital's skyscraper neon lights catch the sea ripples."
  },
  'riffa-fort': {
    question: "Perched on a cliff edge, which valley wind system cools Riffa Fort's winds?",
    options: ["Haniniya Valley breeze", "Euphrates Delta trade winds", "Nile Basin thermal draft"],
    correct: 0,
    insider: "The Haniniya Valley breeze rushes up the limestone cliffs at twilight, creating a natural desert cooling draft across the fort courtyards."
  },
  'barbar-temple': {
    question: "The ancient Barbar Temple ruins are dedicated to Enki. Who was this Dilmun deity?",
    options: ["God of Wisdom & Fresh Waters", "God of Sandstorms & War", "God of Crimson Fire & Gold"],
    correct: 0,
    insider: "Ancient Sumerians believed Bahrain was a sacred sanctuary because freshwater springs bubbled up through the sea, ruled by the god of sweet waters!"
  },
  'al-jasra-house': {
    question: "What organic, traditional building materials were used to construct Al Jasra House in 1907?",
    options: ["Sea coral stones & palm trunks", "Red kiln bricks & concrete", "Volcanic limestone & slate"],
    correct: 0,
    insider: "Traditional craftsmen stacked sea coral chunks bound by mud, using palm leaf fibers and robust palm trunks to construct naturally ventilated walls."
  },
  'khalaf-house': {
    question: "Khalaf House stands as a monument in Muharraq. What trade fortunes were historically weighed here?",
    options: ["Natural sea oyster pearls", "Aromatic spice shipments", "Red clay pottery cargoes"],
    correct: 0,
    insider: "This grand merchant home served as the royal salon where pearl divers brought rare Basra pearls to be weighed against brass weights for fortunes."
  },
  'manama-souq': {
    question: "What does the name of the iconic stone archway 'Bab Al Bahrain' translate to?",
    options: ["Gateway of Bahrain", "Citadel of Bahrain", "Springs of Bahrain"],
    correct: 0,
    insider: "Built in 1949, Bab Al Bahrain ('Gateway of Bahrain') marked the exact point where sea waters originally met the historic customs square."
  },
  'al-areen': {
    question: "Which majestic, long-horned white desert animal is Al Areen Park famous for preserving?",
    options: ["The Arabian Oryx", "The Sahara Cheetah", "The Persian Antelope"],
    correct: 0,
    insider: "The beautiful white Arabian Oryx was saved from extinction in the 1970s through local Sakhir desert breeding programs, now numbering in the hundreds."
  }
}

export function getGuideThoughts(spot, guideId) {
  if (!spot) return "Select a landmark below to begin our journey..."
  const spotName = spot.name.split(' (')[0]
  
  if (guideId === 'jafar') {
    return `Ah, the sight of ${spotName} always warms my soul. In my youth during the 1920s pearling boom, our pearling fleets would steer by this landmark. My secret tip: look for the old spice and incense merchants just down the path—their families have traded here for generations, and they brew a legendary cardamom karak tea if you ask with respect.`
  } else if (guideId === 'ninsun') {
    return `Under the sacred skies of c. 2000 BCE, ${spotName} was known as a sanctuary of Dilmun. We walked these limestone paths to offer fresh spring water clay stamps to the gods. My mystical tip: feel the ancient limestone blocks at dusk—they retain the sun's warmth, and you can almost hear the soft whispers of freshwater springs rising from the salt seas.`
  } else {
    return `As a military architect of the 1400s, I designed defensive works near ${spotName}. Its stone layout is a masterclass in sea-facing masonry. My tactical tip: climb to the eastern parapet where the sea breeze hits. From there, you can see how the architectural alignment gives a perfect tactical view of the shallow coastal reefs.`
  }
}

export const shopItems = [
  { id: 'riddle-hint', name: 'Riddle Scroll Clue', desc: 'Poetic guidance for active Dilmun Pearl coordinate riddles.', cost: 150, emoji: '📜' },
  { id: 'saffron-halwa', name: 'Saffron Halwa Plate', desc: 'Increases relationship with Jafar (Spice Merchant) by +25 XP.', cost: 300, emoji: '🍯' },
  { id: 'pearl-hook', name: 'Generational Oyster Hook', desc: 'Increases relationship with Seyadi (Pearl Diver) by +30 XP.', cost: 400, emoji: '🪝' },
  { id: 'falcon-glove', name: 'Falconer Leather Glove', desc: 'Increases relationship with Faisal (Falconer) by +30 XP.', cost: 400, emoji: '🧤' },
  { id: 'keepsake-bag', name: 'Bazaar Keepsake Grab-bag', desc: 'Instantly unlocks a random traditional souvenir relic.', cost: 600, emoji: '🛍️' }
]
