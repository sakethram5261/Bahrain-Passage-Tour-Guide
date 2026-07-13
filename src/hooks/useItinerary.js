import { useState, useEffect } from 'react'

export const spotsCatalog = [
  {
    id: 'qal-at-al-bahrain',
    name: 'Qal\'at al-Bahrain (Bahrain Fort)',
    arabic: 'قلعة البحرين',
    mood: 'empires',
    coords: '26.2339° N, 50.5198° E',
    period: 'Dilmun Empire, c. 2300 BCE',
    desc: 'Feel the rough, sun-baked coral stone under your fingertips and breathe in the salt-heavy sea wind. As the Call to Prayer echoes from Muharraq, watch the orange sunset paint 4,000 years of civilization buried beneath your boots, where Dilmun merchants once unloaded copper shipments.',
    simpleTerms: 'What this offers: A massive ancient stone fort built by the sea with historical layers going back 4,000 years. You can walk the stone towers, climb inside the dark brick corridors, and look out at the modern city skyline from the fort ramparts.',
    insider: 'Walk the outer stone ramparts at precisely 5:45 PM to witness the modern skyline catch the setting sun.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Bahrain_Fort_March_2015.JPG',
    budgetGuide: 'Wander the archaeological site and visitor paths for free. Sit on the stone blocks at sunset without paying a single fils.',
    premiumGuide: 'Book a private, after-hours historical walk led by a certified archaeologist, finishing with sunset tea at a nearby luxury terrace.',
    budgetCost: 'Free Entry',
    premiumCost: '45 BHD per guide',
    category: 'fort',
    keepsakeId: 'dilmun-bull-stamp',
    keepsakeName: 'Dilmun Terracotta Bull Stamp',
    keepsakeEmoji: '🐂',
    keepsakeDesc: 'An authentic clay stamp carving recovered from the Dilmun archaeological layer, used by ancient merchants to seal shipments bound for Mesopotamia.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/DamagedHelmet.glb'
  },
  {
    id: 'muharraq-souq',
    name: 'Muharraq Souq & Siyadi House',
    arabic: 'سوق المحرق وبيت سيادي',
    mood: 'spice',
    coords: '26.2572° N, 50.6121° E',
    period: 'Late 19th Century',
    desc: 'Step into a fragrant labyrinth of crushed cardamom, sweet frankincense, and warm Bahraini halwa bubbling in copper vats. The air is alive with the chatter of gold traders and the clink of glass cups, set against the exquisite gypsum lattice screens of the historic Siyadi merchant house.',
    simpleTerms: 'What this offers: A traditional walking market filled with the smells of cardamom, saffron, and warm spices. Here you can explore ancient merchant homes built with intricate wooden carvings, and taste traditional Bahraini Halwa fresh from local copper pots.',
    insider: 'Order hot saffron halwa from Showaiter and eat it with cardamon-spiced black coffee in the restored courtyard.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Mosque_and_Bait_Siyadi%2C_Muharraq%2C_Bahrain.jpg',
    budgetGuide: 'Entrance to the Siyadi House museum is completely free. Purchase a small sampler plate of hot Bahraini Halwa at Showaiter for just 300 fils.',
    premiumGuide: 'Take a spice-blending session inside a private, family-owned merchant home, coupled with custom saffron tasting plates.',
    budgetCost: 'Under 1 BHD',
    premiumCost: '30 BHD',
    category: 'souq',
    keepsakeId: 'saffron-karak-pot',
    keepsakeName: 'Saffron Karak Dallah',
    keepsakeEmoji: '☕',
    keepsakeDesc: 'A miniature brass teapot stained with years of brewing sweet cardamom tea and hot local saffron infusions.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb'
  },
  {
    id: 'pearling-path',
    name: 'The Pearling Path UNESCO Trail',
    arabic: 'مسار اللؤلؤ',
    mood: 'sea',
    coords: '26.2447° N, 50.6083° E',
    period: 'UNESCO Heritage Trail',
    desc: 'Trace the footsteps of bare-chested pearl divers on a dusty path where sea winds whistle through high coral-stone wind-towers. Under modern, white pearling-relic canopy structures, listen to the faint, rhythmic songs of ancient dhow crews bouncing off the sun-bleached facades.',
    simpleTerms: 'What this offers: A 3.5-kilometer walking trail through old streets connecting historical pearling homes. It features modern architectural shelters alongside centuries-old wind-tower houses.',
    insider: 'Start at Bu Maher Fort and take the traditional wooden sea taxi across the harbor to feel the merchant voyage.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Bahrain%27s_Pearling_Pathway_%2818640000885%29.jpg',
    budgetGuide: 'Walking the 3.5km architectural trail is free. The wooden water ferry from the museum to Bu Maher Fort costs only 1 BHD.',
    premiumGuide: 'Hire a local pearling historian for a detailed private walking tour of the oyster merchant residences, complete with traditional Oud performances.',
    budgetCost: '1 BHD',
    premiumCost: '50 BHD',
    category: 'coast',
    keepsakeId: 'pink-basra-pearl',
    keepsakeName: 'Natural Pink Basra Pearl',
    keepsakeEmoji: '🦪',
    keepsakeDesc: 'A flawless, highly rare natural pink oyster pearl retrieved from the deep reefs of the Bahrain northern seas by generational divers.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb'
  },
  {
    id: 'block-338',
    name: 'Block 338 Adliya',
    arabic: 'حي العدلية ٣٣٨',
    mood: 'lights',
    coords: '26.2185° N, 50.5912° E',
    period: 'Modern Creative Core',
    desc: 'A vibrant bohemian haven humming with the chatter of young artists and the aroma of cardamon coffees. Stroll under canopy string lights through alleys adorned with vivid murals, discovering hidden print shops and secret courtyards thick with jasmine and local melodies.',
    simpleTerms: 'What this offers: A lively, bohemian street block filled with colorful murals, local art galleries, and modern restaurants. Perfect for a walking stroll under glowing string lights and art installations.',
    insider: 'Skip the main strip and look behind La Fontaine to find small courtyard galleries selling hand-pressed prints.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Stroll past the vibrant street art murals for free. Grab a street-side fresh shawarma and Karak tea for under 800 fils.',
    premiumGuide: 'Dine at the exclusive courtyard of La Fontaine Centre of Contemporary Art, tasting high-concept fusion dishes.',
    budgetCost: '1 BHD',
    premiumCost: '35 BHD',
    category: 'modern',
    keepsakeId: 'neon-art-palette',
    keepsakeName: 'Bohemian Neon Glass Tile',
    keepsakeEmoji: '🎨',
    keepsakeDesc: 'A small piece of hand-fused neon stained glass recovered from the artistic installations of Block 338.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Box/glTF-Binary/Box.glb'
  },
  {
    id: 'jarada-island',
    name: 'Jarada Island Sandbank',
    arabic: 'جزيرة جردة',
    mood: 'sea',
    coords: '26.2201° N, 50.7725° E',
    period: 'Ephemeral Sandbank',
    desc: 'Plunge into cool, glass-like turquoise water on a pure white sandbar that rises from the Gulf only for a few hours before vanishing beneath the tides. Dig your toes into wet, salt-caked sands to search for wild oysters, feeling the warm mid-day sun on your shoulders.',
    simpleTerms: 'What this offers: A magical, pure white sandbank surrounded by turquoise sea water that completely disappears under the high tide. You take a boat out, swim in clear water, and search for wild oysters.',
    insider: 'Coordinate with your boat captain for the 3-hour low-tide peak to search for wild oysters in shallow waters.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Join a shared local weekend boat pool from the marina, dividing the speedboat cost among 8-10 explorers.',
    premiumGuide: 'Charter a private high-end yacht with a dedicated captain, gourmet picnic spread, pearl-opening knife setups, and snorkeling gears.',
    budgetCost: '8 BHD (Shared)',
    premiumCost: '150 BHD (Private)',
    category: 'coast',
    keepsakeId: 'vanishing-sand-vial',
    keepsakeName: 'Vial of Ephemeral White Sand',
    keepsakeEmoji: '⏳',
    keepsakeDesc: 'A sealed glass keepsake containing the pure, tide-swept white sands gathered from Jarada Island before it vanished under the waves.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb'
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/42/2010-03_Tree_of_Life_Bahrain.jpg',
    budgetGuide: 'Free to visit and access. Drive your own vehicle or share a ride out into the Sakhir desert for absolute zero-cost stargazing.',
    premiumGuide: 'Arrive via a luxury 4x4 desert safari, setting up a fully catered premium sunset lounge carpet with private majlis service.',
    budgetCost: 'Free Access',
    premiumCost: '80 BHD',
    category: 'desert',
    keepsakeId: 'desert-bark-charm',
    keepsakeName: 'Mystical Green Desert Leaf',
    keepsakeEmoji: '🍃',
    keepsakeDesc: 'A petrified green leaf harvested from the lone ancient tree that defies the barren, hyper-saline sands of the Sakhir desert.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb'
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
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Feast on a massive traditional egg breakfast, baked flatbreads, honey, and tea for under 2 BHD.',
    premiumGuide: 'Request a custom, multi-course private morning tasting with Haji’s head chef, explaining the heritage behind every dish.',
    budgetCost: '1.5 BHD',
    premiumCost: '12 BHD',
    category: 'souq',
    keepsakeId: 'haji-bench-token',
    keepsakeName: 'Engraved Haji Wooden Token',
    keepsakeEmoji: '🪙',
    keepsakeDesc: 'A hand-carved wooden token stamped with the year 1950, commemorating breakfast served on Haji\'s famous rustic benches.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Duck/glTF-Binary/Duck.glb'
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
    insider: 'Ask the master potters to demonstrate the foot-wheel spin; they are among the last to use the ancient Dilmun kick method.',
    image: 'https://images.unsplash.com/photo-1565192647048-f997ded87ab0?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Completely free to walk around the workshops and watch the craftsmen spin the clay in their rustic kilns.',
    premiumGuide: 'Take a pottery masterclass from a generational craftsman, molding and baking your own custom terracotta vessel.',
    budgetCost: 'Free Watching',
    premiumCost: '15 BHD',
    category: 'culture',
    keepsakeId: 'red-clay-chalice',
    keepsakeName: 'Terracotta Red Clay Amulet',
    keepsakeEmoji: '🏺',
    keepsakeDesc: 'A tiny, circular amulet shaped from wet Sakhir red clay and baked inside a generational wood-fired brick kiln.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BrainStem/glTF-Binary/BrainStem.glb'
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Arad_Fort%2C_Bahrain%2C_15th_century_%285%29.jpg',
    budgetGuide: 'Entrance inside the fort is just 1 BHD. Walking the surrounding sea park paths is completely free.',
    premiumGuide: 'Hire a personal local historian for a private, early-morning coastal military lecture inside the tower chambers.',
    budgetCost: '1 BHD',
    premiumCost: '25 BHD',
    category: 'fort',
    keepsakeId: 'moat-guard-key',
    keepsakeName: 'Arad Moat Iron Lock-Key',
    keepsakeEmoji: '🔑',
    keepsakeDesc: 'A heavy, oxidized iron skeleton key replicating the ancient locks used to secure the sea-gates of Arad Fort.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb'
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Manama_Bahrain_National_Museum_Exterior_1.jpg',
    budgetGuide: 'Entrance ticket to the entire museum, halls, and archaeological collections is only 1 BHD.',
    premiumGuide: 'Secure a curated private archive tour showing rare manuscripts and pearl-merchant relics not open to the public.',
    budgetCost: '1 BHD',
    premiumCost: '40 BHD',
    category: 'coast',
    keepsakeId: 'gold-dilmun-leaf',
    keepsakeName: 'Gold-Foil Dilmun Crown Leaf',
    keepsakeEmoji: '👑',
    keepsakeDesc: 'A delicate, leaf-shaped replica crafted from razor-thin gold foil, modeled after the burial headpieces of ancient Dilmun royalty.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Corset/glTF-Binary/Corset.glb'
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
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'The basic water ferry transport and island entry ticket is 5 BHD. Bring your own beach towel and snacks to save BHDs.',
    premiumGuide: 'Rent a private, luxurious beach cabana equipped with air conditioning, personal ice chests, and boat waiters.',
    budgetCost: '5 BHD',
    premiumCost: '60 BHD',
    category: 'coast',
    keepsakeId: 'coral-reef-sprig',
    keepsakeName: 'Turquoise Coral Shell',
    keepsakeEmoji: '🪸',
    keepsakeDesc: 'A small fossilized branch of sea coral, showing the rich, warm marine reef ecosystems surrounding Sitra coastlines.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb'
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
    image: 'https://images.unsplash.com/photo-1518242008880-ca5e7f9f545a?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Walking, entering, and strolling along the entire waterfront promenade is completely free of charge.',
    premiumGuide: 'Indulge in a premium, multi-course dining experience overlooking the yacht marina at a luxury resort.',
    budgetCost: 'Free Access',
    premiumCost: '45 BHD',
    category: 'modern',
    keepsakeId: 'palm-neon-fan',
    keepsakeName: 'Woven Silver Palm Fan',
    keepsakeEmoji: '🪭',
    keepsakeDesc: 'An elegant hand-held fan woven from local palm fibers and lined with silver-painted details, reflecting Reef Island\'s modern luxury.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf'
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Riffa_Riffa_Fort_Exterior_10.jpg',
    budgetGuide: 'Entrance ticket to walk the fort and cliff ramparts is free. Enjoy a small Arabic coffee for 500 fils at the valley cafe.',
    premiumGuide: 'Book an exclusive after-hours custom tour of the private residential quarters led by a cultural historian, ending with gourmet Arabic cuisine.',
    budgetCost: 'Free Access',
    premiumCost: '35 BHD',
    category: 'fort',
    keepsakeId: 'valley-dagger',
    keepsakeName: 'Wood-Carved Riffa Dagger',
    keepsakeEmoji: '🗡️',
    keepsakeDesc: 'A miniature wooden dagger featuring intricate Arabic geometric engravings, honoring the historic defense lineage of Riffa Fort.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Fox/glTF-Binary/Fox.glb'
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Barbar_temple%2C_Dilmun_culture%2C_ca._3000-2000_BCE%3B_Bahrain_%284%29.jpg',
    budgetGuide: 'Walking the archaeological trails and stone mounds is completely free. Bring water and explore the ruins at your own pace.',
    premiumGuide: 'Hire a licensed archaeologist for an in-depth private analysis of the stone carvings, sacrificial altars, and fresh-water channels.',
    budgetCost: 'Free Access',
    premiumCost: '28 BHD',
    category: 'fort',
    keepsakeId: 'sacred-chalice',
    keepsakeName: 'Dilmun Sacred Stone Chalice',
    keepsakeEmoji: '🍷',
    keepsakeDesc: 'A hand-ground limestone water cup modeled after the sacrificial offering chalices found near the sacred Barbar temple spring.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb'
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Al-Jasra_House.jpg',
    budgetGuide: 'Completely free to walk the historic house rooms and watch the basket weavers create items in their workshop.',
    premiumGuide: 'Take a private, hands-on basket weaving workshop with a generational craftsman, weaving your own authentic palm box.',
    budgetCost: 'Free Watching',
    premiumCost: '18 BHD',
    category: 'culture',
    keepsakeId: 'palm-basket-box',
    keepsakeName: 'Woven Al Jasra Palm Box',
    keepsakeEmoji: '🧺',
    keepsakeDesc: 'A tiny, aromatic container hand-woven from green Sakhir palm fronds inside the heritage workshops of Al Jasra.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/Chair.glb'
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
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Entering, exploring, and viewing the pearling archives inside the house is completely free of charge.',
    premiumGuide: 'Host a private Arabic coffee Majlis session inside the historic reception room, complete with an expert pearling lecture.',
    budgetCost: 'Free Access',
    premiumCost: '40 BHD',
    category: 'culture',
    keepsakeId: 'oyster-weight-scale',
    keepsakeName: 'Pearl Merchant Brass Scale',
    keepsakeEmoji: '⚖️',
    keepsakeDesc: 'A small, polished brass pocket balance-scale historically used by pearl merchants to weigh rare sea pearls against carats.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Buggy/glTF-Binary/Buggy.glb'
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Manama_Bab_al-Bahrain_Souq_1.jpg',
    budgetGuide: 'Strolling past the historic gate and the market stalls is free. Buy a fresh jasmine string for 500 fils to wear.',
    premiumGuide: 'Take a private, guided historical shopping tour with a local resident, custom blending your own traditional Oud oil perfume.',
    budgetCost: 'Under 1 BHD',
    premiumCost: '30 BHD',
    category: 'souq',
    keepsakeId: 'dallah-spice-pot',
    keepsakeName: 'Miniature Brass Dallah Pot',
    keepsakeEmoji: '🫖',
    keepsakeDesc: 'A traditional, long-beaked brass Dallah pot used to brew coffee, representing the legendary hospitality of Manama Souq.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb'
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Birds_in_Al-Areen_Wildlife_Park.jpg',
    budgetGuide: 'The entry ticket to the entire wildlife sanctuary and botanical park is only 1 BHD.',
    premiumGuide: 'Book a private, air-conditioned luxury safari vehicle driven by a wildlife ranger, feeding the rare birds and antelopes directly.',
    budgetCost: '1 BHD',
    premiumCost: '35 BHD',
    category: 'desert',
    keepsakeId: 'oryx-bone-ring',
    keepsakeName: 'Carved Oryx Gazelle Ring',
    keepsakeEmoji: '💍',
    keepsakeDesc: 'A bone-carved finger ring decorated with traditional engravings, honoring the majestic Arabian Oryx of Al Areen.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BoomBox/glTF-Binary/BoomBox.glb'
  },
  {
    id: 'airport-arrival',
    name: 'Bahrain Airport (Arrival)',
    arabic: 'مطار البحرين الدولي - وصول',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Bahrain_International_Airport_%28New_Terminal%29.jpg',
    mood: 'airport',
    coords: '26.2708° N, 50.6336° E',
    period: 'Modern Gateway',
    desc: 'Step off your flight into the sensory warmth of Bahrain. Your journey starts at the island\'s state-of-the-art terminal.',
    simpleTerms: 'What this offers: The starting point of your trip. Meet your local guide, clear customs, collect your local travel stipend, and catch your airport transit.',
    insider: 'Visit the tourist information desk right outside baggage claim to pick up a free tourist SIM card.',
    budgetGuide: 'Take the local red bus (A1 or A2) directly to Manama city center for under 300 Fils.',
    premiumGuide: 'Your private chauffeur will meet you at arrivals with a cold towel, driving you in a premium sedan to your boutique stay.',
    budgetCost: '300 Fils (Bus)',
    premiumCost: '15 BHD (Chauffeur)',
    category: 'culture',
    keepsakeId: 'passport-seal-arrival',
    keepsakeName: 'Arrival Passport Ink Stamp',
    keepsakeEmoji: '✈️',
    keepsakeDesc: 'A crisp red ink stamp in your traveler journal, sealing your official entry into the Kingdom of Bahrain.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/Shoe.glb'
  },
  {
    id: 'airport-departure',
    name: 'Bahrain Airport (Departure)',
    arabic: 'مطار البحرين الدولي - مغادرة',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Bahrain_International_Airport_%28New_Terminal%29.jpg',
    mood: 'airport',
    coords: '26.2708° N, 50.6336° E',
    period: 'Modern Gateway',
    desc: 'Prepare for your flight home and look back on your Bahrain journey as you return to the departures hall.',
    simpleTerms: 'What this offers: The final point of your journey. Drop off souvenirs, enjoy duty-free shopping, and relax in the passenger lounge before boarding.',
    insider: 'Be sure to complete your traveler journal reflection on the final page to claim your Dilmun Pearl digital badge.',
    budgetGuide: 'Use the remaining Fils on your bus card or take a budget taxi back to the terminal.',
    premiumGuide: 'Relax in the premium Dilmun Lounge with hot buffet dining, beverages, and quiet rest pods before boarding.',
    budgetCost: '300 Fils (Bus)',
    premiumCost: '18 BHD (Lounge Entry)',
    category: 'culture',
    keepsakeId: 'passport-seal-departure',
    keepsakeName: 'Departure Passport Ink Stamp',
    keepsakeEmoji: '🇧🇭',
    keepsakeDesc: 'A beautiful gold-pressed departure seal signifying the completion of your Bahrain Passage journal.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/Shoe.glb'
  },
  {
    id: 'beit-al-quran',
    name: 'Beit Al Quran',
    arabic: 'بيت القرآن',
    mood: 'culture',
    coords: '26.2345° N, 50.5847° E',
    period: 'Modern Era',
    desc: 'An iconic complex dedicated to Islamic arts and the preservation of ancient Quranic manuscripts. The architecture reflects traditional Islamic design while housing a globally significant collection of religious texts.',
    simpleTerms: 'What this offers: A serene journey through history, calligraphy, and exquisite Islamic art.',
    insider: 'Look for the rare 7th-century manuscript; it is one of the oldest in the region.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Early_Kufic_script_-_Qur%27anic_Manuscript.jpg',
    budgetGuide: 'Free entry for the museum exhibitions.',
    premiumGuide: 'Private guided tour with an expert in calligraphy.',
    budgetCost: 'Free Entry',
    premiumCost: '20 BHD',
    category: 'culture',
    keepsakeId: 'calligraphy-scroll',
    keepsakeName: 'Custom Calligraphy Scroll',
    keepsakeEmoji: '📜',
    keepsakeDesc: 'A personalized piece of Arabic calligraphy crafted by local artisans.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb'
  },
  {
    id: 'saar-temple',
    name: 'Saar Temple',
    arabic: 'معبد سار',
    mood: 'empires',
    coords: '26.1952° N, 50.5058° E',
    period: 'Dilmun Civilization',
    desc: 'This ancient Dilmun-era site is unique for its layout and association with the nearby Saar settlement. It remains one of the best-preserved examples of prehistoric religious architecture in the Gulf.',
    simpleTerms: 'What this offers: A walk through the daily life and spiritual habits of a civilization from 4,000 years ago.',
    insider: 'Visit during the golden hour to see the shadows dance across the ancient stone foundations.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Saar7.jpg',
    budgetGuide: 'Open access site, best visited by rented car.',
    premiumGuide: 'Private archaeological tour with a local historian.',
    budgetCost: 'Free Entry',
    premiumCost: '30 BHD',
    category: 'culture',
    keepsakeId: 'reproduction-pottery-shard',
    keepsakeName: 'Terracotta Replica Shard',
    keepsakeEmoji: '🏺',
    keepsakeDesc: 'A handcrafted clay replica reflecting the style of Dilmun pottery.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/DamagedHelmet.glb'
  },
  {
    id: 'al-khamis-mosque',
    name: 'Al Khamis Mosque',
    arabic: 'مسجد الخميس',
    mood: 'empires',
    coords: '26.2086° N, 50.5528° E',
    period: 'Islamic/Umayyad',
    desc: 'One of the oldest mosque foundations in the region, featuring distinctive twin minarets that have stood for centuries. The site represents the early spread of Islam through Bahrain\'s historic trade routes.',
    simpleTerms: 'What this offers: A glimpse into the architectural heritage of early Islamic worship in the Gulf.',
    insider: 'The twin minarets can be climbed during special heritage events to offer a view of the surrounding palms.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Khamis_Mosque_Minaret.jpg',
    budgetGuide: 'Free to explore the exterior and the visitor center.',
    premiumGuide: 'Private historical tour covering the surrounding burial mounds.',
    budgetCost: 'Free Entry',
    premiumCost: '25 BHD',
    category: 'culture',
    keepsakeId: 'miniature-minaret-statue',
    keepsakeName: 'Minaret Stone Statue',
    keepsakeEmoji: '🕌',
    keepsakeDesc: 'A small carved stone representation of the mosque\'s iconic twin towers.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb'
  },
  {
    id: 'bin-matar-house',
    name: 'Bin Matar House',
    arabic: 'بيت بن مطر',
    mood: 'sea',
    coords: '26.2575° N, 50.6074° E',
    period: 'Pearling Era',
    desc: 'A beautifully restored traditional Bahraini house that serves as a center for art and cultural exhibitions. It reflects the grandeur of the pearling merchants who once dominated the island\'s economy.',
    simpleTerms: 'What this offers: An elegant mix of heritage architecture and contemporary art exhibitions.',
    insider: 'Check their schedule for evening book readings and open-air art discussions.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Free to visit the permanent galleries.',
    premiumGuide: 'Private art curation tour and coffee service.',
    budgetCost: 'Free Entry',
    premiumCost: '15 BHD',
    category: 'culture',
    keepsakeId: 'pearl-merchant-box',
    keepsakeName: 'Wooden Pearl Box',
    keepsakeEmoji: '📦',
    keepsakeDesc: 'A handcrafted wooden box inspired by the storage chests used by pearl merchants.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Box/glTF-Binary/Box.glb'
  },
  {
    id: 'al-jasra-craft-center',
    name: 'Al Jasra Craft Center',
    arabic: 'مركز الجسرة للحرف اليدوية',
    mood: 'culture',
    coords: '26.1732° N, 50.4578° E',
    period: 'Traditional',
    desc: 'A hub where local artisans practice ancient crafts such as weaving, pottery, and wood carving. It serves as a living museum where heritage is kept alive through active participation.',
    simpleTerms: 'What this offers: A chance to watch masters at work and buy authentic, handmade Bahraini souvenirs.',
    insider: 'Ask the weavers about the traditional patterns; each tells a story of the desert or the sea.',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Free to browse; bring cash for purchasing crafts.',
    premiumGuide: 'Full-day workshop experience with a master artisan.',
    budgetCost: 'Free Entry',
    premiumCost: '40 BHD',
    category: 'culture',
    keepsakeId: 'palm-leaf-basket',
    keepsakeName: 'Hand-Woven Palm Basket',
    keepsakeEmoji: '🧺',
    keepsakeDesc: 'A durable, traditionally woven basket made from local date palm leaves.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/Chair.glb'
  },
  {
    id: 'durrat-al-bahrain-coast',
    name: 'Durrat Al Bahrain Coast',
    arabic: 'درة البحرين',
    mood: 'sea',
    coords: '25.8450° N, 50.6010° E',
    period: 'Modern',
    desc: 'A vast, luxurious man-made archipelago at the southern tip of Bahrain. It is the premier destination for high-end coastal living and private maritime leisure.',
    simpleTerms: 'What this offers: Pristine sandy beaches, crystal clear water, and a tranquil escape from the city.',
    insider: 'Rent a private boat to explore the outer coves of the islands for total privacy.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Durrat_Al_Bahrain%2C_Persian_Gulf.JPG',
    budgetGuide: 'Public beach areas are accessible; bring your own gear.',
    premiumGuide: 'Luxury villa rental with private boat access.',
    budgetCost: '5 BHD',
    premiumCost: '250 BHD',
    category: 'coast',
    keepsakeId: 'seashell-trinket',
    keepsakeName: 'Polished Seashell Souvenir',
    keepsakeEmoji: '🐚',
    keepsakeDesc: 'A beautiful seashell found on the pristine shores of the southern islands.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb'
  },
  {
    id: 'royal-camel-farm',
    name: 'Royal Camel Farm',
    arabic: 'مزرعة الجمال الملكية',
    mood: 'desert',
    coords: '26.1368° N, 50.4855° E',
    period: 'Modern',
    desc: 'A private facility belonging to the royal family that houses hundreds of camels. It is a fascinating place to witness these \'ships of the desert\' up close.',
    simpleTerms: 'What this offers: A fun and educational experience for all ages to interact with camels.',
    insider: 'Try to arrive in the late afternoon when the camels are being fed; they are much more active then.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Royal_Camel_Farm_-_Bahrain_1.jpg',
    budgetGuide: 'Free admission, just bring some fresh carrots.',
    premiumGuide: 'Private photo session with a camel handler.',
    budgetCost: 'Free Entry',
    premiumCost: '50 BHD',
    category: 'desert',
    keepsakeId: 'camel-plush',
    keepsakeName: 'Hand-Stitched Camel Toy',
    keepsakeEmoji: '🐪',
    keepsakeDesc: 'A soft, handcrafted camel toy reflecting the desert culture.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Duck/glTF-Binary/Duck.glb'
  },
  {
    id: 'bahrain-international-circuit',
    name: 'Bahrain International Circuit',
    arabic: 'حلبة البحرين الدولية',
    mood: 'lights',
    coords: '26.0325° N, 50.5125° E',
    period: 'Modern',
    desc: 'The home of Formula 1 in the Middle East, this world-class facility hosts the annual Bahrain Grand Prix. It is a marvel of modern motorsport engineering located in the middle of the desert.',
    simpleTerms: 'What this offers: Adrenaline-pumping track experiences, karting, and a high-speed atmosphere.',
    insider: 'Book a track day to drive your own car or a racing kart on the actual Formula 1 circuit.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Bahrain_International_Circuit.jpg',
    budgetGuide: 'Visit the Karting track which is more affordable than the main circuit.',
    premiumGuide: 'VIP Paddock Club pass during the race weekend.',
    budgetCost: '15 BHD',
    premiumCost: '500 BHD',
    category: 'modern',
    keepsakeId: 'racing-flag-keychain',
    keepsakeName: 'Chequered Flag Keychain',
    keepsakeEmoji: '🏁',
    keepsakeDesc: 'A high-quality metallic keychain representing the thrill of the race.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/ToyCar.glb'
  },
  {
    id: 'al-fateh-grand-mosque',
    name: 'Al Fateh Grand Mosque',
    arabic: 'جامع أحمد الفاتح',
    mood: 'lights',
    coords: '26.2238° N, 50.5904° E',
    period: 'Modern',
    desc: 'One of the largest mosques in the world, featuring a massive fiberglass dome and beautiful marble interiors. It is an architectural masterpiece that welcomes visitors of all faiths for guided tours.',
    simpleTerms: 'What this offers: A peaceful environment to admire Islamic architecture and learn about the local faith.',
    insider: 'Women are provided with traditional abayas and scarves; it is a respectful and inclusive experience.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Al_Fateh_outside.jpg',
    budgetGuide: 'Free entrance for all visitors.',
    premiumGuide: 'Private lecture and tour with a knowledgeable guide.',
    budgetCost: 'Free Entry',
    premiumCost: '20 BHD',
    category: 'culture',
    keepsakeId: 'mosque-bookmark',
    keepsakeName: 'Calligraphy Bookmark',
    keepsakeEmoji: '📖',
    keepsakeDesc: 'A bookmark featuring elegant Arabic script, perfect for any reader.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb'
  },
  {
    id: 'manama-reef-walk',
    name: 'Manama Corniche',
    arabic: 'كورنيش المنامة',
    mood: 'sea',
    coords: '26.2410° N, 50.5880° E',
    period: 'Modern',
    desc: 'A scenic waterfront promenade offering stunning views of the Manama skyline and the Gulf. It is the heart of local outdoor life, especially in the cooler evening hours.',
    simpleTerms: 'What this offers: A breezy walk, local street food, and the best views of the city lights.',
    insider: 'Grab a cup of karak tea from a local vendor and sit on the benches to watch the dhows sail past.',
    image: 'https://images.unsplash.com/photo-1568902703625-de2b3044012f?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Free to walk, affordable street snacks.',
    premiumGuide: 'Dinner at a luxury hotel overlooking the promenade.',
    budgetCost: 'Free Entry',
    premiumCost: '60 BHD',
    category: 'coast',
    keepsakeId: 'karak-cup',
    keepsakeName: 'Traditional Karak Cup',
    keepsakeEmoji: '☕',
    keepsakeDesc: 'A small glass cup used to enjoy the classic spiced Bahraini tea.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb'
  },
  {
    id: 'bahrain-world-trade-center',
    name: 'Bahrain World Trade Center',
    arabic: 'مركز البحرين التجاري العالمي',
    mood: 'lights',
    coords: '26.2365° N, 50.5822° E',
    period: 'Modern',
    desc: 'A twin-tower landmark known for its iconic wind turbines integrated into the design. It represents Bahrain’s commitment to sustainable architecture and modern innovation.',
    simpleTerms: 'What this offers: A chance to see cutting-edge green architecture and explore luxury shopping.',
    insider: 'The best photos are taken from the causeway at night when the towers are illuminated.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Manama_Bahrain_World_Trade_Centre_04.jpg',
    budgetGuide: 'Free to view the exterior; shopping is optional.',
    premiumGuide: 'Stay at the attached luxury hotel for a high-rise experience.',
    budgetCost: 'Free Entry',
    premiumCost: '100 BHD',
    category: 'modern',
    keepsakeId: 'turbine-model',
    keepsakeName: 'Wind Turbine Paperweight',
    keepsakeEmoji: '🌬️',
    keepsakeDesc: 'A metallic paperweight modeled after the center\'s famous wind turbines.',
    glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb'
  },
  {
    id: 'muharraq-cultural-center',
    name: 'Shaikh Ebrahim Center',
    arabic: 'مركز الشيخ إبراهيم بن محمد آل خليفة',
    mood: 'culture',
    coords: '26.2550° N, 50.6090° E',
    period: 'Historic/Restoration',
    desc: 'A network of restored traditional houses in Muharraq that serve as cultural venues for music, art, and debate. It is a cornerstone of Bahrain’s efforts to preserve its heritage.',
    simpleTerms: 'What this offers: Intellectual stimulation and a deep dive into Bahraini social history.',
    insider: 'Check their \'Monday Lectures\' program for thought-provoking talks by international speakers.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Most events and exhibitions are free.',
    premiumGuide: 'Private guided tour of the entire restoration project.',
    budgetCost: 'Free Entry',
    premiumCost: '30 BHD',
    category: 'culture',
    keepsakeId: 'heritage-notebook',
    keepsakeName: 'Hand-Bound Journal',
    keepsakeEmoji: '📓',
    keepsakeDesc: 'A notebook bound in traditional fabric, inspired by the center\'s scholars.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BoomBox/glTF-Binary/BoomBox.glb'
  },
  {
    id: 'al-ghous-house',
    name: 'Al Ghous House',
    arabic: 'بيت الغوص',
    mood: 'sea',
    coords: '26.2580° N, 50.6120° E',
    period: 'Pearling Era',
    desc: 'A restored heritage building that showcases the life of pearl divers and the maritime economy of old Bahrain. It is an essential stop for anyone wanting to understand the island\'s connection to the sea.',
    simpleTerms: 'What this offers: A look at the tools, clothing, and lifestyle of the legendary pearl divers.',
    insider: 'Ask the guides about the specific chants used on the boats; they are hauntingly beautiful.',
    image: 'https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Free admission.',
    premiumGuide: 'Private maritime history tour and dhow boat trip.',
    budgetCost: 'Free Entry',
    premiumCost: '50 BHD',
    category: 'culture',
    keepsakeId: 'diver-weight',
    keepsakeName: 'Diver\'s Stone Replica',
    keepsakeEmoji: '🪨',
    keepsakeDesc: 'A stone replica representing the weights used by pearl divers to descend.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BoomBox/glTF-Binary/BoomBox.glb'
  },
  {
    id: 'ad-dair-village',
    name: 'Ad Dair Village',
    arabic: 'قرية الدير',
    mood: 'spice',
    coords: '26.2750° N, 50.6200° E',
    period: 'Traditional',
    desc: 'A quaint, authentic village known for its traditional fishing culture and local charm. It offers a slower pace of life compared to the bustling city center.',
    simpleTerms: 'What this offers: An authentic experience of village life, fresh seafood, and friendly local interactions.',
    insider: 'Visit the local fishermen\'s landing in the early morning to see the fresh catch of the day.',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    budgetGuide: 'Free to explore; local seafood is very affordable.',
    premiumGuide: 'Private fishing trip with a local captain.',
    budgetCost: 'Free Entry',
    premiumCost: '40 BHD',
    category: 'coast',
    keepsakeId: 'dried-fish-pouch',
    keepsakeName: 'Traditional Spice Pouch',
    keepsakeEmoji: '🌶️',
    keepsakeDesc: 'A small bag of local spices commonly used in Bahraini fish recipes.',
    glbUrl: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb'
  }
]

