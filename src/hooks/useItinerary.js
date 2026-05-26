import { useState, useEffect } from 'react'
import { useVibe } from './useVibe'

export const spotsCatalog = [
  {
    id: 'qal-at-al-bahrain',
    name: 'Qal\'at al-Bahrain (Bahrain Fort)',
    arabic: 'قلعة البحرين',
    mood: 'empires',
    coords: '26.2339° N, 50.5198° E',
    period: 'Dilmun Empire, c. 2300 BCE',
    desc: 'An ancient harbor and UNESCO World Heritage fort standing guard over the Gulf. Archaeological strata reveal five millenia of civilizations.',
    simpleTerms: 'What this offers: A massive ancient stone fort built by the sea with historical layers going back 4,000 years. You can walk the stone towers, climb inside the dark brick corridors, and look out at the modern city skyline from the fort ramparts.',
    insider: 'Walk the outer stone ramparts at precisely 5:45 PM to witness the modern skyline catch the setting sun.',
    image: 'https://images.unsplash.com/photo-1629814406259-2187f8a70a8d?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Wander the archaeological site and visitor paths for free. Sit on the stone blocks at sunset without paying a single fils.',
    premiumGuide: 'Book a private, after-hours historical walk led by a certified archaeologist, finishing with sunset tea at a nearby luxury terrace.',
    budgetCost: 'Free Entry',
    premiumCost: '45 BHD per guide',
    category: 'fort',
    keepsakeId: 'dilmun-bull-stamp',
    keepsakeName: 'Dilmun Terracotta Bull Stamp',
    keepsakeEmoji: '🐂',
    keepsakeDesc: 'An authentic clay stamp carving recovered from the Dilmun archaeological layer, used by ancient merchants to seal shipments bound for Mesopotamia.'
  },
  {
    id: 'muharraq-souq',
    name: 'Muharraq Souq & Siyadi House',
    arabic: 'سوق المحرق وبيت سيادي',
    mood: 'spice',
    coords: '26.2572° N, 50.6121° E',
    period: 'Late 19th Century',
    desc: 'A maze of traditional alleyways breathing spices, saffron, and Bahraini halwa. The Siyadi complex shows the peak of pearling architecture.',
    simpleTerms: 'What this offers: A traditional walking market filled with the smells of cardamom, saffron, and warm spices. Here you can explore ancient merchant homes built with intricate wooden carvings, and taste traditional Bahraini Halwa fresh from local copper pots.',
    insider: 'Order hot saffron halwa from Showaiter and eat it with cardamon-spiced black coffee in the restored courtyard.',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a523?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Entrance to the Siyadi House museum is completely free. Purchase a small sampler plate of hot Bahraini Halwa at Showaiter for just 300 fils.',
    premiumGuide: 'Take a spice-blending session inside a private, family-owned merchant home, coupled with custom saffron tasting plates.',
    budgetCost: 'Under 1 BHD',
    premiumCost: '30 BHD',
    category: 'souq',
    keepsakeId: 'saffron-karak-pot',
    keepsakeName: 'Saffron Karak Dallah',
    keepsakeEmoji: '☕',
    keepsakeDesc: 'A miniature brass teapot stained with years of brewing sweet cardamom tea and hot local saffron infusions.'
  },
  {
    id: 'pearling-path',
    name: 'The Pearling Path UNESCO Trail',
    arabic: 'مسار اللؤلؤ',
    mood: 'sea',
    coords: '26.2447° N, 50.6083° E',
    period: 'UNESCO Heritage Trail',
    desc: 'A minimalist architectural journey tracing the historic pearling economy. Sleek, wind-catching structures join centuries-old homes.',
    simpleTerms: 'What this offers: A 3.5-kilometer walking trail through old streets connecting historical pearling homes. It features modern architectural shelters alongside centuries-old wind-tower houses.',
    insider: 'Start at Bu Maher Fort and take the traditional wooden sea taxi across the harbor to feel the merchant voyage.',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Walking the 3.5km architectural trail is free. The wooden water ferry from the museum to Bu Maher Fort costs only 1 BHD.',
    premiumGuide: 'Hire a local pearling historian for a detailed private walking tour of the oyster merchant residences, complete with traditional Oud performances.',
    budgetCost: '1 BHD',
    premiumCost: '50 BHD',
    category: 'coast',
    keepsakeId: 'pink-basra-pearl',
    keepsakeName: 'Natural Pink Basra Pearl',
    keepsakeEmoji: '🦪',
    keepsakeDesc: 'A flawless, highly rare natural pink oyster pearl retrieved from the deep reefs of the Bahrain northern seas by generational divers.'
  },
  {
    id: 'block-338',
    name: 'Block 338 Adliya',
    arabic: 'حي العدلية ٣٣٨',
    mood: 'lights',
    coords: '26.2185° N, 50.5912° E',
    period: 'Modern Creative Core',
    desc: 'The bohemian neighborhood of Manama. Packed with local visual arts, glowing murals, and dynamic, high-concept dining spaces.',
    simpleTerms: 'What this offers: A lively, bohemian street block filled with colorful murals, local art galleries, and modern restaurants. Perfect for a walking stroll under glowing string lights and art installations.',
    insider: 'Skip the main strip and look behind La Fontaine to find small courtyard galleries selling hand-pressed prints.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Stroll past the vibrant street art murals for free. Grab a street-side fresh shawarma and Karak tea for under 800 fils.',
    premiumGuide: 'Dine at the exclusive courtyard of La Fontaine Centre of Contemporary Art, tasting high-concept fusion dishes.',
    budgetCost: '1 BHD',
    premiumCost: '35 BHD',
    category: 'modern',
    keepsakeId: 'neon-art-palette',
    keepsakeName: 'Bohemian Neon Glass Tile',
    keepsakeEmoji: '🎨',
    keepsakeDesc: 'A small piece of hand-fused neon stained glass recovered from the artistic installations of Block 338.'
  },
  {
    id: 'jarada-island',
    name: 'Jarada Island Sandbank',
    arabic: 'جزيرة جردة',
    mood: 'sea',
    coords: '26.2201° N, 50.7725° E',
    period: 'Ephemeral Sandbank',
    desc: 'A pristine, crystal-clear white sandbank that fully submerges daily. An exclusive retreat only visible during low tide.',
    simpleTerms: 'What this offers: A magical, pure white sandbank surrounded by turquoise sea water that completely disappears under the high tide. You take a boat out, swim in clear water, and search for wild oysters.',
    insider: 'Coordinate with your boat captain for the 3-hour low-tide peak to search for wild oysters in shallow waters.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Join a shared local weekend boat pool from the marina, dividing the speedboat cost among 8-10 explorers.',
    premiumGuide: 'Charter a private high-end yacht with a dedicated captain, gourmet picnic spread, pearl-opening knife setups, and snorkeling gears.',
    budgetCost: '8 BHD (Shared)',
    premiumCost: '150 BHD (Private)',
    category: 'coast',
    keepsakeId: 'vanishing-sand-vial',
    keepsakeName: 'Vial of Ephemeral White Sand',
    keepsakeEmoji: '⏳',
    keepsakeDesc: 'A sealed glass keepsake containing the pure, tide-swept white sands gathered from Jarada Island before it vanished under the waves.'
  },
  {
    id: 'tree-of-life',
    name: 'The Tree of Life',
    arabic: 'شجرة الحياة',
    mood: 'empires',
    coords: '25.9939° N, 50.5833° E',
    period: 'Circa 1583 CE',
    desc: 'A solitary, ancient green canopy growing in the dry, deep desert of Bahrain. A botanical marvel without any apparent water source.',
    simpleTerms: 'What this offers: A 400-year-old green tree standing completely alone in the middle of a dry, hot desert. There is no visible water source for miles, making it an incredible botanical mystery.',
    insider: 'Stand close to the trunk during a wind gust; the sound of dry leaves creates a mystical, deep hum.',
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Free to visit and access. Drive your own vehicle or share a ride out into the Sakhir desert for absolute zero-cost stargazing.',
    premiumGuide: 'Arrive via a luxury 4x4 desert safari, setting up a fully catered premium sunset lounge carpet with private majlis service.',
    budgetCost: 'Free Access',
    premiumCost: '80 BHD',
    category: 'desert',
    keepsakeId: 'desert-bark-charm',
    keepsakeName: 'Mystical Green Desert Leaf',
    keepsakeEmoji: '🍃',
    keepsakeDesc: 'A petrified green leaf harvested from the lone ancient tree that defies the barren, hyper-saline sands of the Sakhir desert.'
  },
  {
    id: 'haji-cafe',
    name: 'Haji\'s Traditional Cafe',
    arabic: 'مقهى حاجي الشعبي',
    mood: 'spice',
    coords: '26.2361° N, 50.5750° E',
    period: 'Established 1950',
    desc: 'Tucked inside the alleys of Manama Souq, this legendary spot serves authentic Bahraini breakfasts on wooden benches.',
    simpleTerms: 'What this offers: A historic local cafe running since 1950 inside a narrow alley. There is no menu—they simply bring you whatever traditional food is freshly cooking in the kitchen!',
    insider: 'Order the traditional tomato eggs with warm, freshly baked Khubz and sweet cardamom-spiced karak tea.',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Feast on a massive traditional egg breakfast, baked flatbreads, honey, and tea for under 2 BHD.',
    premiumGuide: 'Request a custom, multi-course private morning tasting with Haji’s head chef, explaining the heritage behind every dish.',
    budgetCost: '1.5 BHD',
    premiumCost: '12 BHD',
    category: 'souq',
    keepsakeId: 'haji-bench-token',
    keepsakeName: 'Engraved Haji Wooden Token',
    keepsakeEmoji: '🪙',
    keepsakeDesc: 'A hand-carved wooden token stamped with the year 1950, commemorating breakfast served on Haji\'s famous rustic benches.'
  },
  {
    id: 'aali-pottery',
    name: 'A\'ali Pottery Hamlet',
    arabic: 'فخار عالي',
    mood: 'empires',
    coords: '26.1555° N, 50.5283° E',
    period: 'Generational Craft',
    desc: 'Watch local masters shape local red clay using hand wheels, firing them in kilns built alongside ancient Dilmun mounds.',
    simpleTerms: 'What this offers: A historic potting village where local craftsmen mold wet red clay into large jars and pots by hand. They bake them inside brick kilns built right next to ancient burial mounds.',
    insider: 'Ask Master Craftsman Jafar to demonstrate the foot-wheel spin; he is among the last to use the ancient Dilmun kick method.',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Completely free to walk around the workshops and watch the craftsmen spin the clay in their rustic kilns.',
    premiumGuide: 'Take a pottery masterclass from a generational craftsman, molding and baking your own custom terracotta vessel.',
    budgetCost: 'Free Watching',
    premiumCost: '15 BHD',
    category: 'culture',
    keepsakeId: 'red-clay-chalice',
    keepsakeName: 'Terracotta Red Clay Amulet',
    keepsakeEmoji: '🏺',
    keepsakeDesc: 'A tiny, circular amulet shaped from wet Sakhir red clay and baked inside Master Jafar\'s generational wood-fired brick kiln.'
  },
  {
    id: 'arad-fort',
    name: 'Arad Fort (Qal\'at Arad)',
    arabic: 'قلعة عراد',
    mood: 'empires',
    coords: '26.2522° N, 50.6272° E',
    period: 'Late 15th Century',
    desc: 'A sea-facing fort built in a unique square shape, historically protecting the ancient waterways of Muharraq.',
    simpleTerms: 'What this offers: A sea-facing stone fortress built in a unique square shape. You can walk around the deep dry moat, touch heavy limestone defensive walls, and watch birds fly over the surrounding bay.',
    insider: 'Visit at dusk when the surrounding park opens, letting you walk alongside the sea breeze as the fort lights up.',
    image: 'https://images.unsplash.com/photo-1624647313386-77884ffbc32a?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Entrance inside the fort is just 1 BHD. Walking the surrounding sea park paths is completely free.',
    premiumGuide: 'Hire a personal local historian for a private, early-morning coastal military lecture inside the tower chambers.',
    budgetCost: '1 BHD',
    premiumCost: '25 BHD',
    category: 'fort',
    keepsakeId: 'moat-guard-key',
    keepsakeName: 'Arad Moat Iron Lock-Key',
    keepsakeEmoji: '🔑',
    keepsakeDesc: 'A heavy, oxidized iron skeleton key replicating the ancient locks used to secure the sea-gates of Arad Fort.'
  },
  {
    id: 'national-museum',
    name: 'Bahrain National Museum',
    arabic: 'متحف البحرين الوطني',
    mood: 'sea',
    coords: '26.2413° N, 50.5977° E',
    period: 'Modern travertine core',
    desc: 'A gorgeous modernist travertine building right on the waterfront, preserving 5,000 years of the region\'s rich history.',
    simpleTerms: 'What this offers: A gorgeous modern building made of warm travertine stone sitting right on the sea. Inside, it preserves 5,000-year-old gold burial treasures, ancient clay tablets, and life-sized traditional sea boats.',
    insider: 'Dine at the waterfront cafe at 3:00 PM for the calmest sea views and excellent Arabic coffee.',
    image: 'https://images.unsplash.com/photo-1547631006-f5c9e2b830d4?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Entrance ticket to the entire museum, halls, and archaeological collections is only 1 BHD.',
    premiumGuide: 'Secure a curated private archive tour showing rare manuscripts and pearl-merchant relics not open to the public.',
    budgetCost: '1 BHD',
    premiumCost: '40 BHD',
    category: 'coast',
    keepsakeId: 'gold-dilmun-leaf',
    keepsakeName: 'Gold-Foil Dilmun Crown Leaf',
    keepsakeEmoji: '👑',
    keepsakeDesc: 'A delicate, leaf-shaped replica crafted from razor-thin gold foil, modeled after the burial headpieces of ancient Dilmun royalty.'
  },
  {
    id: 'al-dar-islands',
    name: 'Al Dar Islands Sitra',
    arabic: 'جزيرة الدار',
    mood: 'sea',
    coords: '26.1558° N, 50.6833° E',
    period: 'Island Sanctuary',
    desc: 'A quick sea taxi ferry escape to a peaceful sandy beach island offering shallow corals and warm Gulf waters.',
    simpleTerms: 'What this offers: A quick 10-minute traditional wooden ferry ride from Sitra port to a beautiful island retreat. You can swim in shallow, warm sea water, relax under cabanas, and listen to the waves.',
    insider: 'Rent a kayak and row out to the shallow coral reefs at 10 AM to spot blue swimming crabs and starfish in their native habitat.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'The basic water ferry transport and island entry ticket is 5 BHD. Bring your own beach towel and snacks to save BHDs.',
    premiumGuide: 'Rent a private, luxurious beach cabana equipped with air conditioning, personal ice chests, and boat waiters.',
    budgetCost: '5 BHD',
    premiumCost: '60 BHD',
    category: 'coast',
    keepsakeId: 'coral-reef-sprig',
    keepsakeName: 'Turquoise Coral Shell',
    keepsakeEmoji: '🪸',
    keepsakeDesc: 'A small fossilized branch of sea coral, showing the rich, warm marine reef ecosystems surrounding Sitra coastlines.'
  },
  {
    id: 'reef-island',
    name: 'Reef Island Promenade',
    arabic: 'جزيرة الريف',
    mood: 'lights',
    coords: '26.2483° N, 50.5694° E',
    period: 'Modern Marina District',
    desc: 'A luxury pedestrian island promenade flanked by modern architectures, swaying palms, and quiet waterfront dining.',
    simpleTerms: 'What this offers: A modern man-made island with a quiet, beautiful pedestrian walking promenade. You go here for a calm evening walk alongside swaying palm trees, looking out at the city skyline lights.',
    insider: 'Walk the promenade at 8:00 PM when the sea breezes pick up and the skyscrapers ignite their neon arrays.',
    image: 'https://images.unsplash.com/photo-1493397862567-47eed0e3f051?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Walking, entering, and strolling along the entire waterfront promenade is completely free of charge.',
    premiumGuide: 'Indulge in a premium, multi-course dining experience overlooking the yacht marina at a luxury resort.',
    budgetCost: 'Free Access',
    premiumCost: '45 BHD',
    category: 'modern',
    keepsakeId: 'palm-neon-fan',
    keepsakeName: 'Woven Silver Palm Fan',
    keepsakeEmoji: '🪭',
    keepsakeDesc: 'An elegant hand-held fan woven from local palm fibers and lined with silver-painted details, reflecting Reef Island\'s modern luxury.'
  },
  {
    id: 'riffa-fort',
    name: 'Riffa Fort (Sheikh Salman Fort)',
    arabic: 'قلعة الرفاع',
    mood: 'empires',
    coords: '26.1172° N, 50.5622° E',
    period: 'Built 1812 CE',
    desc: 'A magnificent sand-colored fortress perched on a cliff edge overlooking the low-lying Haniniya Valley, showcasing classic Al-Khalifa architecture.',
    simpleTerms: 'What this offers: A beautiful, historic castle sitting on a high cliff with sweeping valley views. You can walk through large open courtyards, climb heavy military towers, and sit at a scenic coffee house built right inside the fort walls.',
    insider: 'Sit at the indoor terrace cafe at sunset; the wind blowing through the Haniniya Valley creates a cool, refreshing breeze.',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Entrance ticket to walk the fort and cliff ramparts is free. Enjoy a small Arabic coffee for 500 fils at the valley cafe.',
    premiumGuide: 'Book an exclusive after-hours custom tour of the private residential quarters led by a cultural historian, ending with gourmet Arabic cuisine.',
    budgetCost: 'Free Access',
    premiumCost: '35 BHD',
    category: 'fort',
    keepsakeId: 'valley-dagger',
    keepsakeName: 'Wood-Carved Riffa Dagger',
    keepsakeEmoji: '🗡️',
    keepsakeDesc: 'A miniature wooden dagger featuring intricate Arabic geometric engravings, honoring the historic defense lineage of Riffa Fort.'
  },
  {
    id: 'barbar-temple',
    name: 'Barbar Dilmun Temple',
    arabic: 'معبد باربار',
    mood: 'empires',
    coords: '26.2231° N, 50.4856° E',
    period: 'Dilmun Era, c. 3000 BCE',
    desc: 'An archaeological site holding three successive ancient temples built around a sacred, bubbling fresh-water spring.',
    simpleTerms: 'What this offers: An incredible archaeological ruin going back 5,000 years. You can walk the stone paths connecting three layers of ancient temples, see sacrificial altars, and stand next to a sacred natural water well.',
    insider: 'Peer into the central well; you can still see the natural freshwater bubbles that ancient priestesses worshipped.',
    image: 'https://images.unsplash.com/photo-1629814406259-2187f8a70a8d?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Walking the archaeological trails and stone mounds is completely free. Bring water and explore the ruins at your own pace.',
    premiumGuide: 'Hire a licensed archaeologist for an in-depth private analysis of the stone carvings, sacrificial altars, and fresh-water channels.',
    budgetCost: 'Free Access',
    premiumCost: '28 BHD',
    category: 'fort',
    keepsakeId: 'sacred-chalice',
    keepsakeName: 'Dilmun Sacred Stone Chalice',
    keepsakeEmoji: '🍷',
    keepsakeDesc: 'A hand-ground limestone water cup modeled after the sacrificial offering chalices found near the sacred Barbar temple spring.'
  },
  {
    id: 'al-jasra-house',
    name: 'Al Jasra Handicrafts & House',
    arabic: 'بيت الجسرة وحرفها',
    mood: 'empires',
    coords: '26.1601° N, 50.4632° E',
    period: 'Built 1907 CE',
    desc: 'A gorgeous traditional house built of coral stone and palm trunks, standing next to a bustling artisan crafting pavilion.',
    simpleTerms: 'What this offers: A beautiful, historic home made of natural coral and palm wood. Next door is an open workshop where local craftsmen weave palm baskets, shape model sea-boats, and weave fine fabrics by hand.',
    insider: 'Sit with the palm-leaf basket weavers in the central room; they will show you the ancient over-under pattern for free.',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Completely free to walk the historic house rooms and watch the basket weavers create items in their workshop.',
    premiumGuide: 'Take a private, hands-on basket weaving workshop with a generational craftsman, weaving your own authentic palm box.',
    budgetCost: 'Free Watching',
    premiumCost: '18 BHD',
    category: 'culture',
    keepsakeId: 'palm-basket-box',
    keepsakeName: 'Woven Al Jasra Palm Box',
    keepsakeEmoji: '🧺',
    keepsakeDesc: 'A tiny, aromatic container hand-woven from green Sakhir palm fronds inside the heritage workshops of Al Jasra.'
  },
  {
    id: 'khalaf-house',
    name: 'Khalaf House (Pearling Landmark)',
    arabic: 'بيت خلف للأبحاث',
    mood: 'sea',
    coords: '26.2415° N, 50.6012° E',
    period: 'Late 19th Century',
    desc: 'A beautifully preserved traditional home dedicated to pearl merchant heritage, featuring gorgeous coral masonry and wood.',
    simpleTerms: 'What this offers: A stunning, quiet heritage house in a small neighborhood alley. It serves as a research hub for pearling history, showing the traditional reception rooms where pearl transactions worth fortunes took place.',
    insider: 'Walk inside the high-ceilinged Majlis room; the natural ventilation systems keep the room cool even in summer heat.',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Entering, exploring, and viewing the pearling archives inside the house is completely free of charge.',
    premiumGuide: 'Host a private Arabic coffee Majlis session inside the historic reception room, complete with an expert pearling lecture.',
    budgetCost: 'Free Access',
    premiumCost: '40 BHD',
    category: 'culture',
    keepsakeId: 'oyster-weight-scale',
    keepsakeName: 'Pearl Merchant Brass Scale',
    keepsakeEmoji: '⚖️',
    keepsakeDesc: 'A small, polished brass pocket balance-scale historically used by pearl merchants to weigh rare sea pearls against carats.'
  },
  {
    id: 'manama-souq',
    name: 'Bab Al Bahrain & Manama Souq',
    arabic: 'باب البحرين وسوق المنامة',
    mood: 'spice',
    coords: '26.2360° N, 50.5744° E',
    period: 'Gateway Opened 1949',
    desc: 'The iconic historical arch gateway marking the entrance to the bustling, labyrinth spice lanes of Manama Souq.',
    simpleTerms: 'What this offers: A famous stone gateway arches that leads into a giant maze of market streets. Here you can shop for fresh jasmine flowers, spices, traditional perfumes, and hot local foods.',
    insider: 'Take the narrow alleyway left of Bab Al Bahrain at 7:00 PM to buy fresh, highly aromatic white jasmine flower strings.',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a523?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'Strolling past the historic gate and the market stalls is free. Buy a fresh jasmine string for 500 fils to wear.',
    premiumGuide: 'Take a private, guided historical shopping tour with a local resident, custom blending your own traditional Oud oil perfume.',
    budgetCost: 'Under 1 BHD',
    premiumCost: '30 BHD',
    category: 'souq',
    keepsakeId: 'dallah-spice-pot',
    keepsakeName: 'Miniature Brass Dallah Pot',
    keepsakeEmoji: '🫖',
    keepsakeDesc: 'A traditional, long-beaked brass Dallah pot used to brew coffee, representing the legendary hospitality of Manama Souq.'
  },
  {
    id: 'al-areen',
    name: 'Al Areen Wildlife Sakhir Park',
    arabic: 'محمية العرين',
    mood: 'desert',
    coords: '26.0022° N, 50.4851° E',
    period: 'Established 1976',
    desc: 'A vast desert wildlife sanctuary preserving the legendary Arabian Oryx, rare desert birds, and native flora of the Gulf.',
    simpleTerms: 'What this offers: A massive desert park where you can see the rare Arabian Oryx (a beautiful white antelope with long horns), desert cheetahs, and giant water birds roaming in their natural habitat.',
    insider: 'Take the open-air shuttle cart early at 9:00 AM; it is the exact feeding time when the Oryx herds are most active.',
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop',
    budgetGuide: 'The entry ticket to the entire wildlife sanctuary and botanical park is only 1 BHD.',
    premiumGuide: 'Book a private, air-conditioned luxury safari vehicle driven by a wildlife ranger, feeding the rare birds and antelopes directly.',
    budgetCost: '1 BHD',
    premiumCost: '35 BHD',
    category: 'desert',
    keepsakeId: 'oryx-bone-ring',
    keepsakeName: 'Carved Oryx Gazelle Ring',
    keepsakeEmoji: '💍',
    keepsakeDesc: 'A bone-carved finger ring decorated with traditional engravings, honoring the majestic Arabian Oryx of Al Areen.'
  }
]

