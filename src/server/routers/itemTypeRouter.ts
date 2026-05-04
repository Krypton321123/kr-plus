import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const itemTypeRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmtypnfo.findMany({ orderBy: { rowid: "desc" } });
  }),

  create: publicProcedure
    .input(z.object({ itmtypnm: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const itmtypcd = await generateNextCode(
        ctx.db.mopl,
        "mstitmtypnfo",
        "itmtypcd",
        "ITPA"
      );
      return ctx.db.mopl.mstitmtypnfo.create({
        data: { itmtypcd, itmtypnm: input.itmtypnm },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstitmtypnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});