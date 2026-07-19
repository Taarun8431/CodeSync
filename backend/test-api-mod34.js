const API_URL = 'http://localhost:5000/api';

// Helper to make API requests easily
async function req(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));
  
  const ok = res.status >= 200 && res.status < 300;
  console.log(`[${method}] ${endpoint} | ${res.status} ${ok ? '✅ OK' : '❌ FAIL'}`);
  if (!ok && data.message) console.log(`   └─ Error: ${data.message}`);
  
  return { status: res.status, ok, data };
}

async function runTests() {
  console.log('--- Starting API Tests (Module 3 & 4) ---');

  // 1. Setup Test Users
  const rand = Math.floor(Math.random() * 100000);
  const user1 = { username: `owner${rand}`, email: `owner${rand}@test.com`, password: 'Password1!' };
  const user2 = { username: `member${rand}`, email: `member${rand}@test.com`, password: 'Password1!' };

  // Register users
  await req('POST', '/auth/register', user1);
  await req('POST', '/auth/register', user2);

  // Login users
  let t1 = (await req('POST', '/auth/login', { email: user1.email, password: user1.password })).data?.data?.accessToken;
  let t2 = (await req('POST', '/auth/login', { email: user2.email, password: user2.password })).data?.data?.accessToken;
  let u2Id = (await req('GET', '/users/profile', null, t2)).data?.data?.user?.id;

  if (!t1 || !t2) return console.log('❌ Failed to login test users. Aborting.');

  // 2. Module 3: Workspaces
  console.log('\n--- Module 3: Workspaces ---');
  let workspaceId = '';
  
  // Create Workspace
  const createWsRes = await req('POST', '/workspaces', { name: 'My Test Workspace', description: 'Test desc' }, t1);
  workspaceId = createWsRes.data?.data?.workspace?.id;

  // Get Workspaces
  await req('GET', '/workspaces', null, t1);

  // Update Workspace
  await req('PATCH', `/workspaces/${workspaceId}`, { name: 'Updated Workspace' }, t1);

  // 3. Module 3: Projects & Members
  console.log('\n--- Module 3: Projects ---');
  let projectId = '';

  // Create Project
  const createProjRes = await req('POST', '/projects', { name: 'Test Project', workspaceId }, t1);
  projectId = createProjRes.data?.data?.project?.id;

  // Add Member
  if (projectId && u2Id) {
    await req('POST', `/projects/${projectId}/members`, { userId: u2Id, role: 'EDITOR' }, t1);
  }

  // Get Projects in Workspace
  await req('GET', `/projects?workspaceId=${workspaceId}`, null, t1);

  if (!projectId) return console.log('❌ Failed to create project. Aborting Module 4 tests.');

  // 4. Module 4: Virtual File System (VFS)
  console.log('\n--- Module 4: VFS ---');
  
  // Create Folder
  const createFolderRes = await req('POST', `/projects/${projectId}/vfs/folders`, { name: 'src' }, t1);
  const folderId = createFolderRes.data?.data?.folder?.id;

  // Create File inside Folder
  const createFileRes = await req('POST', `/projects/${projectId}/vfs/files`, { 
    name: 'index.js', 
    folderId, 
    content: 'console.log("Hello");' 
  }, t1);
  const fileId = createFileRes.data?.data?.file?.id;

  // Read File Content
  if (fileId) {
    await req('GET', `/projects/${projectId}/vfs/files/${fileId}`, null, t1);
    
    // Update File Content (using User 2, who is an EDITOR)
    await req('PUT', `/projects/${projectId}/vfs/files/${fileId}/content`, { content: 'console.log("Updated by Editor");' }, t2);

    // Rename File
    await req('PATCH', `/projects/${projectId}/vfs/files/${fileId}/rename`, { name: 'main.js' }, t1);
  }

  // Get Project Tree
  await req('GET', `/projects/${projectId}/vfs/tree`, null, t1);

  console.log('\n--- API Tests Finished ---');
}

runTests();
