import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const purParamRouter = router({
  // ── Units (depots) ────────────────────────────────────────────────────────
  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
      orderBy: { untnm: "asc" },
    });
  }),

  // ── Commodities from mstitmcomnfo ─────────────────────────────────────────
  getCommodities: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmcomnfo.findMany({
      select: { itmcomcd: true, itmcomnm: true },
      orderBy: { itmcomnm: "asc" },
    });
  }),

  // ── Get latest header for a depot + commodity combo ───────────────────────
  getLatestHeader: publicProcedure
    .input(
      z.object({
        untcd: z.string().min(1),
        itmcomcd: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const latest = await ctx.db.mopl.mstpurprmnfo.findFirst({
        where: {
          untcd: input.untcd,
          itmcomcd: input.itmcomcd,
        },
        orderBy: { rowid: "desc" },
      });
      return latest ?? null;
    }),

  // ── Get detail rows for a prmcd ───────────────────────────────────────────
  getDetails: publicProcedure
    .input(z.object({ prmcd: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.mopl.mstpurprmdetnfo.findMany({
        where: { prmcd: input.prmcd },
        orderBy: { rowid: "asc" },
      });
    }),

  // ── Save: upsert header + replace detail rows ─────────────────────────────
  save: publicProcedure
    .input(
      z.object({
        untcd: z.string().min(1),
        itmcomcd: z.string().min(1),
        fromdt: z.string().min(1), // ISO date string
        toDt: z.string().min(1),   // ISO date string
        sts: z.string().default("A"),
        // If prmcd is provided, we update that record; otherwise create new
        prmcd: z.string().optional(),
        rows: z.array(
          z.object({
            cndprmnm: z.string().min(1),
            cndprmtyp: z.enum(["FIXED", "INPUT FROM LAB", "INPUT FROM STORE"]),
            inpprmnm: z.string(),
            valtyp: z.enum(["%", "On Wgt Unit", "NONE"]),
            clcon: z.enum([
              "Bill Amount",
              "Paid Amount",
              "Bill Weight",
              "Bill Quantity",
              "M1 Quantity",
              "M2 Quantity",
              "M3 Quantity",
              "M4 Quantity",
            ]),
            prcusd: z.enum(["YES", "NO"]),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
        console.log(input)
      const { untcd, itmcomcd, fromdt, toDt, sts, rows } = input;
      const fromdtDate = new Date(fromdt);
      const toDtDate = new Date(toDt);

      let prmcd = input.prmcd;

      if (prmcd) {
        // Update existing header
        await ctx.db.mopl.mstpurprmnfo.updateMany({
          where: { prmcd },
          data: { fromdt: fromdtDate, toDt: toDtDate, sts },
        });
      } else {
        // Create new header
        prmcd = await generateNextCode(
          ctx.db.mopl,
          "mstpurprmnfo",
          "prmcd",
          "PARA-"
        );
        await ctx.db.mopl.mstpurprmnfo.create({
          data: { untcd, itmcomcd, prmcd, fromdt: fromdtDate, toDt: toDtDate, sts },
        });
      }

      // Full replace detail rows
      await ctx.db.mopl.mstpurprmdetnfo.deleteMany({ where: { prmcd } });

      if (rows.length > 0) {
        await ctx.db.mopl.mstpurprmdetnfo.createMany({
          data: rows.map((r) => ({ prmcd, ...r })),
        });
      }

      return { success: true, prmcd };
    }),
});