import { Prisma } from "@prisma/client";

interface BuildPostSearchWhereOptions {
  includeUserFields?: boolean;
}

export function buildPostSearchWhere(
  query?: string | null,
  options: BuildPostSearchWhereOptions = {}
): Prisma.PostWhereInput {
  const trimmed = query?.trim();
  if (!trimmed) return {};

  const search = trimmed;
  const conditions: Prisma.PostWhereInput[] = [
    { title: { contains: search, mode: "insensitive" } },
    { excerpt: { contains: search, mode: "insensitive" } },
    { content: { contains: search, mode: "insensitive" } },
    { creator: { contains: search, mode: "insensitive" } },
    { category: { contains: search, mode: "insensitive" } },
    { years: { contains: search, mode: "insensitive" } },
    {
      tags: {
        some: {
          tag: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      },
    },
  ];

  if (options.includeUserFields) {
    conditions.push({
      user: {
        is: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    });
  }

  return { OR: conditions };
}
