import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// ─── Area Info ────────────────────────────────────────────────────────────────
export const areaRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const areas = await ctx.db.mopl.mstareanfo.findMany({
      orderBy: { rowid: "desc" },
    });

    // Enrich with unit name from MOPL
    const units = await ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
    });
    const unitMap = new Map(units.map((u) => [u.untcd, u.untnm]));

    // Enrich with city name from COMMON
    const cities = await ctx.db.common.mstCity.findMany({
      select: { ctycd: true, ctynm: true },
    });
    const cityMap = new Map(cities.map((c) => [c.ctycd, c.ctynm]));

    return areas.map((a) => ({
      ...a,
      untnm: unitMap.get(a.untcd) ?? a.untcd,
      ctynm: cityMap.get(a.areactycd) ?? a.areactycd,
    }));
  }),

  create: publicProcedure
    .input(
      z.object({
        areanm: z.string().min(1),
        zipcd: z.string().min(1),
        untcd: z.string().min(1),
        areactycd: z.string().min(1),
        areaday: z.enum(DAYS),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const areacd = await generateNextCode(
        ctx.db.mopl,
        "mstareanfo",
        "areacd",
        "ARCA"
      );
      return ctx.db.mopl.mstareanfo.create({
        data: {
          areacd,
          areanm: input.areanm,
          zipcd: input.zipcd,
          untcd: input.untcd,
          areactycd: input.areactycd,
          areaday: input.areaday,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstareanfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});