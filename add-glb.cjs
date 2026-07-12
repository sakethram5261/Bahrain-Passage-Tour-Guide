const fs = require('fs');

const path = 'src/hooks/useItinerary.js';
let content = fs.readFileSync(path, 'utf-8');

// Use a regular expression to find keepsakeDesc and append glbUrl
content = content.replace(/(keepsakeDesc:\s*'.*?')(\n|\r)/g, "$1,\n    glbUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'$2");

fs.writeFileSync(path, content, 'utf-8');
console.log('Added glbUrl to keepsakes');
