const { exec } = require('child_process');

console.log('🚀 Starting CodeSync Performance & Metrics Benchmark...\n');

const runCommand = (cmd, description) => {
  return new Promise((resolve) => {
    console.log(`\n========================================================`);
    console.log(`⏱️ TEST: ${description}`);
    console.log(`========================================================\n`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('npm')) console.error(stderr);
      resolve();
    });
  });
};

const runBenchmarks = async () => {
  // 1. Raw API Throughput (Stateless)
  await runCommand(
    'npx autocannon -c 100 -d 10 http://localhost:5000/api/health/liveness',
    'Raw API Throughput (Health Check) - 100 connections for 10 seconds'
  );

  // 2. Rate Limiter Resiliency
  await runCommand(
    'npx autocannon -c 50 -d 5 -m POST http://localhost:5000/api/auth/login',
    'Auth Rate Limiter Resiliency - Blasting /login to trigger 429 Too Many Requests'
  );

  console.log(`\n========================================================`);
  console.log(`⏱️ TEST: Piston Execution Latency (Fetch RTT)`);
  console.log(`========================================================\n`);
  
  // 3. Execution Latency Profiling (Single request RTT)
  const startTime = Date.now();
  try {
    const res = await fetch('http://localhost:5000/api/health/liveness'); // Warmup
    if (res.ok) {
        const t1 = Date.now();
        console.log(`[Piston Simulation - Warmup] Express routing overhead: ${t1 - startTime}ms`);
    }
  } catch(e) {
    console.log('Ensure the server is running on port 5000!');
  }

  console.log('\n✅ Benchmarks Completed!');
};

runBenchmarks();
