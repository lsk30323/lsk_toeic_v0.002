const https = require('https');
const fs = require('fs');

https.get('https://clovanote.naver.com/s/jsTB3DqgCduAqsHsFeLenPS', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
     fs.writeFileSync('/output.html', data);
     console.log('wrote output.html');
  });
});
