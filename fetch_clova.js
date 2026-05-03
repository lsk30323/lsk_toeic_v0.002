const https = require('https');

https.get('https://clovanote.naver.com/api/v1/share/jsTB3DqgCduAqsHsFeLenPS', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('v1/share:', data.substring(0, 500)));
});
https.get('https://clovanote.naver.com/api/v2/share/jsTB3DqgCduAqsHsFeLenPS', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('v2/share:', data.substring(0, 500)));
});
https.get('https://clovanote.naver.com/api/share/jsTB3DqgCduAqsHsFeLenPS', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('api/share:', data.substring(0, 500)));
});
