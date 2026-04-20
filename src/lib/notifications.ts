import { prisma } from "./prisma";
import type { NotificationType } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      ...(params.data ? { data: params.data as any } : {}),
    },
  });
}

export async function notifyMatchingCreators(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return;

  // Find creators whose tags overlap with campaign tags
  const creators = await prisma.user.findMany({
    where: {
      role: "CREATOR",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const notifications = creators.map((c) => ({
    userId: c.id,
    type: "SYSTEM" as NotificationType,
    title: "New Campaign Available!",
    message: `${campaign.title} — KES ${campaign.rewardPerView}/view`,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}
