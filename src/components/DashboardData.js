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
    options: ["Byzantine Empire", "Dilmun Empire", "Roman Empire"],
    correct: 1,
    insider: "Dilmun clay seals carved with bulls and celestial marks were used by merchants 4,000 years ago to secure cargo bound for ancient Mesopotamia!"
  },
  'muharraq-souq': {
    question: "What signature botanical spices give Bahraini Halwa its warm, legendary aroma?",
    options: ["Ginger & Cinnamon", "Clove & Star Anise", "Saffron & Cardamom"],
    correct: 2,
    insider: "Generational copper-pot halwa makers cook date syrup and almonds with cardamom and highly precious saffron threads to produce that authentic scarlet glow."
  },
  'pearling-path': {
    question: "How did historical Bahraini pearl divers block their ears/noses during oyster dives?",
    options: ["Sea-sponges & olive oil", "Beeswax & horn-clips", "Fine linen & clay plugs"],
    correct: 1,
    insider: "Divers plugged their ears with natural beeswax and clamped their noses with 'Fattah' noseclips carved from sheep horn to withstand the deep seafloor pressure."
  },
  'block-338': {
    question: "Block 338 is celebrated today as Manama's creative core. What defines its bohemian layout?",
    options: ["Date palm gardens", "Vibrant street murals & art", "Ancient brick-kilns"],
    correct: 1,
    insider: "Walking behind the main lanes reveals hidden alleyways packed with glowing street murals, local printshops, and contemporary art courtyards!"
  },
  'jarada-island': {
    question: "What oceanographic mystery makes a speedboat voyage to Jarada Island unique?",
    options: ["It features deep sea moats", "It is covered in green palm woods", "It completely vanishes under tide"],
    correct: 2,
    insider: "Jarada is an ephemeral sandbar that completely vanishes under the turquoise sea waves twice a day, leaving only marine shells and birds."
  },
  'tree-of-life': {
    question: "How old is this solitary green canopy growing without any apparent water source in the desert?",
    options: ["Around 50 years old", "Over 400 years old", "Nearly 10,000 years old"],
    correct: 1,
    insider: "Botanists believe the tree's roots descend over 50 meters deep to reach subterranean fresh water aquifers, letting it defy the hyper-saline Sakhir sands."
  },
  'haji-cafe': {
    question: "Established in 1950 inside Manama Souq, what legendary policy makes dining at Haji's unique?",
    options: ["It is inside a military fort", "There is no printed menu", "Servings are done by robots"],
    correct: 1,
    insider: "There is no menu! You sit on the rustic wooden benches and the cooks simply serve you whatever local dishes are boiling fresh in the kitchen pots."
  },
  'aali-pottery': {
    question: "What generational method do potting masters in A'ali still use to shape their red clay jars?",
    options: ["Modern CNC routers", "Liquid silicon molding", "Foot-kick pottery wheels"],
    correct: 2,
    insider: "Generational potters spin clay harvested from local Sakhir marshes using kick-wheels that mimic designs seen on ancient Dilmun tablets."
  },
  'arad-fort': {
    question: "Arad Fort stands guard over the Muharraq coast. What is its highly unique structural layout?",
    options: ["Circular star-pattern moat", "Strictly square military shape", "Octagonal limestone tower"],
    correct: 1,
    insider: "Arad was built in a compact square shape in the 15th century, with heavy cylindrical corner towers to defend sea channels from all angles."
  },
  'national-museum': {
    question: "Which ancient Mesopotamian epic inscribed on clay tablets is preserved inside the galleries here?",
    options: ["The Odyssey", "The Hammurabi Codex", "The Epic of Gilgamesh"],
    correct: 2,
    insider: "The Epic of Gilgamesh describes Dilmun (ancient Bahrain) as a paradise land of pure fresh waters where the hero sought the secret to eternal life!"
  },
  'al-dar-islands': {
    question: "Which local marine wildlife are shallow sea-kayak trips around Sitra shores most famous for?",
    options: ["Hammerhead shark packs", "Starfish & blue swimming crabs", "Sub-tropical sea penguins"],
    correct: 1,
    insider: "Kayaking near the seagrass beds reveals millions of small blue swimming crabs, native clams, and orange starfish in crystal warm waters."
  },
  'reef-island': {
    question: "Reef Island promenade sits on Manama's northern shore. What view does it showcase at night?",
    options: ["Ancient volcanic dunes", "Skyscraper neon lights & marina", "Deep pearl oyster diving fleets"],
    correct: 1,
    insider: "The pedestrian sea promenade provides the absolute best breeze point to watch the capital's skyscraper neon lights catch the sea ripples."
  },
  'riffa-fort': {
    question: "Perched on a cliff edge, which valley wind system cools Riffa Fort's winds?",
    options: ["Euphrates Delta trade winds", "Haniniya Valley breeze", "Nile Basin thermal draft"],
    correct: 1,
    insider: "The Haniniya Valley breeze rushes up the limestone cliffs at twilight, creating a natural desert cooling draft across the fort courtyards."
  },
  'barbar-temple': {
    question: "The ancient Barbar Temple ruins are dedicated to Enki. Who was this Dilmun deity?",
    options: ["God of Sandstorms & War", "God of Wisdom & Fresh Waters", "God of Crimson Fire & Gold"],
    correct: 1,
    insider: "Ancient Sumerians believed Bahrain was a sacred sanctuary because freshwater springs bubbled up through the sea, ruled by the god of sweet waters!"
  },
  'al-jasra-house': {
    question: "What organic, traditional building materials were used to construct Al Jasra House in 1907?",
    options: ["Red kiln bricks & concrete", "Volcanic limestone & slate", "Sea coral stones & palm trunks"],
    correct: 2,
    insider: "Traditional craftsmen stacked sea coral chunks bound by mud, using palm leaf fibers and robust palm trunks to construct naturally ventilated walls."
  },
  'khalaf-house': {
    question: "Khalaf House stands as a monument in Muharraq. What trade fortunes were historically weighed here?",
    options: ["Aromatic spice shipments", "Natural sea oyster pearls", "Red clay pottery cargoes"],
    correct: 1,
    insider: "This grand merchant home served as the royal salon where pearl divers brought rare Basra pearls to be weighed against brass weights for fortunes."
  },
  'manama-souq': {
    question: "What does the name of the iconic stone archway 'Bab Al Bahrain' translate to?",
    options: ["Citadel of Bahrain", "Gateway of Bahrain", "Springs of Bahrain"],
    correct: 1,
    insider: "Built in 1949, Bab Al Bahrain ('Gateway of Bahrain') marked the exact point where sea waters originally met the historic customs square."
  },
  'al-areen': {
    question: "Which majestic, long-horned white desert animal is Al Areen Park famous for preserving?",
    options: ["Sahara Cheetah", "Arabian Oryx", "Persian Antelope"],
    correct: 1,
    insider: "The beautiful white Arabian Oryx was saved from extinction in the 1970s through local Sakhir desert breeding programs, now numbering in the hundreds."
  }
}

