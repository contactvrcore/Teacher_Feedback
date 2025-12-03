import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

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

  try {
    const totalCount = await prisma.npsScore.count();
    
    // Aggregation by campaign
    const campaignStats = await prisma.npsScore.groupBy({
      by: ['campaignId'],
      _count: {
        score: true,
      },
      _avg: {
        score: true,
      },
    });

    // Score distribution
    const scoreDistribution = await prisma.npsScore.groupBy({
      by: ['score'],
      _count: {
        score: true,
      },
      orderBy: {
        score: 'asc',
      },
    });

    const recent = await prisma.npsScore.findMany({
      take: 20,
      orderBy: {
        clickedAt: 'desc',
      },
      select: {
        id: true,
        score: true,
        campaignId: true,
        clickedAt: true,
        source: true,
      }
    });

    return res.status(200).json({
      total: totalCount,
      byCampaign: campaignStats.map(s => ({
        campaign: s.campaignId || 'unknown',
        count: s._count.score,
        average: s._avg.score
      })),
      distribution: scoreDistribution.map(s => ({
        score: s.score,
        count: s._count.score
      })),
      recent
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

