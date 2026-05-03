const fs = require('fs');
const data = fs.readFileSync('/output.html', 'utf8');

// The text is likely inside the RSC payload inside <script>...push([1, "..."])
const matches = data.match(/push\(\[1,"([\s\S]*?)"\]\)/g);
if (matches) {
   matches.forEach((m, i) => {
      // unescape the JSON string payload
      try {
         const str = m.replace(/push\(\[1,"/, '').replace(/"\]\)/, '');
         // unescape literal newlines in the string
         const unescaped = str.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
         if (unescaped.match(/[a-zA-Z]{5,}/)) { // English text
            console.log(`--- Match ${i} ---`);
            console.log(unescaped.substring(0, 500));
         }
      } catch (e) {}
   });
}
