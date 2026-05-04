import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

export const dateLockRouter = router({
  // ── Full tree: states → cities → units, with lock info pre-joined ──────────
  getTree: publicProcedure.query(async ({ ctx }) => {
    const [states, cities, units, locks] = await Promise.all([
      ctx.db.common.mstState.findMany({ orderBy: { stnm: "asc" } }),
      ctx.db.common.mstCity.findMany({ orderBy: { ctynm: "asc" } }),
      ctx.db.mopl.unit.findMany({
        orderBy: { untnm: "asc" },
        select: { rowid: true, untcd: true, untnm: true, untcomctycd: true },
      }),
      ctx.db.mopl.mstdatelocknfo.findMany(),
    ]);

    // Keep only the latest lock per unit (highest rowid)
    const lockMap = new Map<string, (typeof locks)[number]>();
    for (const lock of locks) {
      const existing = lockMap.get(lock.untcd);
      if (!existing || lock.rowid > existing.rowid) {
        lockMap.set(lock.untcd, lock);
      }
    }

    return states.map((state) => {
      const stateCities = cities.filter((c) => c.ctystcd === state.stcd);
      return {
        stcd: state.stcd,
        stnm: state.stnm,
        cities: stateCities.map((city) => {
          const cityUnits = units.filter((u) => u.untcomctycd === city.ctycd);
          return {
            ctycd: city.ctycd,
            ctynm: city.ctynm,
            units: cityUnits.map((unit) => {
              const lock = lockMap.get(unit.untcd);
              return {
                untcd: unit.untcd,
                untnm: unit.untnm,
                lock: lock
                  ? {
                      rowid: lock.rowid,
                      lockcd: lock.lockcd,
                      lockdt: lock.lockdt.toISOString(),
                      sts: lock.sts,
                    }
                  : null,
              };
            }),
          };
        }),
      };
    });
  }),

  // ── Create a new lock entry ────────────────────────────────────────────────
  create: publicProcedure
    .input(
      z.object({
        untcd: z.string().min(1),
        lockdt: z.string().min(1),
        sts: z.enum(["Lock", "Unlock"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lockcd = await generateNextCode(
        ctx.db.mopl,
        "mstdatelocknfo",
        "lockcd",
        "DTLA"
      );
      return ctx.db.mopl.mstdatelocknfo.create({
        data: {
          lockcd,
          untcd: input.untcd,
          lockdt: new Date(input.lockdt),
          sts: input.sts,
        },
      });
    }),

  // ── Update an existing lock (date + status) ────────────────────────────────
  update: publicProcedure
    .input(
      z.object({
        rowid: z.number(),
        lockdt: z.string().min(1),
        sts: z.enum(["Lock", "Unlock"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mopl.mstdatelocknfo.update({
        where: { rowid: input.rowid },
        data: {
          lockdt: new Date(input.lockdt),
          sts: input.sts,
        },
      });
    }),

  // ── Delete a lock ──────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstdatelocknfo.delete({
        where: { rowid: input.rowid },
      });
      return { success: true };
    }),
});