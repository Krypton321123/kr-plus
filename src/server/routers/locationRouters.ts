import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

// ─── States ───────────────────────────────────────────────────────────────────

export const stateRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.common.mstState.findMany({ orderBy: { rowid: "desc" } });
  }),

  create: publicProcedure
    .input(
      z.object({
        stnm: z.string().min(1),
        stshnm: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stcd = await generateNextCode(
        ctx.db.common,
        "mstState",
        "stcd",
        "STCA"
      );
      return ctx.db.common.mstState.create({
        data: { stcd, stnm: input.stnm, stshnm: input.stshnm },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.common.mstState.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});

// ─── Cities ───────────────────────────────────────────────────────────────────

export const cityRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Join in the state name for display
    const cities = await ctx.db.common.mstCity.findMany({
      orderBy: { rowid: "desc" },
    });
    const states = await ctx.db.common.mstState.findMany({
      select: { stcd: true, stnm: true },
    });
    const stateMap = new Map(states.map((s) => [s.stcd, s.stnm]));
    return cities.map((c) => ({
      ...c,
      stnm: stateMap.get(c.ctystcd) ?? c.ctystcd,
    }));
  }),

  create: publicProcedure
    .input(
      z.object({
        ctynm: z.string().min(1),
        ctystcd: z.string().min(1), // state stcd FK
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ctycd = await generateNextCode(
        ctx.db.common,
        "mstCity",
        "ctycd",
        "CTYA"
      );

      // ctystncd mirrors ctystcd (legacy field — stores state numeric code)
      return ctx.db.common.mstCity.create({
        data: {
          ctycd,
          ctynm: input.ctynm,
          ctystcd: input.ctystcd,
          ctystncd: input.ctystcd, // kept in sync — adjust if your legacy differs
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.common.mstCity.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});

// ─── Stations ─────────────────────────────────────────────────────────────────

export const stationRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.common.mstStn.findMany({ orderBy: { rowid: "desc" } });
  }),

  create: publicProcedure
    .input(
      z.object({
        stnnm: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stncd = await generateNextCode(
        ctx.db.common,
        "mstStn",
        "stncd",
        "STNA"
      );
      return ctx.db.common.mstStn.create({
        data: { stncd, stnnm: input.stnnm },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.common.mstStn.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});