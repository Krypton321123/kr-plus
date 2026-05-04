import { publicProcedure, router } from "../trpc";
import { z } from "zod";

export const unitRouter = router({
  // Returns a state → city → units tree with granted flags per user
  getAll: publicProcedure.query(async ({ ctx }) => {
    const units = await ctx.db.mopl.unit.findMany({}); 
    return units; 
  }),
  getForPermissions: publicProcedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      // 1. Fetch all units from mopl
      const units = await ctx.db.mopl.unit.findMany({
        select: {
          rowid: true,
          untcd: true,
          untnm: true,
          untshnm: true,
          untcomctycd: true,   // FK → mstCity.ctycd
          userUnit: input?.userId
            ? { where: { userId: input.userId }, select: { rowid: true } }
            : false,
        },
      });

      // 2. Fetch all cities and states from common DB
      const cities = await ctx.db.common.mstCity.findMany();
      const states = await ctx.db.common.mstState.findMany();

      // 3. Build lookup maps
      const cityMap = new Map(cities.map((c) => [c.ctycd, c]));
      const stateMap = new Map(states.map((s) => [s.stcd, s]));

      // 4. Group units under city → state
      type UnitNode = {
        rowid: number;
        untcd: string;
        untnm: string;
        untshnm: string | null;
        granted: boolean;
      };

      type CityNode = {
        ctycd: string;
        ctynm: string;
        units: UnitNode[];
      };

      type StateNode = {
        stcd: string;
        stnm: string;
        cities: Map<string, CityNode>;
      };

      const stateTree = new Map<string, StateNode>();

      for (const unit of units) {
        const ctycd = unit.untcomctycd ?? "__unknown__";
        const city = cityMap.get(ctycd);
        const stcd = city?.ctystcd ?? "__unknown__";
        const state = stateMap.get(stcd);

        // Ensure state node
        if (!stateTree.has(stcd)) {
          stateTree.set(stcd, {
            stcd,
            stnm: state?.stnm ?? "Unknown State",
            cities: new Map(),
          });
        }
        const stateNode = stateTree.get(stcd)!;

        // Ensure city node
        if (!stateNode.cities.has(ctycd)) {
          stateNode.cities.set(ctycd, {
            ctycd,
            ctynm: city?.ctynm ?? "Unknown City",
            units: [],
          });
        }

        const granted = Array.isArray(unit.userUnit)
          ? unit.userUnit.length > 0
          : false;

        stateNode.cities.get(ctycd)!.units.push({
          rowid: unit.rowid,
          untcd: unit.untcd,
          untnm: unit.untnm,
          untshnm: unit.untshnm,
          granted,
        });
      }

      // 5. Serialize to plain objects for tRPC
      const tree = Array.from(stateTree.values()).map((s) => ({
        stcd: s.stcd,
        stnm: s.stnm,
        cities: Array.from(s.cities.values()).map((c) => ({
          ctycd: c.ctycd,
          ctynm: c.ctynm,
          units: c.units,
        })),
      }));

      return { success: true, tree };
    }),

  // Toggle a single unit for a user
  setPermission: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        unitId: z.number(),
        grant: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.grant) {
        await ctx.db.mopl.userUnit.deleteMany({
          where: { userId: input.userId, unit: input.unitId },
        });
        return { success: true };
      }

      const existing = await ctx.db.mopl.userUnit.findFirst({
        where: { userId: input.userId, unit: input.unitId },
      });

      if (!existing) {
        await ctx.db.mopl.userUnit.create({
          data: { userId: input.userId, unit: input.unitId },
        });
      }

      return { success: true };
    }),

  // Grant/revoke all units in a city
  setByCity: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        unitIds: z.array(z.number()),
        grant: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.grant) {
        await ctx.db.mopl.userUnit.deleteMany({
          where: { userId: input.userId, unit: { in: input.unitIds } },
        });
        return { success: true };
      }

      const existing = await ctx.db.mopl.userUnit.findMany({
        where: { userId: input.userId, unit: { in: input.unitIds } },
        select: { unit: true },
      });
      const existingSet = new Set(existing.map((e) => e.unit));
      const toCreate = input.unitIds.filter((id) => !existingSet.has(id));

      if (toCreate.length > 0) {
        await ctx.db.mopl.userUnit.createMany({
          data: toCreate.map((id) => ({ userId: input.userId, unit: id })),
        });
      }

      return { success: true };
    }),

  // Grant/revoke all units in a state
  setByState: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        unitIds: z.array(z.number()),
        grant: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.grant) {
        await ctx.db.mopl.userUnit.deleteMany({
          where: { userId: input.userId, unit: { in: input.unitIds } },
        });
        return { success: true };
      }

      const existing = await ctx.db.mopl.userUnit.findMany({
        where: { userId: input.userId, unit: { in: input.unitIds } },
        select: { unit: true },
      });
      const existingSet = new Set(existing.map((e) => e.unit));
      const toCreate = input.unitIds.filter((id) => !existingSet.has(id));

      if (toCreate.length > 0) {
        await ctx.db.mopl.userUnit.createMany({
          data: toCreate.map((id) => ({ userId: input.userId, unit: id })),
        });
      }

      return { success: true };
    }),
});