import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const designationRouter = router({

  getAll: publicProcedure.query(async ({ ctx }) => {
    const designations = await ctx.db.mopl.mstdsgnfo.findMany({
      orderBy: { rowid: "desc" },
    });

    // Self-join: resolve parent designation name
    const dsgMap = new Map(designations.map((d) => [d.dsgcd, d.dsgnm]));

    return designations.map((d) => ({
      ...d,
      parentName: d.prntdsgcd ? (dsgMap.get(d.prntdsgcd) ?? d.prntdsgcd) : null,
    }));
  }),

  // Lookup for the "Parent Designation" combobox — all existing designations
  getAllForLookup: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstdsgnfo.findMany({
      select: { dsgcd: true, dsgnm: true },
      orderBy: { dsgnm: "asc" },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        dsgnm:     z.string().min(1),
        dsgcat:    z.enum(["OfficeStaff", "PlantStaff"]),
        prntdsgcd: z.string().default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dsgcd = await generateNextCode(
        ctx.db.mopl,
        "mstdsgnfo",
        "dsgcd",
        "DSGA"
      );
      return ctx.db.mopl.mstdsgnfo.create({
        data: {
          dsgcd,
          dsgnm:     input.dsgnm,
          dsgcat:    input.dsgcat,
          prntdsgcd: input.dsgnm || null,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        rowid:     z.number(),
        dsgnm:     z.string().min(1),
        dsgcat:    z.enum(["OfficeStaff", "PlantStaff"]),
        prntdsgcd: z.string().default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { rowid, ...data } = input;
      return ctx.db.mopl.mstdsgnfo.update({
        where: { rowid },
        data: {
          dsgnm:     data.dsgnm,
          dsgcat:    data.dsgcat,
          prntdsgcd: data.dsgnm || null,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstdsgnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});