import crypto from 'crypto';

const SECRET_KEY = process.env.EMAIL_SIGNING_KEY || 'default-secret-key-change-me';
const APP_HOST = process.env.APP_HOST || 'http://localhost:3000';

interface TokenData {
  t: string; // teacherEmail
  c: string; // campaignId
  s: number; // score
  i: string; // uniqueId (uuid)
  ts: number; // timestamp
  m?: any;   // meta
}

export function generateToken(teacherEmail: string, campaignId: string, score: number, meta?: any): string {
  const uniqueId = crypto.randomUUID();
  const timestamp = Date.now();
  
  const data: TokenData = {
    t: teacherEmail,
    c: campaignId,
    s: score,
    i: uniqueId,
    ts: timestamp,
    m: meta
  };

  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export function verifyToken(token: string): TokenData | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payload)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return decoded as TokenData;
  } catch (e) {
    return null;
  }
}

export function generateTrackingLinks(teacherEmail: string, campaignId: string, meta?: any) {
  const links: Record<number, string> = {};
  
  for (let score = 1; score <= 5; score++) {
    const token = generateToken(teacherEmail, campaignId, score, meta);
    links[score] = `${APP_HOST}/api/score/${token}`;
  }
  
  return links;
}

