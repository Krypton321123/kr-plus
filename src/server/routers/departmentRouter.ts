import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const departmentRouter = router({

  // ── All depts (list) ──────────────────────────────────────────────────
  getAll: publicProcedure.query(async ({ ctx }) => {
    const depts = await ctx.db.mopl.mstdeptnfo.findMany({
      orderBy: { rowid: "desc" },
    });
    const units = await ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
    });
    const unitMap = new Map(units.map((u) => [u.untcd, u.untnm]));
    return depts.map((d) => ({
      ...d,
      untnm: d.untcd ? (unitMap.get(d.untcd) ?? d.untcd) : "",
    }));
  }),

  // ── Single dept (for edit load) ────────────────────────────────────────
  getOne: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .query(async ({ ctx, input }) => {
      const dept = await ctx.db.mopl.mstdeptnfo.findUnique({
        where: { rowid: input.rowid },
      });
      if (!dept) throw new Error("Department not found");

      // Get all prfcds linked to this dept
      const links = await ctx.db.mopl.mstdeptprqlink.findMany({
        where: { dptcd: dept.dptcd ?? "" },
        orderBy: { rowid: "asc" },
      });
      const linkedPrfcds = links.map((l) => l.prfcd);

      // Fetch full perquisite records so the UI can show ctgname + valtyp
      const perquisites = linkedPrfcds.length > 0
        ? await ctx.db.mopl.mstprqsitsctgsinfo.findMany({
            where: { prfcd: { in: linkedPrfcds } },
          })
        : [];

      return { ...dept, linkedPrfcds, perquisites };
    }),

  // ── Units dropdown ─────────────────────────────────────────────────────
  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({
      select: { rowid: true, untcd: true, untnm: true },
      orderBy: { untnm: "asc" },
    });
  }),

  // ── All perquisites master list (for the picker dropdown) ──────────────
  getAllPerquisites: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstprqsitsctgsinfo.findMany({
      orderBy: { ctgname: "asc" },
    });
  }),

  // ── Create ─────────────────────────────────────────────────────────────
  create: publicProcedure
    .input(
      z.object({
        untcd: z.string().optional(),
        dptnm: z.string().min(1, "Department name is required"),
        empcd: z.string().optional(),
        wkoff: z.string().optional(),
        wkoffday: z.string().optional(),
        almlv: z.string().optional(),
        nolv: z.number().optional(),
        alflv: z.string().optional(),
        alnhd: z.string().optional(),
        ernlv: z.string().optional(),
        dismlv: z.string().optional(),
        eldys: z.number().optional(),
        mldys: z.number().optional(),
        linkedPrfcds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dptcd = await generateNextCode(
        ctx.db.mopl,
        "mstdeptnfo",
        "dptcd",
        "DPTA"
      );

      const { linkedPrfcds, ...deptData } = input;

      const dept = await ctx.db.mopl.mstdeptnfo.create({
        data: { ...deptData, dptcd },
      });

      if (linkedPrfcds && linkedPrfcds.length > 0) {
        await ctx.db.mopl.mstdeptprqlink.createMany({
          data: linkedPrfcds.map((prfcd) => ({ dptcd, prfcd })),
        });
      }

      return dept;
    }),

  // ── Update ─────────────────────────────────────────────────────────────
  update: publicProcedure
    .input(
      z.object({
        rowid: z.number(),
        dptcd: z.string(),
        untcd: z.string().optional(),
        dptnm: z.string().min(1, "Department name is required"),
        empcd: z.string().optional(),
        wkoff: z.string().optional(),
        wkoffday: z.string().optional(),
        almlv: z.string().optional(),
        nolv: z.number().optional(),
        alflv: z.string().optional(),
        alnhd: z.string().optional(),
        ernlv: z.string().optional(),
        dismlv: z.string().optional(),
        eldys: z.number().optional(),
        mldys: z.number().optional(),
        linkedPrfcds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { linkedPrfcds, rowid, dptcd, ...deptData } = input;

      const dept = await ctx.db.mopl.mstdeptnfo.update({
        where: { rowid },
        data: deptData,
      });

      // Replace all links
      await ctx.db.mopl.mstdeptprqlink.deleteMany({ where: { dptcd } });
      if (linkedPrfcds && linkedPrfcds.length > 0) {
        await ctx.db.mopl.mstdeptprqlink.createMany({
          data: linkedPrfcds.map((prfcd) => ({ dptcd, prfcd })),
        });
      }

      return dept;
    }),

  // ── Delete ─────────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ rowid: z.number(), dptcd: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstdeptprqlink.deleteMany({ where: { dptcd: input.dptcd } });
      await ctx.db.mopl.mstdeptnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});