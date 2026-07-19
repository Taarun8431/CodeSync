const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting API Tests ---');
  let token = '';

  // 1. Test Health Readiness
  try {
    const res = await fetch(`${API_URL}/health/readiness`);
    const data = await res.json();
    console.log('[GET /health/readiness]', res.status, data.success ? '✅ OK' : '❌ FAIL', data.dependencies);
  } catch (err) {
    console.log('[GET /health/readiness] ❌ Error:', err.message);
  }

  // Generate random suffix to avoid unique constraint errors
  const rand = Math.floor(Math.random() * 100000);
  const username = `testuser${rand}`;
  const email = `testuser${rand}@example.com`;
  const password = `TestPass123!`;

  // 2. Test Register
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    console.log(`[POST /auth/register]`, res.status, data.success ? '✅ OK' : '❌ FAIL', data.message || '');
  } catch (err) {
    console.log('[POST /auth/register] ❌ Error:', err.message);
  }

  // 3. Test Login
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    console.log(`[POST /auth/login]`, res.status, data.success ? '✅ OK' : '❌ FAIL');
    if (data.data?.accessToken) {
      token = data.data.accessToken;
    }
  } catch (err) {
    console.log('[POST /auth/login] ❌ Error:', err.message);
  }

  if (!token) {
    console.log('Skipping protected routes because login failed.');
    return;
  }

  // 4. Test Get Profile
  try {
    const res = await fetch(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(`[GET /users/profile]`, res.status, data.success ? '✅ OK' : '❌ FAIL', 'User:', data.data?.user?.username);
  } catch (err) {
    console.log('[GET /users/profile] ❌ Error:', err.message);
  }

  // 5. Test Update Profile
  try {
    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: `${username}_updated` }),
    });
    const data = await res.json();
    console.log(`[PATCH /users/profile]`, res.status, data.success ? '✅ OK' : '❌ FAIL', 'Updated username:', data.data?.user?.username);
  } catch (err) {
    console.log('[PATCH /users/profile] ❌ Error:', err.message);
  }

  console.log('--- API Tests Finished ---');
}

runTests();
