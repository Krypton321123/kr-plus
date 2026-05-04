import { z } from "zod";
import { publicProcedure, router } from "../trpc";

// ─── Helper: resolve active fin year from DB ──────────────────────────────────
async function resolveFinYear(commonDb: any, finyear: string): Promise<string> {
  const rec = await commonDb.mstfinyear.findFirst({
    where: { rowid: finyear },
  });
  return rec?.finyear;
}

// ─── Helper: generate audit code ──────────────────────────────────────────────
async function generateAuditCode(
  commonDb: any,
  moplDb:   any,
  untcd:    string,
  cmpcd:    string,
  finyear:  string
): Promise<string> {
  const finYear = await resolveFinYear(commonDb, finyear);
  const unit    = await moplDb.unit.findFirst({ where: { untcd } });
  const untShnm = (unit?.untshnm ?? untcd).toUpperCase().replace(/\s+/g, "");
  const finYearSuffix = finYear.slice(-2);
  const cmp   = await commonDb.mstcmpnfo.findFirst({ where: { cmpcd } });
  const vchCd = ((cmp as any)?.cmpvchcdno ?? "A").toString().charAt(0).toUpperCase();
  const base  = `${untShnm}POA${finYearSuffix}${vchCd}`;

  const last = await moplDb.trnpurordbknauditnfo.findFirst({
    where:   { pobknauditcd: { startsWith: base } },
    orderBy: { rowid: "desc" },
    select:  { pobknauditcd: true },
  });

  let nextNum = 1;
  if (last?.pobknauditcd) {
    const parsed = parseInt(last.pobknauditcd.slice(base.length), 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }
  return `${base}${String(nextNum).padStart(4, "0")}`;
}

// ─── Helper: generate PO order code ───────────────────────────────────────────
async function generateOrderCode(
  commonDb: any,
  moplDb:   any,
  untcd:    string,
  cmpcd:    string,
  finyear:  string
): Promise<string> {
  const finYear = await resolveFinYear(commonDb, finyear);
  const unit    = await moplDb.unit.findFirst({ where: { untcd } });
  const untShnm = (unit?.untshnm ?? untcd).toUpperCase().replace(/\s+/g, "");
  const finYearSuffix = finYear.slice(-2);
  const cmp   = await commonDb.mstcmpnfo.findFirst({ where: { cmpcd } });
  const vchCd = ((cmp as any)?.cmpvchcdno ?? "A").toString().charAt(0).toUpperCase();
  const base  = `${untShnm}PON${finYearSuffix}${vchCd}`;

  const last = await moplDb.trnpurordnfo.findFirst({
    where:   { pocd: { startsWith: base } },
    orderBy: { rowid: "desc" },
    select:  { pocd: true },
  });

  let nextNum = 1;
  if (last?.pocd) {
    const parsed = parseInt(last.pocd.slice(base.length), 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }
  return `${base}${String(nextNum).padStart(4, "0")}`;
}

// ─── Shared: resolve + shape trnpurordnfo rows into print-ready objects ───────
//
// One element in the returned array = one print page (one party, one PO).
// All lookups are batched — no N+1 queries.
async function resolveAndShapePORows(ctx: any, poHeaders: any[]) {
  if (poHeaders.length === 0) return [];

  const pocds = poHeaders.map(h => h.pocd).filter(Boolean) as string[];

  // ── 1. Detail lines ───────────────────────────────────────────────────────
  const allDetails = await ctx.db.mopl.trnpurorddetnfo.findMany({
    where:   { pocd: { in: pocds } },
    orderBy: { rowid: "asc" },
  });

  // ── 2. Ledger names (party + broker) ─────────────────────────────────────
  const ledcds = [
    ...new Set([
      ...poHeaders.map(h => h.poptyledcd),
      ...poHeaders.map(h => h.pobrkledcd),
    ].filter(Boolean)),
  ] as string[];
  const ledgers = await ctx.db.mopl.mstlednfo.findMany({
    where:  { ledcd: { in: ledcds } },
    select: { ledcd: true, lednm: true, ledadr1: true, ctycd: true },
  });
  const ledMap = new Map(ledgers.map((l: any) => [l.ledcd, l]));

  // ── 3. Item names ─────────────────────────────────────────────────────────
  const itmcds = [
    ...new Set(allDetails.map((d: any) => d.poitmcd).filter(Boolean)),
  ] as string[];
  const itmRows = await ctx.db.mopl.mstitmnfo.findMany({
    where:  { itrmcd: { in: itmcds } },
    select: { itrmcd: true, itmnm: true },
  });
  const itmMap = new Map(itmRows.map((i: any) => [i.itrmcd, i.itmnm]));

  // ── 4. Category names + conditions (by pocatcomcd) ────────────────────────
  const pocatcomcds = [
    ...new Set(poHeaders.map(h => h.pocatcomcd).filter(Boolean)),
  ] as string[];
  const [catRows, condRows] = await Promise.all([
    ctx.db.mopl.mstpocatcomnfo.findMany({
      where:   { pocatcomcd: { in: pocatcomcds } },
      orderBy: { rowid: "desc" },
      select:  { pocatcomcd: true, pocatcomnm: true },
    }),
    ctx.db.mopl.mstpocatcomdetnfo.findMany({
      where:   { pocatcomcd: { in: pocatcomcds } },
      orderBy: { rowid: "asc" },
    }),
  ]);
  const catMap = new Map<string, string>();
  for (const c of catRows) {
    if (!catMap.has(c.pocatcomcd)) catMap.set(c.pocatcomcd, c.pocatcomnm);
  }
  const condBycat = new Map<string, any[]>();
  for (const c of condRows) {
    if (!condBycat.has(c.pocatcomcd)) condBycat.set(c.pocatcomcd, []);
    condBycat.get(c.pocatcomcd)!.push(c);
  }

  // ── 5. Unit names ─────────────────────────────────────────────────────────
  const untcds = [
    ...new Set(poHeaders.map(h => h.untcd).filter(Boolean)),
  ] as string[];
  const unitRows = await ctx.db.mopl.unit.findMany({
    where:  { untcd: { in: untcds } },
    select: { untcd: true, untnm: true },
  });
  const unitMap = new Map(unitRows.map((u: any) => [u.untcd, u]));

  // ── 6. Audit → booking code mapping (for the Booking No. field) ───────────
  const auditCds = [
    ...new Set(poHeaders.map(h => h.pobknauditcd).filter(Boolean)),
  ] as string[];
  const auditRows = await ctx.db.mopl.trnpurordbknauditnfo.findMany({
    where:  { pobknauditcd: { in: auditCds } },
    select: { pobknauditcd: true, pobkncd: true },
  });
  const auditMap = new Map(auditRows.map((a: any) => [a.pobknauditcd, a]));

  // ── 7. Group detail lines by pocd ─────────────────────────────────────────
  const detsByPocd = new Map<string, any[]>();
  for (const d of allDetails) {
    const key = d.pocd ?? "";
    if (!detsByPocd.has(key)) detsByPocd.set(key, []);
    detsByPocd.get(key)!.push(d);
  }

  // ── 8. Shape — one element per PO header row ──────────────────────────────
  return poHeaders.map(h => {
    const partyLed  = ledMap.get(h.poptyledcd ?? "") as any;
    const brokerLed = ledMap.get(h.pobrkledcd  ?? "") as any;
    const audit     = auditMap.get(h.pobknauditcd ?? "") as any;
    const details   = (detsByPocd.get(h.pocd ?? "") ?? []).map((d: any) => ({
      ...d,
      itmnm: itmMap.get(d.poitmcd ?? "") ?? d.poitmcd ?? "—",
    }));

    return {
      poHeader:     h,
      partyName:    partyLed?.lednm   ?? h.poptyledcd ?? "—",
      partyAddr:    partyLed?.ledadr1 ?? "",
      partyCity:    partyLed?.ctycd   ?? "",
      brokerName:   brokerLed?.lednm  ?? h.pobrkledcd ?? "—",
      details,
      categoryName: catMap.get(h.pocatcomcd ?? "") ?? "",
      conditions:   condBycat.get(h.pocatcomcd ?? "") ?? [],
      unit:         unitMap.get(h.untcd ?? "") ?? null,
      auditHeader:  audit ?? null,
      pobkncd:      audit?.pobkncd ?? "",
    };
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const purOrderAuditRouter = router({

  // ── Units list ───────────────────────────────────────────────────────────
  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({ orderBy: { untnm: "asc" } });
  }),

  // ── All parties that have at least one PO in trnpurordnfo ────────────────
  getParties: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.mopl.trnpurordnfo.findMany({
      where:    { poptyledcd: { not: null } },
      select:   { poptyledcd: true },
      distinct: ["poptyledcd"],
    });
    const ledcds = rows.map((r: any) => r.poptyledcd).filter(Boolean) as string[];
    if (ledcds.length === 0) return [];
    const ledgers = await ctx.db.mopl.mstlednfo.findMany({
      where:   { ledcd: { in: ledcds } },
      select:  { ledcd: true, lednm: true },
      orderBy: { lednm: "asc" },
    });
    return ledgers.map((l: any) => ({ ledcd: l.ledcd, lednm: l.lednm ?? l.ledcd }));
  }),

  // ── Bookings for selected unit (combobox) ────────────────────────────────
  getBookingsByUnit: publicProcedure
    .input(z.object({ untcd: z.string() }))
    .query(async ({ ctx, input }) => {
      const bookings = await ctx.db.mopl.trnpurordbknnfo.findMany({
        where:   { untcd: input.untcd },
        orderBy: { rowid: "desc" },
      });
      if (bookings.length === 0) return [];

      const pocatcomcds = [
        ...new Set(bookings.map((b: any) => b.pocatcomcd).filter(Boolean)),
      ] as string[];

      const catRows = await ctx.db.mopl.mstpocatcomnfo.findMany({
        where:   { pocatcomcd: { in: pocatcomcds } },
        orderBy: { rowid: "desc" },
        select:  { pocatcomcd: true, pocatcomnm: true },
      });
      const catMap = new Map<string, string>();
      for (const c of catRows) {
        if (!catMap.has(c.pocatcomcd)) catMap.set(c.pocatcomcd, c.pocatcomnm);
      }

      return bookings.map((b: any) => ({
        ...b,
        pocatcomnm: catMap.get(b.pocatcomcd ?? "") ?? b.pocatcomcd ?? "—",
      }));
    }),

  // ── Full booking detail (form load) ──────────────────────────────────────
  getBookingDetail: publicProcedure
    .input(z.object({ pobkncd: z.string() }))
    .query(async ({ ctx, input }) => {
      const header = await ctx.db.mopl.trnpurordbknnfo.findFirst({
        where: { pobkncd: input.pobkncd },
      });
      if (!header) return null;

      const details = await ctx.db.mopl.trnpurordbkndetnfo.findMany({
        where:   { pobkncd: input.pobkncd },
        orderBy: { rowid: "asc" },
      });

      const bargain = header.pocatcomcd
        ? await ctx.db.mopl.mstpurbrgnfo.findFirst({
            where:   { pocatcomcd: header.pocatcomcd },
            orderBy: { rowid: "desc" },
          })
        : null;

      let bookedWgt = 0;
      if (header.pocatcomcd) {
        const allBookings = await ctx.db.mopl.trnpurordbknnfo.findMany({
          where:  { pocatcomcd: header.pocatcomcd },
          select: { pobkncd: true },
        });
        for (const b of allBookings) {
          if (!b.pobkncd) continue;
          const dets = await ctx.db.mopl.trnpurordbkndetnfo.findMany({
            where:  { pobkncd: b.pobkncd },
            select: { qty: true },
          });
          bookedWgt += dets.reduce((s: number, d: any) => s + (d.qty ?? 0), 0);
        }
      }

      const conditions = header.pocatcomcd
        ? await ctx.db.mopl.mstpocatcomdetnfo.findMany({
            where:   { pocatcomcd: header.pocatcomcd },
            orderBy: { rowid: "asc" },
          })
        : [];

      const ledcds = [
        ...new Set([
          ...details.map((d: any) => d.ptyledcd),
          ...details.map((d: any) => d.brkrledcd),
        ].filter(Boolean)),
      ] as string[];
      const ledgers = await ctx.db.mopl.mstlednfo.findMany({
        where:  { ledcd: { in: ledcds } },
        select: { ledcd: true, lednm: true },
      });
      const ledMap = new Map(ledgers.map((l: any) => [l.ledcd, l.lednm]));

      const totalBargainWgt = bargain?.brgqty ?? 0;

      return {
        header,
        details: details.map((d: any) => ({
          ...d,
          partyName:  ledMap.get(d.ptyledcd  ?? "") ?? d.ptyledcd  ?? "—",
          brokerName: ledMap.get(d.brkrledcd ?? "") ?? d.brkrledcd ?? "—",
        })),
        bargainRate:     bargain?.brgrate ?? null,
        totalBargainWgt,
        bookedWgt,
        pendingWgt:      totalBargainWgt - bookedWgt,
        conditions,
      };
    }),

  // ── All audits (paginated list) ───────────────────────────────────────────
  getAll: publicProcedure
    .input(
      z.object({
        limit:  z.number().default(15),
        offset: z.number().default(0),
        search: z.string().optional(),
        untcd:  z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.untcd)  where.untcd = input.untcd;
      if (input.search) {
        where.OR = [
          { pobknauditcd: { contains: input.search } },
          { pobkncd:      { contains: input.search } },
        ];
      }

      const [rawItems, total] = await Promise.all([
        ctx.db.mopl.trnpurordbknauditnfo.findMany({
          where, orderBy: { rowid: "desc" }, take: input.limit, skip: input.offset,
        }),
        ctx.db.mopl.trnpurordbknauditnfo.count({ where }),
      ]);

      if (rawItems.length === 0) return { items: [], total: 0 };

      const untcds   = [...new Set(rawItems.map((i: any) => i.untcd).filter(Boolean))]   as string[];
      const pobkncds = [...new Set(rawItems.map((i: any) => i.pobkncd).filter(Boolean))] as string[];

      const [unitRows, bookingRows] = await Promise.all([
        ctx.db.mopl.unit.findMany({
          where:  { untcd: { in: untcds } },
          select: { untcd: true, untnm: true },
        }),
        ctx.db.mopl.trnpurordbknnfo.findMany({
          where:  { pobkncd: { in: pobkncds } },
          select: { pobkncd: true, pocatcomcd: true },
        }),
      ]);

      const unitMap   = new Map(unitRows.map((u: any) => [u.untcd, u.untnm]));
      const bknCatMap = new Map(bookingRows.map((b: any) => [b.pobkncd, b.pocatcomcd]));

      const pocatcomcds = [...new Set([...bknCatMap.values()].filter(Boolean))] as string[];
      const catRows = await ctx.db.mopl.mstpocatcomnfo.findMany({
        where:   { pocatcomcd: { in: pocatcomcds } },
        orderBy: { rowid: "desc" },
        select:  { pocatcomcd: true, pocatcomnm: true },
      });
      const catMap = new Map<string, string>();
      for (const c of catRows) {
        if (!catMap.has(c.pocatcomcd)) catMap.set(c.pocatcomcd, c.pocatcomnm);
      }

      const items = rawItems.map((i: any) => {
        const catcd = bknCatMap.get(i.pobkncd ?? "") ?? "";
        return {
          ...i,
          untnm:      unitMap.get(i.untcd ?? "") ?? i.untcd ?? "—",
          pocatcomnm: catMap.get(catcd)          ?? catcd   ?? "—",
        };
      });

      return { items, total };
    }),

  // ── Single audit row-print (print icon in the list) ──────────────────────
  // Queries trnpurordnfo by pobknauditcd — one page per PO row (one per party).
  getPOsByAuditcd: publicProcedure
    .input(z.object({ pobknauditcd: z.string() }))
    .query(async ({ ctx, input }) => {
      const poHeaders = await ctx.db.mopl.trnpurordnfo.findMany({
        where:   { pobknauditcd: input.pobknauditcd },
        orderBy: { rowid: "asc" },
      });
      return resolveAndShapePORows(ctx, poHeaders);
    }),

  // ── Bulk print: query trnpurordnfo DIRECTLY ───────────────────────────────
  //
  // Returns one resolved print record per trnpurordnfo row matching the
  // filter.  The audit layer is completely bypassed — each row is already
  // scoped to a single party so there is no "clumping" issue.
  //
  // Modes
  //   date   – filter by podt on trnpurordnfo
  //   record – 1-based offset into trnpurordnfo ordered by rowid DESC
  //            fromRecord=1, toRecord=10 → the 10 most recent PO rows
  //
  // ptyledcd (party) is optional in both modes.
  getPOsForPrint: publicProcedure
    .input(
      z.object({
        untcd:      z.string().optional(),
        ptyledcd:   z.string().optional(),
        // date mode
        fromDate:   z.string().optional(),
        toDate:     z.string().optional(),
        // record mode (1-based, newest-first)
        fromRecord: z.number().int().min(1).optional(),
        toRecord:   z.number().int().min(1).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const isRecordMode = input.fromRecord !== undefined || input.toRecord !== undefined;

      const where: any = {};
      if (input.untcd)    where.untcd      = input.untcd;
      if (input.ptyledcd) where.poptyledcd = input.ptyledcd;

      if (!isRecordMode && (input.fromDate || input.toDate)) {
        where.podt = {};
        if (input.fromDate) where.podt.gte = new Date(input.fromDate);
        if (input.toDate) {
          const to = new Date(input.toDate);
          to.setHours(23, 59, 59, 999);
          where.podt.lte = to;
        }
      }

      let poHeaders: any[];

      if (isRecordMode) {
        const skip = (input.fromRecord ?? 1) - 1;           // 0-based
        const take = (input.toRecord ?? input.fromRecord ?? 1) - skip;
        if (take <= 0) return [];
        poHeaders = await ctx.db.mopl.trnpurordnfo.findMany({
          where,
          orderBy: { rowid: "desc" },
          skip,
          take,
        });
      } else {
        poHeaders = await ctx.db.mopl.trnpurordnfo.findMany({
          where,
          orderBy: { rowid: "asc" },
        });
      }

      return resolveAndShapePORows(ctx, poHeaders);
    }),

  // ── Submit audit (approve or reject) ─────────────────────────────────────
  submitAudit: publicProcedure
    .input(
      z.object({
        finyear:      z.string(),
        untcd:        z.string(),
        pobkncd:      z.string(),
        pobknauditdt: z.string(),
        usrnm:        z.string().optional(),
        sts:          z.enum(["Approved", "Reject"]),
        reason:       z.string().optional(),
        cmpcd:        z.string(),
        orderLines: z.array(
          z.object({
            ptyledcd:  z.string(),
            brkrledcd: z.string(),
            nof:       z.number().optional(),
            itmcd:     z.string().optional(),
            qty:       z.number(),
            wgt:       z.number(),
            frgttyp:   z.string(),
            ratetyp:   z.string().optional(),
            frgt:      z.number(),
            rate:      z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pobknauditcd = await generateAuditCode(
        ctx.db.common, ctx.db.mopl, input.untcd, input.cmpcd, input.finyear,
      );

      await ctx.db.mopl.trnpurordbknauditnfo.create({
        data: {
          untcd:        input.untcd,
          pobknauditcd,
          pobknauditdt: new Date(input.pobknauditdt),
          pobkncd:      input.pobkncd,
          usrnm:        input.usrnm ?? "system",
          sts:          input.sts,
          reason:       input.reason ?? "",
        },
      });

      for (const line of input.orderLines) {
        await ctx.db.mopl.trnpurordbknauditdetnfo.create({
          data: {
            pobknauditcd,
            ptyledcd:  line.ptyledcd,
            brkrledcd: line.brkrledcd,
            nof:       line.nof ?? 0,
            itmcd:     line.itmcd ?? "",
            qty:       line.qty,
            wgt:       line.wgt,
            frgttyp:   line.frgttyp,
            ratetyp:   line.ratetyp ?? "state",
            frgt:      line.frgt,
            rate:      line.rate,
          },
        });
      }

      if (input.sts === "Approved") {
        const booking = await ctx.db.mopl.trnpurordbknnfo.findFirst({
          where: { pobkncd: input.pobkncd },
        });
        const bargain = booking?.pocatcomcd
          ? await ctx.db.mopl.mstpurbrgnfo.findFirst({
              where:   { pocatcomcd: booking.pocatcomcd },
              orderBy: { rowid: "desc" },
            })
          : null;
        const poitmcd = bargain?.itmcd ?? "";

        for (const line of input.orderLines) {
          const pocd = await generateOrderCode(
            ctx.db.common, ctx.db.mopl, input.untcd, input.cmpcd, input.finyear,
          );

          await ctx.db.mopl.trnpurordnfo.create({
            data: {
              untcd:        input.untcd,
              pocd,
              pocatcomcd:   booking?.pocatcomcd ?? "",
              podt:         new Date(input.pobknauditdt),
              potyp:        booking?.supat ?? "",
              posupat:      booking?.supat ?? "",
              poptyledcd:   line.ptyledcd,
              pobrkledcd:   line.brkrledcd,
              pobknauditcd,
              remark:       input.reason ?? "",
              dlydt:        booking?.dlydt ?? null,
              validdt:      booking?.valdt ?? null,
              socd:         booking?.socd  ?? null,
              pofrttyp:     line.frgttyp,
              frgt:         line.frgt,
            },
          });

          await ctx.db.mopl.trnpurorddetnfo.create({
            data: {
              pocd,
              poitmcd,
              poqty:   line.qty,
              powgt:   line.wgt,
              porate:  line.rate,
              ratetyp: line.ratetyp ?? "state",
            },
          });
        }
      }

      return { success: true, pobknauditcd };
    }),
});