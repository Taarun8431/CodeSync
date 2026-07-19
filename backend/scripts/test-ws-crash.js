const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const WebSocket = require('ws');

// 1. Get a JWT Token
async function getToken() {
  const ts = Date.now();
  const email = `bot${ts}@test.com`;
  const username = `bot${ts}`;
  const password = 'Password1!';
  
  // Register
  const reg = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password })
  });
  if (!reg.ok) {
     console.log('Registration failed:', await reg.json());
  }
  
  // Register
  await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username: email, password })
  });

  // Login
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return data.data.accessToken;
}

const CONCURRENT_USERS = 500; // Increase this to 500, 1000, 5000 until crash!
const DOC_ID = 'stress-test-doc-id';

async function startStressTest() {
  console.log(`🤖 Acquiring JWT Token...`);
  const token = await getToken();
  if (!token) return console.log('❌ Failed to get token. Ensure server is running.');

  console.log(`🚀 Unleashing ${CONCURRENT_USERS} WebSocket Bots on document: ${DOC_ID}`);
  
  const bots = [];
  let connected = 0;

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const doc = new Y.Doc();
    const wsProvider = new WebsocketProvider(
      'ws://localhost:5000/api/collaboration', 
      DOC_ID, 
      doc, 
      { WebSocketPolyfill: WebSocket, params: { token } }
    );
    
    wsProvider.on('status', event => {
      if (event.status === 'connected') {
        connected++;
        if (connected === CONCURRENT_USERS) {
            console.log(`🔥 ALL ${CONCURRENT_USERS} BOTS CONNECTED! Commencing carpet bombing...`);
        }
      }
    });

    const ytext = doc.getText('monaco');
    bots.push({ doc, wsProvider, ytext });
  }

  // 3. Make them type randomly
  setInterval(() => {
    if (connected < CONCURRENT_USERS) return; // wait for all to connect

    // Pick 10 random bots to type at this exact millisecond
    for(let i=0; i<10; i++) {
        const bot = bots[Math.floor(Math.random() * bots.length)];
        // Insert a random character
        bot.ytext.insert(0, String.fromCharCode(97 + Math.floor(Math.random() * 26)));
    }
  }, 100); // 10 typing events every 100ms (100 keystrokes a second)
}

startStressTest();
