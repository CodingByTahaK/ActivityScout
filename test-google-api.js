// Test script to verify Google Places API
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read API key from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const API_KEY = envContent.match(/GOOGLE_PLACES_API_KEY=(.+)/)?.[1]?.trim();

if (!API_KEY) {
  console.error('❌ GOOGLE_PLACES_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('🔑 API Key found:', API_KEY.substring(0, 20) + '...');
console.log('');

// Test 1: Find Place from Text (the method we're using in the app)
const testQuery = 'Rogers Centre Toronto';
const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(testQuery)}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total&key=${API_KEY}`;

console.log('📍 Testing Find Place API with query:', testQuery);
console.log('');

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('');

    if (res.statusCode === 403) {
      console.error('❌ Error 403: Forbidden');
      console.error('');
      console.error('This means the API is not enabled or your key lacks permissions.');
      console.error('');
      console.error('To fix this:');
      console.error('1. Go to: https://console.cloud.google.com/apis/library');
      console.error('2. Search for "Places API" (NOT "Places API New")');
      console.error('3. Click "Enable"');
      console.error('4. Check your API key restrictions at:');
      console.error('   https://console.cloud.google.com/apis/credentials');
      console.error('');
      console.log('Response body:', data);
    } else if (res.statusCode === 200) {
      const result = JSON.parse(data);
      console.log('✅ API is working!');
      console.log('');
      console.log('Status:', result.status);

      if (result.status === 'OK' && result.candidates && result.candidates.length > 0) {
        const place = result.candidates[0];
        console.log('');
        console.log('📊 Result:');
        console.log('  Name:', place.name);
        console.log('  Place ID:', place.place_id);
        console.log('  Rating:', place.rating || 'N/A');
        console.log('  Reviews:', place.user_ratings_total || 'N/A');
        console.log('');
        console.log('✨ Google Places API is working correctly!');
      } else if (result.status === 'REQUEST_DENIED') {
        console.log('');
        console.error('❌ REQUEST_DENIED:', result.error_message);
        console.log('');
        console.log('🔧 How to fix:');
        console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
        console.log('2. Click on your API key');
        console.log('3. Under "Application restrictions":');
        console.log('   - Change from "HTTP referrers (web sites)" to "None"');
        console.log('   - OR use "IP addresses" for server-side restrictions');
        console.log('4. Under "API restrictions":');
        console.log('   - Make sure "Places API" is enabled');
        console.log('5. Click "Save"');
        console.log('');
      } else {
        console.log('Response:', result);
      }
    } else {
      console.error('❌ Unexpected status code:', res.statusCode);
      console.log('Response:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Request error:', err.message);
});
