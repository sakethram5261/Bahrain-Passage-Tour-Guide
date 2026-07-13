const fs = require('fs');

const file = 'src/hooks/useItinerary.js';
let content = fs.readFileSync(file, 'utf8');

const glbMap = {
  'Dilmun Terracotta Bull Stamp': 'https://modelviewer.dev/shared-assets/models/DamagedHelmet.glb',
  'Saffron Karak Dallah': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
  'Natural Pink Basra Pearl': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb',
  'Bohemian Neon Glass Tile': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Box/glTF-Binary/Box.glb',
  'Vial of Ephemeral White Sand': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
  'Mystical Green Desert Leaf': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
  'Engraved Haji Wooden Token': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Duck/glTF-Binary/Duck.glb',
  'Terracotta Red Clay Amulet': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BrainStem/glTF-Binary/BrainStem.glb',
  'Arad Moat Iron Lock-Key': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/GearboxAssy/glTF-Binary/GearboxAssy.glb',
  'Gold-Foil Dilmun Crown Leaf': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Corset/glTF-Binary/Corset.glb',
  'Turquoise Coral Shell': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb',
  'Woven Silver Palm Fan': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf',
  'Wood-Carved Riffa Dagger': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Fox/glTF-Binary/Fox.glb',
  'Dilmun Sacred Stone Chalice': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
  'Woven Al Jasra Palm Box': 'https://modelviewer.dev/shared-assets/models/Chair.glb',
  'Pearl Merchant Brass Scale': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Buggy/glTF-Binary/Buggy.glb',
  'Miniature Brass Dallah Pot': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
  'Carved Oryx Gazelle Ring': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BoomBox/glTF-Binary/BoomBox.glb',
  'Arrival Passport Ink Stamp': 'https://modelviewer.dev/shared-assets/models/Shoe.glb',
  'Departure Passport Ink Stamp': 'https://modelviewer.dev/shared-assets/models/Shoe.glb',
  'Custom Calligraphy Scroll': 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
  'Terracotta Replica Shard': 'https://modelviewer.dev/shared-assets/models/DamagedHelmet.glb',
  'Minaret Stone Statue': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
  'Wooden Pearl Box': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Box/glTF-Binary/Box.glb',
  'Hand-Woven Palm Basket': 'https://modelviewer.dev/shared-assets/models/Chair.glb',
  'Polished Seashell Souvenir': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb',
  'Hand-Stitched Camel Toy': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Duck/glTF-Binary/Duck.glb',
  'Chequered Flag Keychain': 'https://modelviewer.dev/shared-assets/models/ToyCar.glb',
  'Calligraphy Bookmark': 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
  'Traditional Karak Cup': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
  'Wind Turbine Paperweight': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
  'Hand-Bound Journal': 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BoomBox/glTF-Binary/BoomBox.glb',
  "Diver's Stone Replica": 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb',
  'Traditional Spice Pouch': 'https://modelviewer.dev/shared-assets/models/shishkebab.glb'
};

const lines = content.split('\n');
let currentName = null;

for (let i = 0; i < lines.length; i++) {
  const nameMatch = lines[i].match(/keepsakeName:\s*'(.*?)'/);
  if (nameMatch) {
    currentName = nameMatch[1];
  }

  if (lines[i].includes('glbUrl:')) {
    if (currentName && glbMap[currentName]) {
      lines[i] = lines[i].replace(/glbUrl:\s*'.*?'/, `glbUrl: '${glbMap[currentName]}'`);
    } else {
      // Fallback if not matched
      const keys = Object.keys(glbMap);
      const randomUrl = glbMap[keys[Math.floor(Math.random() * keys.length)]];
      lines[i] = lines[i].replace(/glbUrl:\s*'.*?'/, `glbUrl: '${randomUrl}'`);
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Successfully updated GLB URLs');
