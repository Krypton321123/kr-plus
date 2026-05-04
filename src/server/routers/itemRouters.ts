import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

// ─── Item Brands (mstitmbrdnfo) ───────────────────────────────────────────────

export const itemBrandRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmbrdnfo.findMany({ orderBy: { rowid: "desc" } });
  }),

  create: publicProcedure
    .input(
      z.object({
        itmbrdnm: z.string().min(1),
        itmbrdshnm: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const itmbrdcd = await generateNextCode(
        ctx.db.mopl,
        "mstitmbrdnfo",
        "itmbrdcd",
        "IBCA"
      );
      return ctx.db.mopl.mstitmbrdnfo.create({
        data: {
          itmbrdcd,
          itmbrdnm: input.itmbrdnm,
          itmbrdshnm: input.itmbrdshnm,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstitmbrdnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});

// ─── Main Commodities (mstitmmaincomnfo) ──────────────────────────────────────

export const mainCommodityRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmmaincomnfo.findMany({
      orderBy: { rowid: "desc" },
    });
  }),

  create: publicProcedure
    .input(
      z.object({
        itmmaincomnm: z.string().min(1),
        itmmaincomshnm: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const itmmaincomcd = await generateNextCode(
        ctx.db.mopl,
        "mstitmmaincomnfo",
        "itmmaincomcd",
        "IMCA"
      );
      return ctx.db.mopl.mstitmmaincomnfo.create({
        data: {
          itmmaincomcd,
          itmmaincomnm: input.itmmaincomnm,
          itmmaincomshnm: input.itmmaincomshnm,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstitmmaincomnfo.delete({
        where: { rowid: input.rowid },
      });
      return { success: true };
    }),
});

// ─── Item Groups (mstitmgrpnfo) ───────────────────────────────────────────────

export const itemGroupRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmgrpnfo.findMany({ orderBy: { rowid: "desc" } });
  }),

  create: publicProcedure
    .input(
      z.object({
        itmgrpnm: z.string().min(1),
        itmgrpshnm: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const itmgrpcd = await generateNextCode(
        ctx.db.mopl,
        "mstitmgrpnfo",
        "itmgrpcd",
        "IGCA"
      );
      return ctx.db.mopl.mstitmgrpnfo.create({
        data: {
          itmgrpcd,
          itmgrpnm: input.itmgrpnm,
          itmgrpshnm: input.itmgrpshnm,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstitmgrpnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});

// ─── Item Measurement Units (mstitmuntnfo) ────────────────────────────────────

export const itemUnitRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmuntnfo.findMany({ orderBy: { rowid: "desc" } });
  }),

  create: publicProcedure
    .input(
      z.object({
        itmuntnm: z.string().min(1),
        itmuntshnm: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const itmuntcd = await generateNextCode(
        ctx.db.mopl,
        "mstitmuntnfo",
        "itmuntcd",
        "IUCA"
      );
      return ctx.db.mopl.mstitmuntnfo.create({
        data: {
          itmuntcd,
          itmuntnm: input.itmuntnm,
          itmuntshnm: input.itmuntshnm,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstitmuntnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});

// ─── Commodity (mstitmcomnfo) ─────────────────────────────────────────────────

export const commodityRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const commodities = await ctx.db.mopl.mstitmcomnfo.findMany({
      orderBy: { rowid: "desc" },
    });
 
    const mainCommodities = await ctx.db.mopl.mstitmmaincomnfo.findMany({
      select: { itmmaincomcd: true, itmmaincomnm: true },
    });
 
    const mainComMap = new Map(
      mainCommodities.map((m) => [m.itmmaincomcd, m.itmmaincomnm])
    );
 
    return commodities.map((c) => ({
      ...c,
      mainCommodityName: mainComMap.get(c.itmmaincomcd) ?? null,
    }));
  }),
 
  create: publicProcedure
    .input(
      z.object({
        // ── existing fields ──────────────────────────────────────
        itmcomnm:     z.string().min(1),
        itmcomshnm:   z.string().min(1),
        itmmaincomcd: z.string().min(1),
        itmcomtxcd:   z.string().optional().default(""),
 
        // ── new fields ───────────────────────────────────────────
        itcrate: z.number().default(0),
 
        stype: z
          .enum([
            "FINISHED GOODS PACKED",
            "FINISHED STOCK LOOSE",
            "RAW MATERIAL STOCK",
            "FINISH MATERIAL STOCK",
            "STORE PARTS",
            "N/A",
          ])
          .default("N/A"),
 
        snature: z
          .enum(["LOTWISE", "NONLOTWISE", "N/A"])
          .default("N/A"),
 
        // stored as 0 | 1
        poreq: z.union([z.literal(0), z.literal(1)]).default(0),
 
        ratetax: z
          .enum(["INCLUDING TAX", "EXCLUDING TAX"])
          .default("EXCLUDING TAX"),
 
        // stored as "YES" | "NO"
        srcmng: z.enum(["YES", "NO"]).default("NO"),
 
        rateautocalc: z
          .enum(["AUTOMATIC", "MANUAL"])
          .default("MANUAL"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const itmcomcd = await generateNextCode(
        ctx.db.mopl,
        "mstitmcomnfo",
        "itmcomcd",
        "ICCA"
      );
 
      return ctx.db.mopl.mstitmcomnfo.create({
        data: {
          itmcomcd,
          itmcomnm:     input.itmcomnm,
          itmcomshnm:   input.itmcomshnm,
          itmmaincomcd: input.itmmaincomcd,
          itmcomtxcd:   input.itmcomtxcd,
          itcrate:      input.itcrate,
          stype:        input.stype,
          snature:      input.snature,
          poreq:        input.poreq,
          ratetax:      input.ratetax,
          srcmng:       input.srcmng,
          rateautocalc: input.rateautocalc,
        },
      });
    }),
 
  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstitmcomnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});

// ─── Item Sub-Group (mstitmsubgrpnfo) ─────────────────────────────────────────

export const itemSubGroupRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Fetch sub-groups + join parent group name for display
    const subGroups = await ctx.db.mopl.mstitmsubgrpnfo.findMany({
      orderBy: { rowid: "desc" },
    });

    const groups = await ctx.db.mopl.mstitmgrpnfo.findMany({
      select: { itmgrpcd: true, itmgrpnm: true },
    });

    const groupMap = new Map(groups.map((g) => [g.itmgrpcd, g.itmgrpnm]));

    return subGroups.map((sg) => ({
      ...sg,
      parentGroupName: groupMap.get(sg.itmgrpcd) ?? null,
    }));
  }),

  create: publicProcedure
    .input(
      z.object({
        itmsubgrpnm: z.string().min(1),
        itmsubgrpshnm: z.string().min(1),
        itmgrpcd: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const itmsubgrpcd = await generateNextCode(
        ctx.db.mopl,
        "mstitmsubgrpnfo",
        "itmsubgrpcd",
        "ISGA"
      );

      return ctx.db.mopl.mstitmsubgrpnfo.create({
        data: {
          itmsubgrpcd,
          itmsubgrpnm: input.itmsubgrpnm,
          itmsubgrpshnm: input.itmsubgrpshnm,
          itmgrpcd: input.itmgrpcd,
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstitmsubgrpnfo.delete({
        where: { rowid: input.rowid },
      });
      return { success: true };
    }),
});

export const godownRouter = router({

  // ── Expose units list for the combobox ─────────────────────────────────────
  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
      orderBy: { untnm: "asc" },
    });
  }),

  // ── List all godowns with unit name + commodity count ──────────────────────
  getAll: publicProcedure.query(async ({ ctx }) => {
    const godowns = await ctx.db.mopl.mstgwnnfo.findMany({
      orderBy: { rowid: "desc" },
    });

    const units = await ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
    });
    const unitMap = new Map(units.map((u) => [u.untcd, u.untnm]));

    // Count commodity detail rows per godown
    const commodityCounts = await ctx.db.mopl.mstgwnitmcomdetnfo.groupBy({
      by: ["gwncd"],
      _count: { rowid: true },
    });
    const countMap = new Map(
      commodityCounts.map((c) => [c.gwncd, c._count.rowid])
    );

    return godowns.map((g) => ({
      ...g,
      unitName: unitMap.get(g.untcd) ?? null,
      commodityCount: countMap.get(g.gwncd) ?? 0,
    }));
  }),

  // ── Get a single godown with its commodity detail rows (for future edit) ───
  getOne: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .query(async ({ ctx, input }) => {
      const godown = await ctx.db.mopl.mstgwnnfo.findUnique({
        where: { rowid: input.rowid },
      });
      if (!godown) throw new Error("Godown not found");

      const commodities = await ctx.db.mopl.mstgwnitmcomdetnfo.findMany({
        where: { gwncd: godown.gwncd },
      });

      return { ...godown, commodities };
    }),

  // ── Create godown + commodity detail rows in a transaction ─────────────────
  create: publicProcedure
    .input(
      z.object({
        untcd:     z.string().min(1),
        stkcat:    z.string().min(1),
        gwntyp:    z.string().min(1),
        gwnnm:     z.string().min(1),
        hgt:       z.number().default(0),
        rel:       z.number().default(0),
        slsmancd:  z.string().default(""),
        drvcd:     z.string().default(""),
        mmlgwncd:  z.string().default(""),
        commodities: z
          .array(
            z.object({
              itmmaincomcd: z.string(),
              itmcomcd:     z.string(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const gwncd = await generateNextCode(
        ctx.db.mopl,
        "mstgwnnfo",
        "gwncd",
        "GWNA"
      );

      // Use a transaction so godown + commodity rows are atomic
      return ctx.db.mopl.$transaction(async (tx) => {
        const godown = await tx.mstgwnnfo.create({
          data: {
            gwncd,
            untcd:    input.untcd,
            gwnnm:    input.gwnnm,
            gwntyp:   input.gwntyp,
            stkcat:   input.stkcat,
            hgt:      input.hgt,
            rel:      input.rel,
            slsmancd: input.slsmancd,
            drvcd:    input.drvcd,
            mmlgwncd: input.mmlgwncd,
          },
        });

        if (input.commodities.length > 0) {
          await tx.mstgwnitmcomdetnfo.createMany({
            data: input.commodities.map((c) => ({
              gwncd,
              itmmaincomcd: c.itmmaincomcd,
              itmcomcd:     c.itmcomcd,
            })),
          });
        }

        return godown;
      });
    }),

  // ── Delete godown + its commodity rows ────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const godown = await ctx.db.mopl.mstgwnnfo.findUnique({
        where: { rowid: input.rowid },
        select: { gwncd: true },
      });
      if (!godown) throw new Error("Godown not found");

      return ctx.db.mopl.$transaction(async (tx) => {
        // Delete child commodity rows first
        await tx.mstgwnitmcomdetnfo.deleteMany({
          where: { gwncd: godown.gwncd },
        });
        await tx.mstgwnnfo.delete({ where: { rowid: input.rowid } });
      });
    }),
});