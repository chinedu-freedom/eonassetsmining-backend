import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findUnique({
    where: { email: 'chinedufreedom10@gmail.com' }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const txs = await prisma.transactions.findMany({
    where: { user_id: user.id }
  });
  
  let spin = 0;
  let treasure = 0;
  let checkin = 0;
  let tasks = 0;
  
  for (const t of txs) {
    const desc = (t.description || '').toLowerCase();
    const type = (t.type || '').toLowerCase();
    
    if (type.includes('spin') || desc.includes('spin')) spin += Number(t.amount);
    if (type.includes('gift') || desc.includes('gift') || type.includes('treasure') || desc.includes('treasure')) treasure += Number(t.amount);
    if (type.includes('checkin') || desc.includes('checkin') || type.includes('check-in') || desc.includes('check-in')) checkin += Number(t.amount);
    if (type.includes('task') || desc.includes('task')) tasks += Number(t.amount);
  }
  
  console.log('--- User Earnings Breakdown ---');
  console.log('Spin Wheel:', spin);
  console.log('Treasure/Gift Codes:', treasure);
  console.log('Daily Check-in:', checkin);
  console.log('Tasks:', tasks);
  
  const grouped = txs.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + Number(t.amount);
    return acc;
  }, {});
  console.log('\n--- All Transaction Types ---');
  console.log(grouped);
}
main().finally(() => prisma.$disconnect());