export const categoryImages = {
  fort: '/assets/images/fort.jpg',
  souq: '/assets/images/souq.jpg',
  coast: '/assets/images/coast.jpg',
  modern: '/assets/images/modern.jpg',
  desert: '/assets/images/desert.jpg',
  culture: '/assets/images/culture.jpg',
  default: '/assets/images/fort.jpg'
}

// Fixed Hook: accepts global itinerary spots explicitly to avoid importing useVibe/Context loops entirely
export function useItinerary(selectedMoods = [], tierFilter = 'Wandering', durationFilter = 3, curatedItinerary = null, injectedSpots = []) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (injectedSpots && injectedSpots.length > 0) {
      queueMicrotask(() => {
        setLocations(injectedSpots)
        setLoading(false)
      })
      return
    }

    let active = true
    
    const delay = setTimeout(() => {
      try {
        if (curatedItinerary && curatedItinerary.itinerary && Array.isArray(curatedItinerary.itinerary)) {
          const mapped = curatedItinerary.itinerary
            .map(item => {
              const catalogSpot = spotsCatalog.find(s => s.id === item.id)
              
              if (catalogSpot) {
                return {
                  ...catalogSpot,
                  day: item.day,
                  pathGuide: tierFilter === 'Wandering' ? catalogSpot.budgetGuide : catalogSpot.premiumGuide,
                  pathCost: tierFilter === 'Wandering' ? catalogSpot.budgetCost : catalogSpot.premiumCost
                }
              }

              const cat = item.category ? item.category.toLowerCase() : 'culture'
              const imgUrl = categoryImages[cat] || categoryImages.default

              return {
                id: item.id || `spot-${Math.random().toString(36).substr(2, 9)}`,
                name: item.name || 'Authentic Bahrain Landmark',
                arabic: item.arabic || 'معلم بحريني',
                mood: item.mood || 'empires',
                coords: item.coords || '26.2285° N, 50.5860° E',
                period: item.period || 'Ancient Era',
                desc: item.desc || 'An authentic local spot full of history and heritage waiting to be discovered.',
                simpleTerms: item.simpleTerms || 'What this offers: A gorgeous historical landmark rich in cultural legacy.',
                insider: item.insider || 'Speak to local shopkeepers nearby; they love sharing stories about the ancient Dilmun history of this area.',
                pathGuide: item.pathGuide || 'Walk around the grounds and enjoy the beautiful heritage architecture.',
                pathCost: item.pathCost || 'Free Entry',
                image: imgUrl,
                day: item.day || 1
              }
            })
            .filter(Boolean)

          const sortedCurated = mapped.sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day
            if (a.id === 'airport-arrival') return -1
            if (b.id === 'airport-arrival') return 1
            if (a.id === 'airport-departure') return 1
            if (b.id === 'airport-departure') return -1
            return 0
          })

          if (active) {
            setError(null)
            setLocations(sortedCurated)
            setLoading(false)
          }
          return
        }

        const filtered = spotsCatalog.filter(s => selectedMoods.includes(s.mood) && s.id !== 'airport-arrival' && s.id !== 'airport-departure')
        
        const mapped = filtered.map((item, idx) => {
          const targetDay = (idx % durationFilter) + 1

          return {
            ...item,
            day: targetDay,
            pathGuide: tierFilter === 'Wandering' ? item.budgetGuide : item.premiumGuide,
            pathCost: tierFilter === 'Wandering' ? item.budgetCost : item.premiumCost
          }
        })

        const arrivalSpot = spotsCatalog.find(s => s.id === 'airport-arrival')
        const departureSpot = spotsCatalog.find(s => s.id === 'airport-departure')

        if (arrivalSpot) {
          mapped.push({
            ...arrivalSpot,
            day: 1,
            pathGuide: tierFilter === 'Wandering' ? arrivalSpot.budgetGuide : arrivalSpot.premiumGuide,
            pathCost: tierFilter === 'Wandering' ? arrivalSpot.budgetCost : arrivalSpot.premiumCost
          })
        }

        if (departureSpot) {
          mapped.push({
            ...departureSpot,
            day: durationFilter,
            pathGuide: tierFilter === 'Wandering' ? departureSpot.budgetGuide : departureSpot.premiumGuide,
            pathCost: tierFilter === 'Wandering' ? departureSpot.budgetCost : departureSpot.premiumCost
          })
        }

        const sorted = mapped.sort((a, b) => {
          if (a.day !== b.day) return a.day - b.day
          if (a.id === 'airport-arrival') return -1
          if (b.id === 'airport-arrival') return 1
          if (a.id === 'airport-departure') return 1
          if (b.id === 'airport-departure') return -1
          return 0
        })

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
  }, [
    JSON.stringify(selectedMoods),
    tierFilter,
    durationFilter,
    curatedItinerary ? JSON.stringify(curatedItinerary) : '',
    injectedSpots ? JSON.stringify(injectedSpots) : ''
  ])

  return { locations, loading, error }
}
