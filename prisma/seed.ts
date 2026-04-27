import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding Sky Kenya with sample campaign...\n");

  // 1. Create a brand account
  const brandPassword = await bcrypt.hash("Brand1234!", 12);
  const brand = await prisma.user.upsert({
    where: { email: "brand@skykenya.co.ke" },
    update: {},
    create: {
      email: "brand@skykenya.co.ke",
      passwordHash: brandPassword,
      role: "ADVERTISER",
      status: "ACTIVE",
      displayName: "Safaricom Digital",
      firstName: "Safaricom",
      lastName: "Digital",
      walletBalance: 500000,
    },
  });
  console.log(`✅ Brand account: brand@skykenya.co.ke (password: Brand1234!)`);

  // 2. Create sample campaigns
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);
  const in60Days = new Date(now.getTime() + 60 * 86400000);

  const campaigns = [
    {
      title: "M-Pesa Go Global Challenge",
      slug: `mpesa-go-global-challenge-${Date.now().toString(36)}`,
      description: "Create engaging short-form content showcasing how M-Pesa connects Kenyans to the global economy. Show real stories of people using M-Pesa for international transfers, online shopping, and cross-border payments.",
      brief: "We're looking for authentic, creative content that tells the story of M-Pesa's global reach.\n\nWhat we want:\n- Short-form video (30-60 seconds) for TikTok, Instagram Reels, or YouTube Shorts\n- Real stories — interview a family member who receives money from abroad, show a small business owner who sells online internationally\n- Use the hashtag #MPesaGoGlobal\n- Mention Safaricom or M-Pesa naturally in your content\n\nStyle:\n- Authentic, not scripted\n- Good lighting and clear audio\n- Vertical format (9:16)\n- Can be in English, Swahili, or Sheng",
      guidelines: "Do NOT make claims about interest rates or fees. Do NOT show competitor apps. Keep it positive and authentic. Your content must be original — no reposts.",
      type: "VIDEO",
      totalBudget: 100000,
      remainingBudget: 85000,
      platformFee: 15000,
      rewardPerView: 0.5,
      creatorReward: 500,
      maxSubmissions: 200,
      maxViewsPerSubmission: 50000,
      startDate: now,
      endDate: in60Days,
      status: "ACTIVE",
      tags: ["fintech", "mobile-money", "lifestyle", "tiktok"],
      targetCounty: "Nairobi",
      advertiserId: brand.id,
    },
    {
      title: "Kenya Hustler Stories",
      slug: `kenya-hustler-stories-${Date.now().toString(36)}`,
      description: "Document the hustle! Share short clips of everyday Kenyan entrepreneurs — from mama mboga to tech startups. Celebrate the grind and inspire the next generation.",
      brief: "Tell the stories of Kenya's hustlers and entrepreneurs.\n\nContent format:\n- Video clips (30-90 seconds)\n- Post on TikTok, YouTube Shorts, or Instagram Reels\n- Interview real people: market vendors, boda boda riders going digital, young tech founders\n- Use hashtag #KenyaHustlerStories\n\nWhat makes great content:\n- Real people, real stories\n- Show the transformation or daily grind\n- Good energy and authentic vibes\n- Can be documentary-style or vlog-style",
      guidelines: "Content must feature real Kenyan entrepreneurs. No staged or fake stories. Keep it family-friendly.",
      type: "VIDEO",
      totalBudget: 50000,
      remainingBudget: 42500,
      platformFee: 7500,
      rewardPerView: 0.3,
      creatorReward: 300,
      maxSubmissions: 100,
      maxViewsPerSubmission: 30000,
      startDate: now,
      endDate: in30Days,
      status: "ACTIVE",
      tags: ["entrepreneurship", "hustle", "kenya", "inspiration"],
      advertiserId: brand.id,
    },
    {
      title: "Street Food Adventures Nairobi",
      slug: `street-food-adventures-${Date.now().toString(36)}`,
      description: "Take us on a food tour! Create mouth-watering content showcasing Nairobi's best street food — from smokie pasua to nyama choma spots. Make us hungry!",
      brief: "Show off Nairobi's incredible street food scene.\n\nContent requirements:\n- Short video (30-60 seconds) or photo carousel\n- Feature specific food spots, vendors, or dishes\n- Include the location (area/street)\n- Show the food being made AND the final product\n- Use hashtag #NairobiStreetFood\n\nBonus points for:\n- Hidden gems that tourists wouldn't know about\n- Showing the cooking process\n- Getting the vendor's story\n- Price checks (show how affordable street food is)",
      guidelines: "Must be filmed in Nairobi. Show hygiene positively — don't shame vendors. Include at least one price mention.",
      type: "MIXED",
      totalBudget: 30000,
      remainingBudget: 25500,
      platformFee: 4500,
      rewardPerView: 0.4,
      creatorReward: 400,
      maxSubmissions: 50,
      maxViewsPerSubmission: 20000,
      startDate: now,
      endDate: in30Days,
      status: "ACTIVE",
      tags: ["food", "nairobi", "street-food", "lifestyle", "culture"],
      targetCounty: "Nairobi",
      advertiserId: brand.id,
    },
  ];

  for (const campaignData of campaigns) {
    await prisma.campaign.upsert({
      where: { slug: campaignData.slug },
      update: {},
      create: campaignData,
    });
    console.log(`✅ Campaign: ${campaignData.title}`);
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Test accounts:");
  console.log("   Brand:   brand@skykenya.co.ke / Brand1234!");
  console.log("   Creator: testuser@example.com / TestPass123! (if registered)");
  console.log("\n💡 Flow: Log in as brand → Brand Campaigns → see 3 campaigns");
  console.log("   Flow: Log in as creator → Discover → click campaign → Submit Your Content → paste link");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
