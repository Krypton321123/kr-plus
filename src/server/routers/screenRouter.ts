import { publicProcedure, router } from "../trpc";
import { z } from "zod";

export const screenRouter = router({
  getScreens: publicProcedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const allScreens = await ctx.db.mopl.mstMenuConfig.findMany();

      let grantedIds = new Set<number>();
      let viewOnlyIds = new Set<number>();

      if (input?.userId) {
        const userScreens = await ctx.db.mopl.userScreen.findMany({
          where: { userId: input.userId },
          select: { screen: true, viewOnly: true },
        });
        for (const us of userScreens) {
          grantedIds.add(us.screen);
          if (us.viewOnly) viewOnlyIds.add(us.screen);
        }
      }

      const clean = (name: string) =>
        name.replaceAll("<b>", "").replaceAll("</b>", "");

      const flat = allScreens.map((s) => ({
        ...s,
        scrnm: clean(s.scrnm),
        granted: grantedIds.has(s.rowid),
        viewOnly: viewOnlyIds.has(s.rowid),
      }));

      const parents = flat.filter((s) => s.scrcat === "Sub Module");
      const children = flat.filter((s) => s.scrcat === "Menu");
      const parentScrIds = new Set(parents.map((p) => p.scrid));

      // Only include modules that have at least one child
      const modules = parents
        .map((parent) => ({
          ...parent,
          children: children.filter((c) => c.scrpntid === parent.scrid),
        }))
        .filter((m) => m.children.length > 0);

      const orphans = children.filter(
        (c) => !c.scrpntid || !parentScrIds.has(c.scrpntid)
      );

      return { success: true, modules, orphans };
    }),

  setPermission: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        screenId: z.number(),
        grant: z.boolean(),
        viewOnly: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.grant) {
        await ctx.db.mopl.userScreen.deleteMany({
          where: { userId: input.userId, screen: input.screenId },
        });
        return { success: true };
      }

      const existing = await ctx.db.mopl.userScreen.findFirst({
        where: { userId: input.userId, screen: input.screenId },
      });

      if (existing) {
        if (input.viewOnly !== undefined) {
          await ctx.db.mopl.userScreen.update({
            where: { rowid: existing.rowid },
            data: { viewOnly: input.viewOnly },
          });
        }
      } else {
        await ctx.db.mopl.userScreen.create({
          data: {
            userId: input.userId,
            screen: input.screenId,
            viewOnly: input.viewOnly ?? false,
          },
        });
      }

      return { success: true };
    }),

  setModulePermissions: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        screenIds: z.array(z.number()),
        grant: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.grant) {
        await ctx.db.mopl.userScreen.deleteMany({
          where: { userId: input.userId, screen: { in: input.screenIds } },
        });
        return { success: true };
      }

      const existing = await ctx.db.mopl.userScreen.findMany({
        where: { userId: input.userId, screen: { in: input.screenIds } },
        select: { screen: true },
      });
      const existingSet = new Set(existing.map((e) => e.screen));
      const toCreate = input.screenIds.filter((id) => !existingSet.has(id));

      if (toCreate.length > 0) {
        await ctx.db.mopl.userScreen.createMany({
          data: toCreate.map((id) => ({
            userId: input.userId,
            screen: id,
            viewOnly: false,
          })),
        });
      }

      return { success: true };
    }),

  // Select all / deselect all for an entire tab
  setTabPermissions: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        screenIds: z.array(z.number()),
        grant: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.grant) {
        await ctx.db.mopl.userScreen.deleteMany({
          where: { userId: input.userId, screen: { in: input.screenIds } },
        });
        return { success: true };
      }

      const existing = await ctx.db.mopl.userScreen.findMany({
        where: { userId: input.userId, screen: { in: input.screenIds } },
        select: { screen: true },
      });
      const existingSet = new Set(existing.map((e) => e.screen));
      const toCreate = input.screenIds.filter((id) => !existingSet.has(id));

      if (toCreate.length > 0) {
        await ctx.db.mopl.userScreen.createMany({
          data: toCreate.map((id) => ({
            userId: input.userId,
            screen: id,
            viewOnly: false,
          })),
        });
      }

      return { success: true };
    }),
});