import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userId = 'afcec5a4-d375-4ca9-bec9-a5f9e36dec8a'; // chinedufreedom40@gmail.com
  console.log(`Attempting to delete user ${userId} with full cascade...`);
  
  try {
    await prisma.$transaction(async (tx) => {
      // Nullify referrals
      await tx.users.updateMany({ where: { referred_by: userId }, data: { referred_by: null } });

      // Manual cascade delete
      await tx.investment_profits.deleteMany({ where: { user_id: userId } });
      await tx.transactions.deleteMany({ where: { user_id: userId } });
      await tx.investments.deleteMany({ where: { user_id: userId } });
      await tx.deposits.deleteMany({ where: { user_id: userId } });
      await tx.withdrawals.deleteMany({ where: { user_id: userId } });
      await tx.spin_logs.deleteMany({ where: { user_id: userId } });
      await tx.user_checkins.deleteMany({ where: { user_id: userId } });
      await tx.task_claims.deleteMany({ where: { user_id: userId } });
      await tx.gift_code_claims.deleteMany({ where: { user_id: userId } });
      await tx.referral_commissions.deleteMany({ where: { OR: [{ user_id: userId }, { from_user_id: userId }] } });
      await tx.activity_logs.deleteMany({ where: { user_id: userId } });
      await tx.email_logs.deleteMany({ where: { user_id: userId } });
      await tx.user_spins.deleteMany({ where: { user_id: userId } });
      await tx.password_resets.deleteMany({ where: { user_id: userId } });
      
      // Finally, delete the user
      await tx.users.delete({
        where: { id: userId }
      });
      console.log("Delete transaction simulation succeeded! Rollback to prevent actual data deletion.");
      throw new Error("ROLLBACK");
    });
  } catch (error) {
    if (error.message === "ROLLBACK") {
      console.log("Transaction succeeded (no errors thrown).");
    } else {
      console.error("Prisma error occurred during deletion:");
      console.error(error);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
