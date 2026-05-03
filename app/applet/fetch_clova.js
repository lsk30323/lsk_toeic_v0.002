const https = require('https');

https.get('https://clovanote.naver.com/api/v1/shares/jsTB3DqgCduAqsHsFeLenPS', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('v1:', data.substring(0, 500)));
});

https.get('https://clovanote.naver.com/api/v2/shares/jsTB3DqgCduAqsHsFeLenPS', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('v2:', data.substring(0, 500)));
});
