const fs = require('fs');
const path = require('path');

function findMp3(dir) {
  try {
     const files = fs.readdirSync(dir);
     for (const file of files) {
       if (file === 'node_modules' || file === '.git') continue;
       const fullPath = path.join(dir, file);
       const stat = fs.statSync(fullPath);
       if (stat.isDirectory()) {
          findMp3(fullPath);
       } else if (file.endsWith('.mp3')) {
          console.log(fullPath);
       }
     }
  } catch (e) {}
}

findMp3('.');
