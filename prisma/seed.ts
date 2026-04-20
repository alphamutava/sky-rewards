import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

// Parse the prisma+postgres URL to extract the actual postgres connection string
const prismaUrl = process.env.DATABASE_URL || ''
const apiKeyMatch = prismaUrl.match(/api_key=([^&]+)/)
const connectionString = apiKeyMatch 
  ? Buffer.from(apiKeyMatch[1], 'base64').toString('utf-8').match(/"databaseUrl":"([^"]+)"/)?.[1] || 'postgresql://postgres:postgres@localhost:51214/template1?sslmode=disable'
  : 'postgresql://postgres:postgres@localhost:51214/template1?sslmode=disable'

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // System Settings
  await prisma.systemSetting.upsert({
    where: { key: 'PLATFORM_COMMISSION_PERCENT' },
    update: {},
    create: {
      key: 'PLATFORM_COMMISSION_PERCENT',
      value: '15',
      description: 'Platform commission percentage on campaigns',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'MIN_WITHDRAWAL_KES' },
    update: {},
    create: {
      key: 'MIN_WITHDRAWAL_KES',
      value: '100',
      description: 'Minimum withdrawal amount in KES',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'VIEW_REWARD_KES' },
    update: {},
    create: {
      key: 'VIEW_REWARD_KES',
      value: '0.50',
      description: 'Reward per view in KES',
    },
  })

  // Password hashes
  const adminPw = await bcrypt.hash('Admin@123!', 12)
  const creatorPw = await bcrypt.hash('Creator@123!', 12)
  const advertiserPw = await bcrypt.hash('Advertiser@123!', 12)
  const viewerPw = await bcrypt.hash('Viewer@123!', 12)

  // Super Admin
  await prisma.user.upsert({
    where: { phone: '254700000001' },
    update: {},
    create: {
      phone: '254700000001',
      email: 'admin@skykenya.co.ke',
      passwordHash: adminPw,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      phoneVerified: true,
      walletBalance: 0,
    },
  })

  // Admin
  await prisma.user.upsert({
    where: { phone: '254700000002' },
    update: {},
    create: {
      phone: '254700000002',
      email: 'support@skykenya.co.ke',
      passwordHash: adminPw,
      firstName: 'Support',
      lastName: 'Admin',
      displayName: 'Support Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      phoneVerified: true,
      walletBalance: 0,
    },
  })

  // Demo Creator
  const creator = await prisma.user.upsert({
    where: { phone: '254712345678' },
    update: {},
    create: {
      phone: '254712345678',
      email: 'creator@demo.co.ke',
      passwordHash: creatorPw,
      firstName: 'Jane',
      lastName: 'Wanjiku',
      displayName: 'Jane Wanjiku',
      bio: 'Kenyan content creator specializing in comedy and lifestyle content.',
      role: 'CREATOR',
      status: 'ACTIVE',
      phoneVerified: true,
      walletBalance: 2500,
      totalEarned: 45000,
      county: 'Nairobi',
      city: 'Nairobi',
      totalSubmissions: 15,
      totalApproved: 12,
      averageRating: 4.5,
    },
  })

  // Demo Advertiser
  const advertiser = await prisma.user.upsert({
    where: { phone: '254722000000' },
    update: {},
    create: {
      phone: '254722000000',
      email: 'brand@demo.co.ke',
      passwordHash: advertiserPw,
      firstName: 'Brian',
      lastName: 'Omondi',
      displayName: 'Safaricom Marketing',
      bio: 'Marketing team at Safaricom PLC',
      role: 'ADVERTISER',
      status: 'ACTIVE',
      phoneVerified: true,
      walletBalance: 500000,
      county: 'Nairobi',
    },
  })

  // Demo Viewer
  await prisma.user.upsert({
    where: { phone: '254711111111' },
    update: {},
    create: {
      phone: '254711111111',
      email: 'viewer@demo.co.ke',
      passwordHash: viewerPw,
      firstName: 'John',
      lastName: 'Kamau',
      displayName: 'John Kamau',
      role: 'VIEWER',
      status: 'ACTIVE',
      phoneVerified: true,
      walletBalance: 150,
      totalEarned: 350,
      totalViews: 700,
      county: 'Nairobi',
    },
  })

  // Create demo campaign
  await prisma.campaign.upsert({
    where: { slug: 'safaricom-mpesa-challenge' },
    update: {},
    create: {
      advertiserId: advertiser.id,
      title: 'M-Pesa Challenge',
      slug: 'safaricom-mpesa-challenge',
      description: 'Create exciting content about M-Pesa!',
      brief: 'Show how you use M-Pesa in your daily life. Be creative and authentic.',
      type: 'VIDEO',
      status: 'ACTIVE',
      totalBudget: 200000,
      remainingBudget: 180000,
      platformFee: 30000,
      rewardPerView: 0.5,
      creatorReward: 2000,
      maxSubmissions: 100,
      targetCounty: 'Nairobi',
      tags: ['fintech', 'mpesa', 'safaricom'],
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalSubmissions: 15,
      approvedSubmissions: 10,
      totalViews: 50000,
      totalSpent: 20000,
    },
  })

  console.log('✅ MVP V2 Seeding complete!')
  console.log('\n� Demo accounts (login with phone):')
  console.log('   Super Admin: 254700000001 / Admin@123!')
  console.log('   Admin:       254700000002 / Admin@123!')
  console.log('   Creator:     254712345678 / Creator@123!')
  console.log('   Advertiser:  254722000000 / Advertiser@123!')
  console.log('   Viewer:      254711111111 / Viewer@123!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
