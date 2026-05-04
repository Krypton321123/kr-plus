import { z } from "zod";
import { publicProcedure, router } from "../trpc";

const BrkgTypEnum = z.enum(["On Qty", "On Amt"]);
const BrkgRgTypEnum = z.enum(["purchase", "sales"]);

export const brkgRouter = router({
  // ─── Dropdown data ─────────────────────────────────────────────────────────
  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
      orderBy: { untnm: "asc" },
    });
  }),

  getCommodities: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmcomnfo.findMany({
      select: { itmcomcd: true, itmcomnm: true },
      orderBy: { itmcomnm: "asc" },
    });
  }),

  // Brokers = mstlednfo whose ledcatnfo → mstledctnfo → mstsyslednfo.syslednm = "BROKER A/C"
  getBrokers: publicProcedure.query(async ({ ctx }) => {
    // Step 1: find the sysledcd where syslednm = "BROKER A/C"
    const brokerSysLed = await ctx.db.mopl.mstsyslednfo.findFirst({
      where: { syslednm: "BROKER A/C" },
      select: { sysledcd: true },
    });
    if (!brokerSysLed) return [];

    // Step 2: find all ledctcd values in mstledctnfo that map to that sysledcd
    const ledctRows = await ctx.db.mopl.mstledctnfo.findMany({
      where: { sysledcd: brokerSysLed.sysledcd },
      select: { ledctcd: true },
    });
    const brokerLedctCds = ledctRows.map((r) => r.ledctcd);
    if (brokerLedctCds.length === 0) return [];

    // Step 3: find all ledcd values in mstledcatnfo whose ledctcd is in that set
    const ledCatRows = await ctx.db.mopl.mstledcatnfo.findMany({
      where: { ledctcd: { in: brokerLedctCds } },
      select: { ledcd: true },
    });
    const brokerLedCds = [...new Set(ledCatRows.map((r) => r.ledcd))];
    if (brokerLedCds.length === 0) return [];

    // Step 4: fetch the actual ledger entries
    return ctx.db.mopl.mstlednfo.findMany({
      where: { ledcd: { in: brokerLedCds } },
      select: { ledcd: true, lednm: true },
      orderBy: { lednm: "asc" },
    });
  }),

  // ─── Get all by brkrgtyp ───────────────────────────────────────────────────
  getAll: publicProcedure
    .input(z.object({ brkrgtyp: BrkgRgTypEnum }))
    .query(async ({ ctx, input }) => {
      const records = await ctx.db.mopl.mstbrkgnfo.findMany({
        where: { brkrgtyp: input.brkrgtyp },
        orderBy: { rowid: "desc" },
      });

      const [units, commodities, ledgers] = await Promise.all([
        ctx.db.mopl.unit.findMany({ select: { untcd: true, untnm: true } }),
        ctx.db.mopl.mstitmcomnfo.findMany({ select: { itmcomcd: true, itmcomnm: true } }),
        ctx.db.mopl.mstlednfo.findMany({ select: { ledcd: true, lednm: true } }),
      ]);

      const unitMap = new Map(units.map((u) => [u.untcd, u.untnm]));
      const comMap = new Map(commodities.map((c) => [c.itmcomcd, c.itmcomnm]));
      const ledMap = new Map(ledgers.map((l) => [l.ledcd, l.lednm]));

      return records.map((r) => ({
        ...r,
        untnm: unitMap.get(r.untcd) ?? r.untcd,
        itmcomnm: comMap.get(r.itmcomcd) ?? r.itmcomcd,
        brklednm: ledMap.get(r.brkledcd) ?? r.brkledcd,
      }));
    }),

  // ─── Create ────────────────────────────────────────────────────────────────
  create: publicProcedure
    .input(
      z.object({
        untcd: z.string().min(1, "Unit is required"),
        brkrgtyp: BrkgRgTypEnum,
        vfrom: z.string(),
        vto: z.string(),
        brkledcd: z.string().min(1, "Broker is required"),
        itmcomcd: z.string().min(1, "Commodity is required"),
        pbrkgtyp: BrkgTypEnum,
        pbrkgval: z.number().min(0),
        mbrkgtyp: BrkgTypEnum,
        mbrkgval: z.number().min(0),
        slbrkgval: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Mark any existing ACTIVE record for same unit+commodity+brkrgtyp as INACTIVE
      await ctx.db.mopl.mstbrkgnfo.updateMany({
        where: {
          untcd: input.untcd,
          itmcomcd: input.itmcomcd,
          brkrgtyp: input.brkrgtyp,
          sts: "ACTIVE",
        },
        data: { sts: "INACTIVE" },
      });

      // Generate next brkgcd
      const last = await ctx.db.mopl.mstbrkgnfo.findFirst({
        orderBy: { rowid: "desc" },
        select: { brkgcd: true },
      });
      const nextNum = last?.brkgcd
        ? parseInt(last.brkgcd.replace(/\D/g, ""), 10) + 1
        : 1;
      const brkgcd = `BKGA${String(nextNum).padStart(5, "0")}`;

      return ctx.db.mopl.mstbrkgnfo.create({
        data: {
          brkgcd,
          untcd: input.untcd,
          brkrgtyp: input.brkrgtyp,
          vfrom: new Date(input.vfrom),
          vto: new Date(input.vto),
          brkledcd: input.brkledcd,
          itmcomcd: input.itmcomcd,
          pbrkgtyp: input.pbrkgtyp,
          pbrkgval: input.pbrkgval,
          mbrkgtyp: input.mbrkgtyp,
          mbrkgval: input.mbrkgval,
          slbrkgval: input.slbrkgval,
          sts: "ACTIVE",
        },
      });
    }),

  // ─── Update ────────────────────────────────────────────────────────────────
  update: publicProcedure
    .input(
      z.object({
        rowid: z.number(),
        untcd: z.string().min(1),
        brkrgtyp: BrkgRgTypEnum,
        vfrom: z.string(),
        vto: z.string(),
        brkledcd: z.string().min(1),
        itmcomcd: z.string().min(1),
        pbrkgtyp: BrkgTypEnum,
        pbrkgval: z.number().min(0),
        mbrkgtyp: BrkgTypEnum,
        mbrkgval: z.number().min(0),
        slbrkgval: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { rowid, ...rest } = input;
      return ctx.db.mopl.mstbrkgnfo.update({
        where: { rowid },
        data: {
          untcd: rest.untcd,
          brkrgtyp: rest.brkrgtyp,
          vfrom: new Date(rest.vfrom),
          vto: new Date(rest.vto),
          brkledcd: rest.brkledcd,
          itmcomcd: rest.itmcomcd,
          pbrkgtyp: rest.pbrkgtyp,
          pbrkgval: rest.pbrkgval,
          mbrkgtyp: rest.mbrkgtyp,
          mbrkgval: rest.mbrkgval,
          slbrkgval: rest.slbrkgval,
        },
      });
    }),

  // ─── Toggle status ─────────────────────────────────────────────────────────
  toggleStatus: publicProcedure
    .input(z.object({ rowid: z.number(), currentSts: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.mopl.mstbrkgnfo.update({
        where: { rowid: input.rowid },
        data: { sts: input.currentSts === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
      });
    }),

  // ─── Delete ────────────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstbrkgnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});