export function getGuideThoughts(spot) {
  if (!spot) return "Select a landmark below to begin our journey..."
  const spotName = spot.name.split(' (')[0]
  return `Standing at ${spotName}, one feels the deep layers of Bahrain's history — from ancient Dilmun to the pearling era, from military fortifications to modern cultural revival. Each stone and alleyway holds a story waiting to be discovered.`
}

export const shopItems = [
  { id: 'riddle-hint', name: 'Riddle Scroll Clue', desc: 'Consumable scroll providing poetic guidance for active coordinate riddles.', cost: 150, emoji: '📜', xpReward: 10 },
  { id: 'saffron-halwa', name: 'Saffron Halwa Plate', desc: 'Eat this traditional golden dessert to temporarily unlock the warm saffron interface theme.', cost: 300, emoji: '🍯', xpReward: 25 },
  { id: 'pearl-hook', name: 'Generational Oyster Hook', desc: 'Allows you to search for Basra Pearls in Sitra reefs and Jarada Island.', cost: 400, emoji: '🪝', xpReward: 30 },
  { id: 'falcon-glove', name: 'Falconer Leather Glove', desc: 'Equip to interact with wild falcons at Arad Fort or Al Areen Sakhir Park.', cost: 400, emoji: '🧤', xpReward: 30 },
  { id: 'keepsake-bag', name: 'Bazaar Keepsake Grab-bag', desc: 'Instantly unlocks a random traditional souvenir keepsake.', cost: 600, emoji: '🛍️', xpReward: 50 }
]

