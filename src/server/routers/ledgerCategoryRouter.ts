import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const ledgerCategoryRouter = router({

  // ── Lookups for comboboxes ─────────────────────────────────────────────────
  getSysLedgers: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstsyslednfo.findMany({
      select: { sysledcd: true, syslednm: true },
      orderBy: { syslednm: "asc" },
    });
  }),

  getLedgerGroups: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstledgrpnfo.findMany({
      select: { ledgrpcd: true, ledgrpnm: true },
      orderBy: { ledgrpnm: "asc" },
    });
  }),

  getCommodities: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmcomnfo.findMany({
      select: { itmcomcd: true, itmcomnm: true },
      orderBy: { itmcomnm: "asc" },
    });
  }),

  // ── Main CRUD ──────────────────────────────────────────────────────────────
  getAll: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.mopl.mstledctnfo.findMany({
      orderBy: { rowid: "desc" },
    });

    const [sysLedgers, ledgerGroups, commodities] = await Promise.all([
      ctx.db.mopl.mstsyslednfo.findMany({ select: { sysledcd: true, syslednm: true } }),
      ctx.db.mopl.mstledgrpnfo.findMany({ select: { ledgrpcd: true, ledgrpnm: true } }),
      ctx.db.mopl.mstitmcomnfo.findMany({ select: { itmcomcd: true, itmcomnm: true } }),
    ]);

    const sysLedMap  = new Map(sysLedgers.map((s) => [s.sysledcd, s.syslednm]));
    const ledGrpMap  = new Map(ledgerGroups.map((g) => [g.ledgrpcd, g.ledgrpnm]));
    const comMap     = new Map(commodities.map((c) => [c.itmcomcd, c.itmcomnm]));

    return categories.map((c) => ({
      ...c,
      sysLedgerName:   sysLedMap.get(c.sysledcd) ?? c.sysledcd,
      ledgerGroupName: ledGrpMap.get(c.ledgrpcd) ?? c.ledgrpcd,
      commodityName:   comMap.get(c.itmcomcd)     ?? c.itmcomcd,
    }));
  }),

  create: publicProcedure
    .input(
      z.object({
        ledctnm:     z.string().min(1),
        ledctshtnm:  z.string().min(1),
        sysledcd:    z.string().min(1),
        ledgrpcd:    z.string().min(1),
        itmcomcd:    z.string().default(""),
        hasled:       z.enum(["Y", "N"]).default("N"),
        hasparties:   z.enum(["Y", "N"]).default("N"),
        showintrial:  z.enum(["Y", "N"]).default("N"),
        locwisemerge: z.enum(["Y", "N"]).default("N"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ledctcd = await generateNextCode(
        ctx.db.mopl,
        "mstledctnfo",
        "ledctcd",
        "LCTA"
      );
      return ctx.db.mopl.mstledctnfo.create({
        data: {
          ledctcd,
          ledctnm:      input.ledctnm,
          ledctshtnm:   input.ledctshtnm,
          sysledcd:     input.sysledcd,
          ledgrpcd:     input.ledgrpcd,
          itmcomcd:     input.itmcomcd,
          maildet:      "",
          parentid:     "",
          hasled:       input.hasled,
          hasparties:   input.hasparties,
          showintrial:  input.showintrial,
          locwisemerge: input.locwisemerge,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        rowid:        z.number(),
        ledctnm:      z.string().min(1),
        ledctshtnm:   z.string().min(1),
        sysledcd:     z.string().min(1),
        ledgrpcd:     z.string().min(1),
        itmcomcd:     z.string().default(""),
        hasled:       z.enum(["Y", "N"]),
        hasparties:   z.enum(["Y", "N"]),
        showintrial:  z.enum(["Y", "N"]),
        locwisemerge: z.enum(["Y", "N"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { rowid, ...data } = input;
      return ctx.db.mopl.mstledctnfo.update({
        where: { rowid },
        data: {
          ledctnm:      data.ledctnm,
          ledctshtnm:   data.ledctshtnm,
          sysledcd:     data.sysledcd,
          ledgrpcd:     data.ledgrpcd,
          itmcomcd:     data.itmcomcd,
          hasled:       data.hasled,
          hasparties:   data.hasparties,
          showintrial:  data.showintrial,
          locwisemerge: data.locwisemerge,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstledctnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});