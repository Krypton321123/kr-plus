import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

// ─── Party Categories ─────────────────────────────────────────────────────────
export const partyCatRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstpartycat.findMany({ orderBy: { rowid: "desc" } });
  }),

  create: publicProcedure
    .input(
      z.object({
        pcatnm: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pcatcd = await generateNextCode(
        ctx.db.mopl,
        "mstpartycat",
        "pcatcd",
        "PCAT"
      );
      return ctx.db.mopl.mstpartycat.create({
        data: { pcatcd, pcatnm: input.pcatnm },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstpartycat.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});