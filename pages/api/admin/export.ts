import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import Papa from 'papaparse';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const apiKey = req.headers['x-admin-api-key'] || req.query.key;

  if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { campaignId } = req.query;

  try {
    const where = campaignId && typeof campaignId === 'string' 
      ? { campaignId } 
      : {};

    const scores = await prisma.npsScore.findMany({
      where,
      orderBy: { clickedAt: 'desc' },
    });

    const csvData = scores.map(s => ({
      id: s.id,
      email: s.teacherEmail, // Note: In production, consider masking PII if exporting for non-admin
      score: s.score,
      campaign: s.campaignId,
      timestamp: s.clickedAt.toISOString(),
      source: s.source,
      ip_hash: s.ipAddress
    }));

    const csv = Papa.unparse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=nps-export-${new Date().toISOString().split('T')[0]}.csv`);
    return res.status(200).send(csv);

  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