export const guides = [
  { id: 'guide', name: 'Bahrain Storyteller', title: 'Cultural Historian', emoji: '📖', arabic: 'راوية' }
]

const ALMANAC_DATA = {
  1: {
    location: 'Manama Souq Spicery',
    metrics: [
      { label: 'Ambient Temperature', value: '31°C / 88°F', desc: 'Warm spice alleys breeze' },
      { label: 'Jasmine Bloom Peak', value: '7:00 PM - 9:30 PM', desc: 'Best aroma window left of gate' },
      { label: 'Karak Steam Rating', value: 'Excellent (High humidity)', desc: 'Perfect acoustic coffee houses' }
    ],
    icon: '☕',
    notes: 'The souq is warmest in mid-afternoon. Highly recommend exploring early morning or twilight after jasmine strands unfold.'
  },
  2: {
    location: 'Sakhir Desert Mounds',
    metrics: [
      { label: 'Desert Air Clarity', value: '94% Visibility', desc: 'Superb dry stellar stargazing' },
      { label: 'Stargazing Window', value: '9:00 PM - 2:00 AM', desc: 'Clear skies near Tree of Life' },
      { label: 'Clay Mold Temp', value: 'Warm (Clay sets quick)', desc: 'Perfect Aali kick-wheel spinning' }
    ],
    icon: '🏰',
    notes: 'High atmospheric clarity over the Sakhir dunes tonight. Clear wind gusts from the East carry cool, dry breezes.'
  },
  3: {
    location: 'Jarada Tidal Shorelines',
    metrics: [
      { label: 'Disappearing Sandbar', value: 'Low Tide (2.4m Peak)', desc: 'Sand is 100% dry and exposed' },
      { label: 'Tidal Sandbar Peak', value: '11:30 AM - 2:30 PM', desc: 'Ephemeral 3-hour low-tide peak' },
      { label: 'Marine Water Temp', value: '26°C / 79°F', desc: 'Ideal shallow coral swimming' }
    ],
    icon: '⛵',
    notes: 'Coordinate closely with speedboat captains. The Jarada sandbank will completely submerge back into the turquoise Gulf by 3:45 PM.'
  },
  4: {
    location: 'Haniniya Valley Crests',
    metrics: [
      { label: 'Valley Wind Speed', value: '12 knots (Northeast)', desc: 'Cool cliffside ventilation breeze' },
      { label: 'Promenade Neon Glow', value: 'Ignites at 7:15 PM', desc: 'Best skyline waterfront reflections' },
      { label: 'Outdoor Acoustics', value: 'Calm water surface', desc: 'Ideal Reef Island coastal walk' }
    ],
    icon: '🌅',
    notes: 'Sunset winds through the valley crests are incredibly refreshing. Excellent night-sky walks along modern promenades.'
  },
  5: {
    location: 'Sitra Pearl Harbors',
    metrics: [
      { label: 'Coastal Wave Height', value: '0.4m (Gentle ripples)', desc: 'Ideal Sitra sea ferry transits' },
      { label: 'Oyster Coral Visibility', value: 'Moderate water clarity', desc: 'Spot starfish near coral reefs' },
      { label: 'Al Dar Cabana Temp', value: '29°C / 84°F', desc: 'Cool island breeze under palm shade' }
    ],
    icon: '🦪',
    notes: 'Sea ferry waters remain calm and fully safe. Bring light linens for Sitra island harbor walking.'
  }
}

const ALMANAC_DEFAULT = {
  location: 'Kingdom of Bahrain',
  metrics: [{ label: 'Temperature', value: '30°C', desc: 'Warm Gulf breeze' }],
  icon: '🇧🇭',
  notes: 'Welcome wayfarer.'
}

export function getAlmanac(dayTab) {
  return ALMANAC_DATA[dayTab] ?? ALMANAC_DEFAULT
}
