import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function logActivity(userId, action, req, details = null) {
  try {
    const ip_address = (req.headers['x-forwarded-for'] 
      ? req.headers['x-forwarded-for'].split(',')[0].trim() 
      : req.socket.remoteAddress || req.ip) || 'Unknown';
    const user_agent = req.headers['user-agent'] || 'Unknown';

    await prisma.activity_logs.create({
      data: {
        user_id: userId,
        action,
        ip_address,
        user_agent,
        details: details ? JSON.parse(JSON.stringify(details)) : null
      }
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
