const fs = require('fs');

const raw = fs.readFileSync('/transcript.txt', 'utf8');

// replace lines starting with "참석자 X / XX:XX" with an empty string or split/filter
const lines = raw.split('\n');
const cleanLines = lines.filter(l => {
  return !(l.startsWith('참석자') && l.includes('/'));
}).filter(l => l.trim() !== '');

const cleanedTranscript = cleanLines.join(' ');

const manifest = {
  "units": [
    {
      "id": "Unit 1",
      "tracks": [
        {
          "id": "Actual Test 1",
          "duration": "45:50",
          "file": "audio/unit-1/1.mp3",
          "transcript": cleanedTranscript
        }
      ]
    },
    {
      "id": "Unit 2",
      "tracks": [
        {
          "id": "Track 01",
          "duration": "04:12",
          "file": "audio/unit-2/track01.mp3",
          "transcript": "This is Unit 2, track 01."
        }
      ]
    },
    {
      "id": "Unit 3",
      "tracks": [
        {
          "id": "Track 01",
          "duration": "01:50",
          "file": "audio/unit-3/track01.mp3",
          "transcript": "Welcome to Unit 3."
        }
      ]
    }
  ]
};

// Also let's keep one original for testing if needed
// Or let's just make Track 1 the massive one, and Track 2 standard test.
manifest.units[0].tracks.push({
   "id": "Track 02",
   "duration": "02:30",
   "file": "audio/unit-1/track02.mp3",
   "transcript": ""
});

fs.writeFileSync('/app/applet/public/audio/manifest.json', JSON.stringify(manifest, null, 2));
console.log('updated manifest.json');