const categoryImages = {
  fort: 'https://images.unsplash.com/photo-1629814406259-2187f8a70a8d?q=80&w=1200&auto=format&fit=crop',
  souq: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a523?q=80&w=1200&auto=format&fit=crop',
  coast: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
  modern: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop',
  desert: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop',
  culture: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=1200&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1200&auto=format&fit=crop'
}

export function useItinerary(selectedMoods = [], tierFilter = 'Wandering', durationFilter = 3, aiItinerary = null) {
  const { itinerarySpots } = useVibe()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (itinerarySpots && itinerarySpots.length > 0) {
      setLocations(itinerarySpots)
      setLoading(false)
      return
    }

    let active = true
    
    const delay = setTimeout(() => {
      try {
        if (aiItinerary && aiItinerary.itinerary && Array.isArray(aiItinerary.itinerary)) {
          const mapped = aiItinerary.itinerary
            .map(aiItem => {
              const catalogSpot = spotsCatalog.find(s => s.id === aiItem.id)
              
              if (catalogSpot) {
                return {
                  ...catalogSpot,
                  day: aiItem.day,
                  pathGuide: tierFilter === 'Wandering' ? catalogSpot.budgetGuide : catalogSpot.premiumGuide,
                  pathCost: tierFilter === 'Wandering' ? catalogSpot.budgetCost : catalogSpot.premiumCost
                }
              }

              // Fallback dynamic mapping in case the ID fails to match but has categories
              const cat = aiItem.category ? aiItem.category.toLowerCase() : 'culture'
              const imgUrl = categoryImages[cat] || categoryImages.default

              return {
                id: aiItem.id || `spot-${Math.random().toString(36).substr(2, 9)}`,
                name: aiItem.name || 'Authentic Bahrain Landmark',
                arabic: aiItem.arabic || 'معلم بحريني',
                mood: aiItem.mood || 'empires',
                coords: aiItem.coords || '26.2285° N, 50.5860° E',
                period: aiItem.period || 'Ancient Era',
                desc: aiItem.desc || 'An authentic local spot full of history and heritage waiting to be discovered.',
                simpleTerms: aiItem.simpleTerms || 'What this offers: A gorgeous historical landmark rich in cultural legacy.',
                insider: aiItem.insider || 'Speak to local shopkeepers nearby; they love sharing stories about the ancient Dilmun history of this area.',
                pathGuide: aiItem.pathGuide || 'Walk around the grounds and enjoy the beautiful heritage architecture.',
                pathCost: aiItem.pathCost || 'Free Entry',
                image: imgUrl,
                day: aiItem.day || 1
              }
            })
            .filter(Boolean)

          if (active) {
            setLocations(mapped.sort((a, b) => a.day - b.day))
            setError(null)
            setLoading(false)
          }
          return
        }

        const filtered = spotsCatalog.filter(s => selectedMoods.includes(s.mood))
        
        const mapped = filtered.map((item, idx) => {
          const targetDay = (idx % durationFilter) + 1

          return {
            ...item,
            day: targetDay,
            pathGuide: tierFilter === 'Wandering' ? item.budgetGuide : item.premiumGuide,
            pathCost: tierFilter === 'Wandering' ? item.budgetCost : item.premiumCost
          }
        })

        const sorted = mapped.sort((a, b) => a.day - b.day)

        if (active) {
          setLocations(sorted)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (active) setError(err)
      } finally {
        if (active) setLoading(false)
      }
    }, 800)

    return () => {
      active = false
      clearTimeout(delay)
      setLoading(true)
    }
  }, [selectedMoods, tierFilter, durationFilter, aiItinerary, itinerarySpots])

  return { locations, loading, error }
}
