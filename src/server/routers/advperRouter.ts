import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const advPerRouter = router({
  // ─── Get all records (with unit + commodity names joined) ─────────────────
  getAll: publicProcedure.query(async ({ ctx }) => {
    const records = await ctx.db.mopl.mstadvpernfo.findMany({
      orderBy: { rowid: "desc" },
    });

    const [units, commodities] = await Promise.all([
      ctx.db.mopl.unit.findMany({ select: { untcd: true, untnm: true } }),
      ctx.db.mopl.mstitmcomnfo.findMany({
        select: { itmcomcd: true, itmcomnm: true },
      }),
    ]);

    const unitMap = new Map(units.map((u) => [u.untcd, u.untnm]));
    const comMap = new Map(commodities.map((c) => [c.itmcomcd, c.itmcomnm]));

    return records.map((r) => ({
      ...r,
      untnm: unitMap.get(r.untcd) ?? r.untcd,
      itmcomnm: comMap.get(r.itmcomcd) ?? r.itmcomcd,
    }));
  }),

  // ─── Dropdown data ─────────────────────────────────────────────────────────
  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
      orderBy: { untnm: "asc" },
    });
  }),

  getCommodities: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmcomnfo.findMany({
      select: { itmcomcd: true, itmcomnm: true },
      orderBy: { itmcomnm: "asc" },
    });
  }),

  // ─── Create ────────────────────────────────────────────────────────────────
  create: publicProcedure
    .input(
      z.object({
        untcd: z.string().min(1, "Location is required"),
        itmcomcd: z.string().min(1, "Commodity is required"),
        frmdt: z.string(), // ISO string from client
        todt: z.string(),
        advper: z
          .string()
          .refine(
            (v) => {
              const n = parseFloat(v);
              return !isNaN(n) && n >= 0 && n < 100;
            },
            { message: "Advance % must be between 0 and 100" }
          ),
        entusrnm: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate (same unit + commodity + overlapping period)
      const existing = await ctx.db.mopl.mstadvpernfo.findFirst({
        where: {
          untcd: input.untcd,
          itmcomcd: input.itmcomcd,
          frmdt: { lte: new Date(input.todt) },
          todt: { gte: new Date(input.frmdt) },
        },
      });
      if (existing) {
        throw new Error(
          "A record already exists for this location/commodity in the given date range."
        );
      }

      // Generate next advpercd
      const last = await ctx.db.mopl.mstadvpernfo.findFirst({
        orderBy: { rowid: "desc" },
        select: { advpercd: true },
      });
      const nextNum = last?.advpercd
        ? parseInt(last.advpercd.replace(/\D/g, ""), 10) + 1
        : 1;
      const advpercd = `ADVA${String(nextNum).padStart(5, "0")}`;

      return ctx.db.mopl.mstadvpernfo.create({
        data: {
          advpercd,
          untcd: input.untcd,
          itmcomcd: input.itmcomcd,
          frmdt: new Date(input.frmdt),
          todt: new Date(input.todt),
          advper: input.advper,
          entusrnm: input.entusrnm,
          entdt: new Date(),
        },
      });
    }),

  // ─── Update ────────────────────────────────────────────────────────────────
  update: publicProcedure
    .input(
      z.object({
        rowid: z.number(),
        untcd: z.string().min(1),
        itmcomcd: z.string().min(1),
        frmdt: z.string(),
        todt: z.string(),
        advper: z
          .string()
          .refine(
            (v) => {
              const n = parseFloat(v);
              return !isNaN(n) && n >= 0 && n < 100;
            },
            { message: "Advance % must be between 0 and 100" }
          ),
        entusrnm: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { rowid, entusrnm, ...rest } = input;

      // Overlap check excluding self
      const existing = await ctx.db.mopl.mstadvpernfo.findFirst({
        where: {
          untcd: rest.untcd,
          itmcomcd: rest.itmcomcd,
          frmdt: { lte: new Date(rest.todt) },
          todt: { gte: new Date(rest.frmdt) },
          NOT: { rowid },
        },
      });
      if (existing) {
        throw new Error(
          "Another record already covers this location/commodity in the given date range."
        );
      }

      return ctx.db.mopl.mstadvpernfo.update({
        where: { rowid },
        data: {
          untcd: rest.untcd,
          itmcomcd: rest.itmcomcd,
          frmdt: new Date(rest.frmdt),
          todt: new Date(rest.todt),
          advper: rest.advper,
          entusrnm,
          entdt: new Date(),
        },
      });
    }),

  // ─── Delete ────────────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstadvpernfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});