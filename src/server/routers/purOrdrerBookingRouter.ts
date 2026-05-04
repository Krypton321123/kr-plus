import { z } from "zod";
import { publicProcedure, router } from "../trpc";

// ─── Helper: generate booking code ────────────────────────────────────────────
// Format: {unitShnm}{POB}{lastTwoOfFinYear}{cmpVchCdNo}{0001}
// e.g.  AGR + POB + 27 + A + 0001  →  AGRPOB27A0001
async function generateBookingCode(
  commonDb: any,
  moplDb: any,
  untcd: string,
  cmpcd: string,
  finYear: string,
): Promise<string> {
  // 1. Unit short name (e.g. "AGR")
  const unit = await moplDb.unit.findFirst({ where: { untcd } });
  const untShnm = (unit?.untshnm ?? untcd).toUpperCase().replace(/\s+/g, "");

  // 2. Last two chars of fin year string  e.g. "2026 - 27" → "27"
  const finyear = await commonDb.finyear.findFirst({
    where: {
        rowid: finYear
    }
  })
  const finYearSuffix = finyear.finyear.trim().slice(-2);

  // 3. Single-char voucher code from mstcmpnfo
  const cmp = await commonDb.mstcmpnfo.findFirst({ where: { cmpcd } });
  const vchCd = ((cmp as any)?.cmpvchcdno ?? "A").toString().charAt(0).toUpperCase();

  // 4. Build the base prefix
  const base = `${untShnm}POB${finYearSuffix}${vchCd}`;

  // 5. Find the latest booking whose code starts with this base
  const last = await moplDb.trnpurordbknnfo.findFirst({
    where: { pobkncd: { startsWith: base } },
    orderBy: { rowid: "desc" },
    select: { pobkncd: true },
  });

  let nextNum = 1;
  if (last?.pobkncd) {
    const numPart = last.pobkncd.slice(base.length);
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }

  return `${base}${String(nextNum).padStart(4, "0")}`;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const purOrderBookingRouter = router({
  // Units list
  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({ orderBy: { untnm: "asc" } });
  }),

  // Categories — latest record per pocatcomcd
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const all = await ctx.db.mopl.mstpocatcomnfo.findMany({
      orderBy: { rowid: "desc" },
    });
    const seen = new Map<string, (typeof all)[0]>();
    for (const row of all) {
      if (!seen.has(row.pocatcomcd)) seen.set(row.pocatcomcd, row);
    }
    return Array.from(seen.values());
  }),

  // Bargain info + computed booked/pending wgt
  getBargainInfo: publicProcedure
    .input(z.object({ pocatcomcd: z.string(), excludePobkncd: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const bargain = await ctx.db.mopl.mstpurbrgnfo.findFirst({
        where: { pocatcomcd: input.pocatcomcd },
        orderBy: { rowid: "desc" },
      });
      if (!bargain) return null;

      const bookings = await ctx.db.mopl.trnpurordbknnfo.findMany({
        where: {
          pocatcomcd: input.pocatcomcd,
          // Exclude the booking being edited so its weight doesn't double count
          ...(input.excludePobkncd
            ? { NOT: { pobkncd: input.excludePobkncd } }
            : {}),
        },
        select: { pobkncd: true },
      });

      let bookedWgt = 0;
      for (const b of bookings) {
        if (!b.pobkncd) continue;
        const details = await ctx.db.mopl.trnpurordbkndetnfo.findMany({
          where: { pobkncd: b.pobkncd },
          select: { qty: true },
        });
        bookedWgt += details.reduce((s, d) => s + (d.qty ?? 0), 0);
      }

      const totalBargainWgt = bargain.brgqty ?? 0;
      return {
        bargainRate: bargain.brgrate,
        totalBargainWgt,
        bookedWgt,
        pendingWgt: totalBargainWgt - bookedWgt,
      };
    }),

  // PO category conditions (sidebar)
  getCategoryConditions: publicProcedure
    .input(z.object({ pocatcomcd: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.mopl.mstpocatcomdetnfo.findMany({
        where: { pocatcomcd: input.pocatcomcd },
        orderBy: { rowid: "asc" },
      });
    }),

  // Ledgers by type — party=25, broker=30
  getLedgers: publicProcedure
    .input(z.object({ ledtyp: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.mopl.mstlednfo.findMany({
        where: { ledtyp: input.ledtyp },
        orderBy: { lednm: "asc" },
        select: { rowid: true, ledcd: true, lednm: true, ledtyp: true },
      });
    }),

  // ── All bookings (paginated) for the data table ────────────────────────────
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        search: z.string().optional(),
        untcd: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.untcd) where.untcd = input.untcd;
      if (input.search) {
        where.OR = [
          { pobkncd: { contains: input.search } },
          { pocatcomcd: { contains: input.search } },
        ];
      }

      const [rawItems, total] = await Promise.all([
        ctx.db.mopl.trnpurordbknnfo.findMany({
          where,
          orderBy: { rowid: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.mopl.trnpurordbknnfo.count({ where }),
      ]);

      // Collect unique codes to batch-resolve names
      const untcds = [...new Set(rawItems.map(i => i.untcd).filter(Boolean))] as string[];
      const pocatcomcds = [...new Set(rawItems.map(i => i.pocatcomcd).filter(Boolean))] as string[];

      const [unitRows, catRows] = await Promise.all([
        ctx.db.mopl.unit.findMany({
          where: { untcd: { in: untcds } },
          select: { untcd: true, untnm: true },
        }),
        ctx.db.mopl.mstpocatcomnfo.findMany({
          where: { pocatcomcd: { in: pocatcomcds } },
          orderBy: { rowid: "desc" },
          select: { pocatcomcd: true, pocatcomnm: true },
        }),
      ]);

      // Build lookup maps — for categories keep only first hit (latest due to desc order)
      const unitMap = new Map(unitRows.map(u => [u.untcd, u.untnm]));
      const catMap = new Map<string, string>();
      for (const c of catRows) {
        if (!catMap.has(c.pocatcomcd)) catMap.set(c.pocatcomcd, c.pocatcomnm);
      }

      const items = rawItems.map(i => ({
        ...i,
        untnm: unitMap.get(i.untcd ?? "") ?? i.untcd ?? "—",
        pocatcomnm: catMap.get(i.pocatcomcd ?? "") ?? i.pocatcomcd ?? "—",
      }));

      return { items, total };
    }),

  // ── Single booking by pobkncd (for edit mode) ──────────────────────────────
  getById: publicProcedure
    .input(z.object({ pobkncd: z.string() }))
    .query(async ({ ctx, input }) => {
      const header = await ctx.db.mopl.trnpurordbknnfo.findFirst({
        where: { pobkncd: input.pobkncd },
      });
      if (!header) return null;
      const details = await ctx.db.mopl.trnpurordbkndetnfo.findMany({
        where: { pobkncd: input.pobkncd },
        orderBy: { rowid: "asc" },
      });
      return { header, details };
    }),

  // ── Create booking ─────────────────────────────────────────────────────────
  saveBooking: publicProcedure
    .input(
      z.object({
        untcd: z.string(),
        pocatcomcd: z.string(),
        pobkndt: z.string(),
        dlydt: z.string(),
        valdt: z.string(),
        supat: z.string(),
        usrnm: z.string().optional(),
        remark: z.string().optional(),
        cmpcd: z.string(),
        finYear: z.string(),
        orderLines: z.array(
          z.object({
            ptyledcd: z.string(),
            brkrledcd: z.string(),
            qty: z.number(),
            frgttyp: z.string(),
            frgt: z.number(),
            rate: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pobkncd = await generateBookingCode(
        ctx.db.common,
        ctx.db.mopl,
        input.untcd,
        input.cmpcd,
        input.finYear,
      );

      await ctx.db.mopl.trnpurordbknnfo.create({
        data: {
          untcd: input.untcd,
          pobkncd,
          pocatcomcd: input.pocatcomcd,
          pobkndt: new Date(input.pobkndt),
          dlydt: new Date(input.dlydt),
          valdt: new Date(input.valdt),
          supat: input.supat,
          usrnm: input.usrnm ?? "system",
          remark: input.remark ?? "",
        },
      });

      for (const line of input.orderLines) {
        await ctx.db.mopl.trnpurordbkndetnfo.create({
          data: {
            pobkncd,
            ptyledcd: line.ptyledcd,
            brkrledcd: line.brkrledcd,
            nof: 0,
            itmcd: "",
            qty: line.qty,
            wgt: line.qty,
            frgttyp: line.frgttyp,
            ratetyp: "state",
            frgt: line.frgt,
            rate: line.rate,
          },
        });
      }

      return { success: true, pobkncd };
    }),

  // ── Update booking ─────────────────────────────────────────────────────────
  updateBooking: publicProcedure
    .input(
      z.object({
        pobkncd: z.string(),
        pocatcomcd: z.string(),
        dlydt: z.string(),
        valdt: z.string(),
        supat: z.string(),
        remark: z.string().optional(),
        orderLines: z.array(
          z.object({
            ptyledcd: z.string(),
            brkrledcd: z.string(),
            qty: z.number(),
            frgttyp: z.string(),
            frgt: z.number(),
            rate: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.trnpurordbknnfo.updateMany({
        where: { pobkncd: input.pobkncd },
        data: {
          pocatcomcd: input.pocatcomcd,
          dlydt: new Date(input.dlydt),
          valdt: new Date(input.valdt),
          supat: input.supat,
          remark: input.remark ?? "",
        },
      });

      // Replace detail lines
      await ctx.db.mopl.trnpurordbkndetnfo.deleteMany({
        where: { pobkncd: input.pobkncd },
      });
      for (const line of input.orderLines) {
        await ctx.db.mopl.trnpurordbkndetnfo.create({
          data: {
            pobkncd: input.pobkncd,
            ptyledcd: line.ptyledcd,
            brkrledcd: line.brkrledcd,
            nof: 0,
            itmcd: "",
            qty: line.qty,
            wgt: line.qty,
            frgttyp: line.frgttyp,
            ratetyp: "state",
            frgt: line.frgt,
            rate: line.rate,
          },
        });
      }

      return { success: true };
    }),
});