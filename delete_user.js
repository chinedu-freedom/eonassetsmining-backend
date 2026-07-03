import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Looking up user john@example.com...");
  
  try {
    const user = await prisma.users.findUnique({
      where: { email: 'john@example.com' }
    });
    
    if (!user) {
      console.log("User not found!");
      return;
    }
    
    console.log(`Found user ${user.id}. Deleting related records...`);
    
    // Attempt to delete related records. Note: Wrap in try-catch in case table doesn't exist or relation isn't there
    const tables = ['user_checkins', 'transactions', 'deposits', 'withdrawals', 'investments', 'activity_logs', 'notifications', 'referrals', 'gift_bonus_claims', 'spin_history'];
    
    for (const table of tables) {
      if (prisma[table]) {
        try {
          let whereClause = { user_id: user.id };
          if (table === 'referrals') {
            await prisma.referrals.deleteMany({ where: { OR: [{ referrer_id: user.id }, { referred_id: user.id }] } }).catch(() => {});
            continue;
          }
          await prisma[table].deleteMany({ where: whereClause });
          console.log(`Deleted records from ${table}`);
        } catch(e) {
          console.log(`Could not delete from ${table}: ${e.message.substring(0, 50)}`);
        }
      }
    }
    
    const deletedUser = await prisma.users.delete({
      where: { id: user.id }
    });
    
    console.log(`Successfully deleted user: ${deletedUser.email}`);
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
