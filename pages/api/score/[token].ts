import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/generateLink';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Invalid token' });
  }

  try {
    const data = verifyToken(token);

    if (!data) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Check for idempotency (if token already used)
    const existing = await prisma.npsScore.findUnique({
      where: { token },
    });

    if (existing) {
      return res.redirect(302, `/thanks?used=true&score=${existing.score}&campaign=${data.c || ''}`);
    }

    // Log the score
    const userAgent = req.headers['user-agent'] || null;
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || null;

    // Hash IP for privacy (GDPR) - simple SHA256 of IP
    const ipHash = ipAddress ? require('crypto').createHash('sha256').update(ipAddress).digest('hex') : null;

    await prisma.npsScore.create({
      data: {
        token,
        teacherEmail: data.t,
        campaignId: data.c,
        score: data.s,
        userAgent,
        ipAddress: ipHash, // Store hashed IP
        meta: data.m || {},
        source: 'email'
      },
    });

    return res.redirect(302, `/thanks?score=${data.s}&campaign=${data.c || ''}&used=false`);
  } catch (error) {
    console.error('Error processing NPS score:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

