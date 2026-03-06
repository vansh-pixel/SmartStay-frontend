const https = require('https');

https.get('https://smart-stay-frontend-vanshmamtora17-7220s-projects.vercel.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Extract JS chunk URLs
    const matches = data.match(/_next\/static\/chunks\/[a-zA-Z0-9-]+\.js/g);
    if (!matches) {
       console.log("No chunks found");
       return;
    }
    const uniqueChunks = [...new Set(matches)];
    console.log("Found chunks:", uniqueChunks.length);
    
    // Download each chunk and check for API urls
    for (const chunk of uniqueChunks) {
      https.get('https://smart-stay-frontend-vanshmamtora17-7220s-projects.vercel.app/' + chunk, (chunkRes) => {
        let chunkData = '';
        chunkRes.on('data', c => chunkData += c);
        chunkRes.on('end', () => {
          if (chunkData.includes('http://localhost:5000')) {
             console.log(`[!] Found localhost fallback in ${chunk}`);
          }
          if (chunkData.includes('onrender.com') || chunkData.includes('smart-stay-backend')) {
             console.log(`[+] Found custom backend url in ${chunk}`);
             const urlMatches = chunkData.match(/https?:\/\/[a-zA-Z0-9-.]+(onrender\.com|smart-stay-backend)[a-zA-Z0-9-./]*/g);
             if (urlMatches) console.log(urlMatches);
          }
        });
      });
    }
  });
});
