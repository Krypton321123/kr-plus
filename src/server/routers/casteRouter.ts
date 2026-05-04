import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const casteRouter = router({
  // ── Get all castes (with religion name joined) ──────────────────────────
  getAll: publicProcedure.query(async ({ ctx }) => {
    const castes = await ctx.db.mopl.mstrlgcstnfo.findMany({
      orderBy: { rowid: "desc" },
    });
    const religions = await ctx.db.mopl.mstrlgnfo.findMany({
      select: { rlgcd: true, rlgnm: true },
    });
    const rlgMap = new Map(religions.map((r) => [r.rlgcd, r.rlgnm]));
    return castes.map((c) => ({
      ...c,
      rlgnm: rlgMap.get(c.rlgcd) ?? c.rlgcd,
    }));
  }),

  // ── Get all religions (for the dropdown) ────────────────────────────────
  getAllReligions: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstrlgnfo.findMany({ orderBy: { rlgnm: "asc" } });
  }),

  // ── Create ───────────────────────────────────────────────────────────────
  create: publicProcedure
    .input(
      z.object({
        rlgcstnm: z.string().min(1, "Caste name is required"),
        rlgcd: z.string().min(1, "Religion is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rlgcstcd = await generateNextCode(
        ctx.db.mopl,
        "mstrlgcstnfo",
        "rlgcstcd",
        "CSTA"
      );
      return ctx.db.mopl.mstrlgcstnfo.create({
        data: {
          rlgcstcd,
          rlgcstnm: input.rlgcstnm,
          rlgcd: input.rlgcd,
        },
      });
    }),

  // ── Update ───────────────────────────────────────────────────────────────
  update: publicProcedure
    .input(
      z.object({
        rowid: z.number(),
        rlgcstnm: z.string().min(1, "Caste name is required"),
        rlgcd: z.string().min(1, "Religion is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mopl.mstrlgcstnfo.update({
        where: { rowid: input.rowid },
        data: {
          rlgcstnm: input.rlgcstnm,
          rlgcd: input.rlgcd,
        },
      });
    }),

  // ── Delete ───────────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstrlgcstnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});