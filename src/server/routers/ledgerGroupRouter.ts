import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const ledgerGroupRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstledgrpnfo.findMany({
      orderBy: { ledgrplvlcd: "asc" },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        ledgrpnm: z.string().min(1),
        ledgrptyp: z.enum(["INCOME", "EXPENDITURE", "EXPENSE", "LIABILITY"]),
        ledgrppntid: z.number(), // 0 = top-level
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ledgrpcd = await generateNextCode(
        ctx.db.mopl,
        "mstledgrpnfo",
        "ledgrpcd",
        "LGPA"
      );

      // ledgrpid: max + 1
      const maxRow = await ctx.db.mopl.mstledgrpnfo.aggregate({
        _max: { ledgrpid: true },
      });
      const ledgrpid = (maxRow._max.ledgrpid ?? 0) + 1;

      // ── Compute ledgrplvlcd ──────────────────────────────────────────────
      // Pattern: root = "01","02"... child of "01" = "0101","0102"...
      // grandchild of "0101" = "010101","010102"... etc.
      let ledgrplvlcd: string;

      if (input.ledgrppntid === 0) {
        // Count existing roots
        const rootCount = await ctx.db.mopl.mstledgrpnfo.count({
          where: { ledgrppntid: 0 },
        });
        ledgrplvlcd = String(rootCount + 1).padStart(2, "0");
      } else {
        const parent = await ctx.db.mopl.mstledgrpnfo.findFirst({
          where: { ledgrpid: input.ledgrppntid },
        });
        if (!parent) throw new Error("Parent group not found.");

        // Count existing siblings under same parent
        const siblingCount = await ctx.db.mopl.mstledgrpnfo.count({
          where: { ledgrppntid: input.ledgrppntid },
        });
        const seq = String(siblingCount + 1).padStart(2, "0");
        ledgrplvlcd = parent.ledgrplvlcd + seq;
      }

      return ctx.db.mopl.mstledgrpnfo.create({
        data: {
          ledgrpcd,
          ledgrplvlcd,
          ledgrpnm: input.ledgrpnm.toUpperCase(),
          ledgrptyp: input.ledgrptyp,
          ledgrpid,
          ledgrppntid: input.ledgrppntid,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        rowid: z.number(),
        ledgrpnm: z.string().min(1),
        ledgrptyp: z.enum(["INCOME", "EXPENDITURE", "EXPENSE", "LIABILITY"]),
        // Parent is NOT changed on update — re-parenting would require
        // cascading ledgrplvlcd recalculation across all descendants.
        // Add a dedicated reparent mutation if needed in the future.
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mopl.mstledgrpnfo.update({
        where: { rowid: input.rowid },
        data: {
          ledgrpnm: input.ledgrpnm.toUpperCase(),
          ledgrptyp: input.ledgrptyp,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.mopl.mstledgrpnfo.findUnique({
        where: { rowid: input.rowid },
      });
      if (!target) throw new Error("Record not found.");

      const children = await ctx.db.mopl.mstledgrpnfo.count({
        where: { ledgrppntid: target.ledgrpid },
      });
      if (children > 0) {
        throw new Error("Cannot delete a group that has children.");
      }

      await ctx.db.mopl.mstledgrpnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});