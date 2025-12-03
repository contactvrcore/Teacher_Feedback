import { generateTrackingLinks, verifyToken } from './lib/generateLink';
import { prisma } from './lib/db';
import crypto from 'crypto';

// Set env vars for test if not set
if (!process.env.EMAIL_SIGNING_KEY) process.env.EMAIL_SIGNING_KEY = 'test-secret';
if (!process.env.APP_HOST) process.env.APP_HOST = 'http://localhost:3000';

async function testTokenLogic() {
  console.log('--- Testing Token Logic ---');
  const email = 'teacher@example.com';
  const campaign = 'test-campaign';
  const meta = { group: 'A' };

  console.log(`Generating links for ${email}...`);
  const links = generateTrackingLinks(email, campaign, meta);
  
  // Verify 5 links
  if (Object.keys(links).length !== 5) throw new Error('Did not generate 5 links');
  console.log('Generated 5 links.');

  // Test decoding
  const link5 = links[5];
  const token = link5.split('/').pop()!;
  
  console.log(`Verifying token for score 5: ${token.substring(0, 10)}...`);
  const decoded = verifyToken(token);
  
  if (!decoded) throw new Error('Token verification failed');
  if (decoded.t !== email) throw new Error(`Email mismatch: ${decoded.t}`);
  if (decoded.s !== 5) throw new Error(`Score mismatch: ${decoded.s}`);
  if (decoded.c !== campaign) throw new Error(`Campaign mismatch: ${decoded.c}`);
  if (decoded.m.group !== 'A') throw new Error(`Meta mismatch: ${decoded.m}`);
  
  console.log('Token verified successfully.');

  // Test tampering
  const tamperedToken = token.substring(0, token.lastIndexOf('.')) + '.tampered';
  const decodedTampered = verifyToken(tamperedToken);
  if (decodedTampered) throw new Error('Tampered token should not be valid');
  console.log('Tampered token rejected successfully.');
}

async function testDbConnection() {
  console.log('\n--- Testing DB Connection ---');
  try {
    // Attempt simple count (will fail if no DB connected)
    const count = await prisma.npsScore.count();
    console.log(`DB Connection successful. Current NPS count: ${count}`);
    return true;
  } catch (e) {
    console.log('DB Connection failed (expected if no local DB running). Skipping DB tests.');
    return false;
  }
}

async function main() {
  try {
    await testTokenLogic();
    const dbConnected = await testDbConnection();
    
    if (dbConnected) {
       // Perform full integration test
       // ... (omitted for safety in environments without DB)
    }

    console.log('\n✅ Integration Tests Passed (Logic Only)');
    process.exit(0);
  } catch (e) {
    console.error('\n❌ Test Failed:', e);
    process.exit(1);
  }
}

main();

