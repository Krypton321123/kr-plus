import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const purBrgRouter = router({

  // ── Support data ───────────────────────────────────────────────────────────

  getUnits: publicProcedure.query(({ ctx }) =>
    ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
      orderBy: { untnm: "asc" },
    })
  ),

  // PO Categories filtered by untcd
  getPoCatByUnit: publicProcedure
    .input(z.object({ untcd: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.mopl.mstpocatcomnfo.findMany({
        where: { untcd: input.untcd },
        select: { pocatcomcd: true, pocatcomnm: true, itmcomcd: true },
        orderBy: { pocatcomnm: "asc" },
      })
    ),

  // Items filtered by itmcomcd (derived from selected PO category)
  getItemsByComcd: publicProcedure
    .input(z.object({ itmcomcd: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.mopl.mstitmnfo.findMany({
        where: { itmcomcd: input.itmcomcd },
        select: { itrmcd: true, itmnm: true },
        orderBy: { itmnm: "asc" },
      })
    ),

  // Fetch existing bargain by unit + date for search
  search: publicProcedure
  .input(z.object({
    untcd:  z.string().optional(),
    fromdt: z.string().optional(),
    todt:   z.string().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const where: Record<string, unknown> = {};
    if (input.untcd) where.untcd = input.untcd;
    if (input.fromdt && input.todt) {
      where.purbrgdt = {
        gte: new Date(input.fromdt),
        lte: new Date(input.todt),
      };
    }

    const records = await ctx.db.mopl.mstpurbrgnfo.findMany({
      where,
      orderBy: { rowid: "desc" },
      take: 50,
    });

    // Resolve names in parallel
    const [units, poCategories, items] = await Promise.all([
      ctx.db.mopl.unit.findMany({ select: { untcd: true, untnm: true } }),
      ctx.db.mopl.mstpocatcomnfo.findMany({ select: { pocatcomcd: true, pocatcomnm: true } }),
      ctx.db.mopl.mstitmnfo.findMany({
        where: { itrmcd: { in: records.map((r) => r.itmcd) } },
        select: { itrmcd: true, itmnm: true },
      }),
    ]);

    const unitMap   = Object.fromEntries(units.map((u) => [u.untcd, u.untnm]));
    const pocatMap  = Object.fromEntries(poCategories.map((p) => [p.pocatcomcd, p.pocatcomnm]));
    const itemMap   = Object.fromEntries(items.map((i) => [i.itrmcd, i.itmnm]));

    return records.map((r) => ({
      ...r,
      untnm:      unitMap[r.untcd]      ?? r.untcd,
      pocatcomnm: pocatMap[r.pocatcomcd] ?? r.pocatcomcd,
      itmnm:      itemMap[r.itmcd]      ?? r.itmcd,
    }));
  }),

  // Get single bargain by purbrgcd
  getByCode: publicProcedure
    .input(z.object({ purbrgcd: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.mopl.mstpurbrgnfo.findFirst({
        where: { purbrgcd: input.purbrgcd },
      })
    ),

  // Save (create or update)
  save: publicProcedure
    .input(z.object({
      purbrgcd:   z.string().optional(),          // if editing
      untcd:      z.string().min(1),
      purbrgdt:   z.string().min(1),              // ISO date string
      pocatcomcd: z.string().min(1),
      itmcd:      z.string().min(1),
      brgqty:     z.number().default(0),
      brgrate:    z.number().default(0),
      conddays:   z.number().default(0),
      condrate:   z.number().default(0),
      mblbrg:     z.enum(["Yes", "No"]).default("No"),
      apprateid:  z.number().default(0),
      sts:        z.string().default("A"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { purbrgcd: existingCd, purbrgdt, ...rest } = input;

      const purbrgcd = existingCd ?? await generateNextCode(
        ctx.db.mopl, "mstpurbrgnfo", "purbrgcd", "PBRG"
      );

      const data = {
        ...rest,
        purbrgcd,
        purbrgdt: new Date(purbrgdt),
      };

      if (existingCd) {
        const existing = await ctx.db.mopl.mstpurbrgnfo.findFirstOrThrow({
          where: { purbrgcd: existingCd },
          select: { rowid: true },
        });
        await ctx.db.mopl.mstpurbrgnfo.update({
          where: { rowid: existing.rowid },
          data,
        });
      } else {
        await ctx.db.mopl.mstpurbrgnfo.create({ data });
      }

      return { purbrgcd };
    }),

  delete: publicProcedure
    .input(z.object({ purbrgcd: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.mopl.mstpurbrgnfo.findFirstOrThrow({
        where: { purbrgcd: input.purbrgcd },
        select: { rowid: true },
      });
      await ctx.db.mopl.mstpurbrgnfo.delete({ where: { rowid: existing.rowid } });
      return { success: true };
    }),
});