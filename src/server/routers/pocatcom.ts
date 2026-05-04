import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const poCatComRouter = router({

  // ── Support data ──────────────────────────────────────────────────────────
  getUnits: publicProcedure.query(({ ctx }) =>
    ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
      orderBy: { untnm: "asc" },
    })
  ),

  getCommodities: publicProcedure.query(({ ctx }) =>
    ctx.db.mopl.mstitmcomnfo.findMany({
      select: { itmcomcd: true, itmcomnm: true },
      orderBy: { itmcomnm: "asc" },
    })
  ),

  // Returns mstpurprmdetnfo rows (condition names) filtered by
  // the purchase parameter that matches untcd + itmcomcd
  getConditionParams: publicProcedure
    .input(z.object({ untcd: z.string(), itmcomcd: z.string() }))
    .query(async ({ ctx, input }) => {
        console.log("input", input)
      // Find the active purchase parameter header for this unit+commodity
      const header = await ctx.db.mopl.mstpurprmnfo.findFirst({
        where: { untcd: input.untcd, itmcomcd: input.itmcomcd, sts: "A" },
        orderBy: { rowid: "desc" },
      });
      console.log("hedaer", header)
      if (!header) return [];

      return ctx.db.mopl.mstpurprmdetnfo.findMany({
        where: { prmcd: header.prmcd },
        orderBy: { rowid: "asc" },
      });
    }),

  // Latest header for a unit+commodity combo
  getLatestHeader: publicProcedure
    .input(z.object({ untcd: z.string(), itmcomcd: z.string() }))
    .query(async ({ ctx, input }) => {
      const header = await ctx.db.mopl.mstpocatcomnfo.findFirst({
        where: { untcd: input.untcd, itmcomcd: input.itmcomcd },
        orderBy: { rowid: "desc" },
      });
      return header ?? null;
    }),

  getDetails: publicProcedure
    .input(z.object({ pocatcomcd: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.mopl.mstpocatcomdetnfo.findMany({
        where: { pocatcomcd: input.pocatcomcd },
        orderBy: { rowid: "asc" },
      })
    ),

  save: publicProcedure
    .input(z.object({
      untcd:        z.string().min(1),
      itmcomcd:     z.string().min(1),
      pocatcomnm:   z.string().min(1),
      frghttyp:     z.string().min(1),
      fromdt:       z.string().min(1),
      todt:         z.string().min(1),
      wgtreq:       z.enum(["YES", "NO"]),
      shtdis:       z.number().default(0),
      duedys:       z.number().default(0),
      duedyscng:    z.enum(["Yes", "No"]),
      cattyp:       z.string().min(1),
      smat:         z.enum(["Yes", "No"]),
      conddesc:     z.string().optional().default(""),
      billdiff_ded: z.enum(["YES", "NO"]),
      shortage_ded: z.enum(["YES", "NO"]),
      bill_type:    z.enum(["BILL", "CHALLAN"]),
      pocatcomcd:   z.string().optional(), // if editing
      prmcd: z.string().default(""),
      rows: z.array(z.object({
        cndprmnm:   z.string().min(1),
        cmnprmval:  z.number().default(0),
        cndprmded:  z.number().default(0),
        cndprmrate: z.string().default(""),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const {
        pocatcomcd: existingCd,
        rows,
        fromdt, todt,
        ...rest
      } = input;

      const pocatcomcd = existingCd ?? await generateNextCode(
        ctx.db.mopl, "mstpocatcomnfo", "pocatcomcd", "PCCA"
      );

      await ctx.db.mopl.$transaction(async (tx) => {
        if (existingCd) {
          await tx.mstpocatcomnfo.update({
            where: { rowid: (await tx.mstpocatcomnfo.findFirstOrThrow(
              { where: { pocatcomcd: existingCd }, select: { rowid: true }
            })).rowid },
            data: {
              ...rest,
              pocatcomcd,
              fromdt: new Date(fromdt),
              todt:   new Date(todt),
            },
          });
          await tx.mstpocatcomdetnfo.deleteMany({ where: { pocatcomcd } });
        } else {
          
          await tx.mstpocatcomnfo.create({
            data: {
              ...rest,
              prmcd: rest.prmcd, 
              pocatcomcd,
              fromdt: new Date(fromdt),
              todt:   new Date(todt),
            },
          });
        }

        if (rows.length > 0) {
          await tx.mstpocatcomdetnfo.createMany({
            data: rows.map((r) => ({ pocatcomcd, ...r })),
          });
        }
      });

      return { pocatcomcd };
    }),
});