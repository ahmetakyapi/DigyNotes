import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const DEFAULT_SITE_SETTINGS = {
  registrationEnabled: "true",
  maintenanceMode: "false",
  maintenanceMessage: "Site şu anda bakımda. Lütfen daha sonra tekrar deneyin.",
} as const;

type SiteSettingKey = keyof typeof DEFAULT_SITE_SETTINGS;

function isTransientPrismaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P1001", "P1008", "P1017"].includes(error.code)
  );
}

export async function getSiteSetting(key: SiteSettingKey) {
  try {
    const setting = await prisma.siteSettings.findUnique({ where: { key } });
    return setting?.value ?? DEFAULT_SITE_SETTINGS[key];
  } catch (error) {
    if (isTransientPrismaError(error)) {
      return DEFAULT_SITE_SETTINGS[key];
    }
    throw error;
  }
}
