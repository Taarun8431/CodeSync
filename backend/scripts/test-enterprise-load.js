const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const WebSocket = require('ws');

const API = 'http://localhost:5000/api';
const WS = 'ws://localhost:5000/api/collaboration';

async function post(endpoint, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
  return (await res.json()).data;
}

async function runEnterpriseStressTest() {
  console.log('🏢 STARTING ENTERPRISE STRESS TEST...');

  // 1. Provision 50 Users
  const users = [];
  console.log('-> Provisioning 50 Users...');
  for (let i = 0; i < 50; i++) {
    const ts = Date.now() + i;
    const email = `ent${ts}@corp.com`;
    await post('/auth/register', { email, username: `ent${ts}`, password: 'Password1!' });
    const login = await post('/auth/login', { email, password: 'Password1!' });
    users.push({ id: login.user.id, token: login.accessToken, email });
  }

  // 2. Create 10 Workspaces & 50 Projects
  const projects = [];
  console.log('-> Building 10 Workspaces and 50 Projects...');
  
  let userIndex = 0;
  for (let w = 0; w < 10; w++) {
    const owner = users[userIndex++];
    const ws = await post('/workspaces', { name: `Corp Workspace ${w}` }, owner.token);
    
    for (let p = 0; p < 5; p++) {
      const proj = await post('/projects', { name: `Project ${w}-${p}`, workspaceId: ws.workspace.id }, owner.token);
      projects.push({ id: proj.project.id, ownerToken: owner.token });
    }
  }

  // 3. Connect 5 WebSockets to each Project (250 simultaneous connections)
  console.log('-> Connecting 250 WebSockets across 50 distinct chat rooms...');
  const activeBots = [];
  let connected = 0;

  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    
    // Connect 5 random users to this project
    for (let u = 0; u < 5; u++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const doc = new Y.Doc();
      const wsProvider = new WebsocketProvider(
        WS, 
        `project-${proj.id}`, 
        doc, 
        { WebSocketPolyfill: WebSocket, params: { token: randomUser.token } }
      );
      
      wsProvider.on('status', event => {
        if (event.status === 'connected') {
          connected++;
          if (connected === 250) {
              console.log(`🔥 ALL 250 ENTERPRISE USERS CONNECTED! Commencing global chat barrage...`);
          }
        }
      });

      const ychat = doc.getArray('chat');
      activeBots.push({ doc, wsProvider, ychat, user: randomUser.email });
    }
  }

  // 4. Simulate active chat
  setInterval(() => {
    if (connected < 250) return; // wait for all
    
    // Pick 20 random users globally to send a chat message this tick
    for(let i=0; i<20; i++) {
        const bot = activeBots[Math.floor(Math.random() * activeBots.length)];
        bot.ychat.push([{
            user: bot.user,
            text: `Hello from bot at ${Date.now()}`,
            timestamp: Date.now()
        }]);
    }
  }, 200); // 20 messages every 200ms globally = 100 chat messages/sec across DB!
}

runEnterpriseStressTest();
