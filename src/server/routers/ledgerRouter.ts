import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

// ─── Supporting data router ────────────────────────────────────────────────────

export const ledgerSupportRouter = router({
  getSupportData: publicProcedure.query(async ({ ctx }) => {
    const [
      rawUnits,
      cities,
      states,
      rawLedgerAccountTypes,
      partyCategories,
      areas,
      employees,
      stations,
      sysLedgers,
    ] = await Promise.all([
      ctx.db.mopl.unit.findMany({
        select: {
          untcd: true,
          untnm: true,
          unttyp: true,
          untcmpcd: true,
          untcomctycd: true,
        },
        orderBy: { untnm: "asc" },
      }),
      ctx.db.common.mstCity.findMany({
        select: { ctycd: true, ctynm: true, ctystcd: true },
      }),
      ctx.db.common.mstState.findMany({ select: { stcd: true, stnm: true } }),
      ctx.db.mopl.mstledctnfo.findMany({ orderBy: { ledctnm: "asc" } }),
      ctx.db.mopl.mstpartycat.findMany({ orderBy: { pcatnm: "asc" } }),
      ctx.db.mopl.mstareanfo.findMany({ orderBy: { areanm: "asc" } }),
      ctx.db.mopl.mstempnfo.findMany({
        select: { empcd: true, empnm: true },
        orderBy: { empnm: "asc" },
      }),
      ctx.db.common.mstStn.findMany({ orderBy: { stnnm: "asc" } }),
      ctx.db.mopl.mstsyslednfo.findMany({
        select: { sysledcd: true, syslednm: true },
        orderBy: { syslednm: "asc" },
      }),
    ]);

    const cityMap = new Map(cities.map((c) => [c.ctycd, c]));
    const stateMap = new Map(states.map((s) => [s.stcd, s]));

    const units = rawUnits.map((u) => {
      const city = u.untcomctycd ? cityMap.get(u.untcomctycd) : undefined;
      const state = city ? stateMap.get(city.ctystcd) : undefined;
      return {
        untcd: u.untcd,
        untnm: u.untnm,
        unttyp: u.unttyp,
        untcmpcd: u.untcmpcd,
        ctycd: city?.ctycd ?? null,
        ctynm: city?.ctynm ?? null,
        stcd: state?.stcd ?? null,
        stnm: state?.stnm ?? null,
      };
    });

    // Attach sysledcd to every ledger account type so the client can filter
    const ledgerAccountTypes = rawLedgerAccountTypes.map((t) => ({
      ...t,
      sysledcd: t.sysledcd ?? null,
    }));

    return {
      units,
      cities,
      states,
      ledgerAccountTypes,
      partyCategories,
      areas,
      employees,
      stations,
      // ── Pass the full sysLedgers list to the client for the combobox ──────
      sysLedgers,
    };
  }),

  getUnits: publicProcedure.query(async ({ ctx }) => {
    const [rawUnits, cities, states] = await Promise.all([
      ctx.db.mopl.unit.findMany({
        select: {
          untcd: true,
          untnm: true,
          unttyp: true,
          untcmpcd: true,
          untcomctycd: true,
        },
        orderBy: { untnm: "asc" },
      }),
      ctx.db.common.mstCity.findMany({
        select: { ctycd: true, ctynm: true, ctystcd: true },
      }),
      ctx.db.common.mstState.findMany({ select: { stcd: true, stnm: true } }),
    ]);

    const cityMap = new Map(cities.map((c) => [c.ctycd, c]));
    const stateMap = new Map(states.map((s) => [s.stcd, s]));

    return rawUnits.map((u) => {
      const city = u.untcomctycd ? cityMap.get(u.untcomctycd) : undefined;
      const state = city ? stateMap.get(city.ctystcd) : undefined;
      return {
        untcd: u.untcd,
        untnm: u.untnm,
        unttyp: u.unttyp,
        untcmpcd: u.untcmpcd,
        ctycd: city?.ctycd ?? null,
        ctynm: city?.ctynm ?? null,
        stcd: state?.stcd ?? null,
        stnm: state?.stnm ?? null,
      };
    });
  }),

  getLedgerAccountTypes: publicProcedure.query(({ ctx }) =>
    ctx.db.mopl.mstledctnfo.findMany({ orderBy: { ledctnm: "asc" } }),
  ),
  getPartyCategories: publicProcedure.query(({ ctx }) =>
    ctx.db.mopl.mstpartycat.findMany({ orderBy: { pcatnm: "asc" } }),
  ),
  getAreas: publicProcedure.query(({ ctx }) =>
    ctx.db.mopl.mstareanfo.findMany({ orderBy: { areanm: "asc" } }),
  ),
  getEmployees: publicProcedure.query(({ ctx }) =>
    ctx.db.mopl.mstempnfo.findMany({
      select: { empcd: true, empnm: true },
      orderBy: { empnm: "asc" },
    }),
  ),
  getCities: publicProcedure.query(({ ctx }) =>
    ctx.db.common.mstCity.findMany({ orderBy: { ctynm: "asc" } }),
  ),
  getStates: publicProcedure.query(({ ctx }) =>
    ctx.db.common.mstState.findMany({ orderBy: { stnm: "asc" } }),
  ),
  getStations: publicProcedure.query(({ ctx }) =>
    ctx.db.common.mstStn.findMany({ orderBy: { stnnm: "asc" } }),
  ),
});

// ─── Zod schemas ───────────────────────────────────────────────────────────────

const LedgerCategoryInput = z.object({ ledctcd: z.string() });

const LedgerInput = z.object({
  lednm: z.string().min(1, "Ledger name is required"),
  ledrptnm: z.string().optional(),
  ledchqnm: z.string().optional(),
  buntcd: z.string().min(1, "Base location is required"),
  ledcrtdt: z.string().min(1, "Creation date is required"),
  // ledtyp now stores the sysledcd value from mstsyslednfo (a plain string)
  ledtyp: z.string().min(1, "Ledger type is required"),
  roundoff: z.enum(["Yes", "No"]).default("No"),
  exmpt: z.string().optional(),
  ledsts: z.enum(["ACTIVE", "INACTIVE", "LOCKED"]).default("ACTIVE"),
  categories: z.array(LedgerCategoryInput).default([]),
  applicableUnits: z.array(z.string()).default([]),
  pcatcd: z.string().optional(),
  per1prfx: z.string().optional(),
  ctper1: z.string().optional(),
  cntno1: z.string().optional(),
  per2prfx: z.string().optional(),
  ctper2: z.string().optional(),
  cntno2: z.string().optional(),
  ledadr1: z.string().optional(),
  areacd: z.string().optional(),
  ctycd: z.string().optional(),
  bilstcd: z.string().optional(),
  pincd: z.string().optional(),
  empcd: z.string().optional(),
  ledadr2: z.string().optional(),
  ctycd2: z.string().optional(),
  shpstcd: z.string().optional(),
  pincd2: z.string().optional(),
  paytyp: z
    .enum(["CASH", "CHEQUE", "A/C TRANSFER", "RTGS", "DD"])
    .default("CASH"),
  bnkledcd: z.string().optional(),
  accno: z.string().optional(),
  rtgsno: z.string().optional(),
  paystncd: z.string().optional(),
  panno: z.string().optional(),
  pandt: z.string().optional(),
  tanno: z.string().optional(),
  tandt: z.string().optional(),
  stxno: z.string().optional(),
  stxdt: z.string().optional(),
  lmtamt: z.number().optional(),
  consdays: z.number().optional(),
  aadharno: z.string().optional(),
  aadharphoto: z.string().optional(),
  pancardphoto: z.string().optional(),
  gstcertphoto: z.string().optional(),
});

// ─── Ledger router ─────────────────────────────────────────────────────────────

export const ledgerRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, offset, search } = input;

      const where = search?.trim()
        ? {
            OR: [
              { lednm: { contains: search } },
              { ledcd: { contains: search } },
            ],
          }
        : undefined;

      const [total, rawItems, units] = await Promise.all([
        ctx.db.mopl.mstlednfo.count({ where }),
        ctx.db.mopl.mstlednfo.findMany({
          where,
          orderBy: { rowid: "desc" },
          skip: offset,
          take: limit,
        }),
        ctx.db.mopl.unit.findMany({ select: { untcd: true, untnm: true } }),
      ]);

      const unitMap = new Map(units.map((u) => [u.untcd, u.untnm]));
      const items = rawItems.map((item) => ({
        ...item,
        buntcd: unitMap.get(item.buntcd!) ?? item.buntcd,
      }));

      return { items, total };
    }),

  getById: publicProcedure
    .input(z.object({ ledcd: z.string() }))
    .query(async ({ ctx, input }) => {
      const [ledger, categories, applicableUnits] = await Promise.all([
        ctx.db.mopl.mstlednfo.findUnique({ where: { ledcd: input.ledcd } }),
        ctx.db.mopl.mstledcatnfo.findMany({ where: { ledcd: input.ledcd } }),
        ctx.db.mopl.mstledunitlink.findMany({ where: { ledcd: input.ledcd } }),
      ]);

      if (!ledger) throw new Error("Ledger not found");

      return {
        ...ledger,
        categories,
        applicableUnits: applicableUnits.map((u) => u.untcd),
      };
    }),

  create: publicProcedure
    .input(LedgerInput)
    .mutation(async ({ ctx, input }) => {
      const ledcd = await generateNextCode(
        ctx.db.mopl,
        "mstlednfo",
        "ledcd",
        "ACCA",
      );
      const {
        categories,
        applicableUnits,
        roundoff,
        bilstcd,
        shpstcd,
        ...rest
      } = input;

      await ctx.db.mopl.$transaction(async (tx) => {
        await tx.mstlednfo.create({
          data: {
            ledcd,
            ledcrtdt: rest.ledcrtdt ? new Date(rest.ledcrtdt) : new Date(),
            lednm: rest.lednm,
            ledrptnm: rest.ledrptnm,
            ledchqnm: rest.ledchqnm,
            buntcd: rest.buntcd,
            ledtyp: rest.ledtyp, // now stores sysledcd string
            rof: roundoff === "Yes" ? 1 : 0,
            exmpt: rest.exmpt,
            ledsts: rest.ledsts,
            pcatcd: rest.pcatcd,
            per1prfx: rest.per1prfx,
            ctper1: rest.ctper1,
            cntno1: rest.cntno1,
            per2prfx: rest.per2prfx,
            ctper2: rest.ctper2,
            cntno2: rest.cntno2,
            ledadr1: rest.ledadr1,
            areacd: rest.areacd,
            ctycd: rest.ctycd,
            loccd: bilstcd,
            pincd: rest.pincd,
            empcd: rest.empcd,
            ledadr2: rest.ledadr2,
            ctycd2: rest.ctycd2,
            stncd: shpstcd,
            pincd2: rest.pincd2,
            paytyp: rest.paytyp,
            bnkledcd: rest.bnkledcd,
            accno: rest.accno,
            rtgsno: rest.rtgsno,
            paystncd: rest.paystncd,
            panno: rest.panno,
            pandt: rest.pandt ? new Date(rest.pandt) : undefined,
            tanno: rest.tanno,
            tandt: rest.tandt ? new Date(rest.tandt) : undefined,
            stxno: rest.stxno,
            stxdt: rest.stxdt ? new Date(rest.stxdt) : undefined,
            lmtamt: rest.lmtamt,
            consdays: rest.consdays,
            aadharno: rest.aadharno ?? "",
            aadharphoto: rest.aadharphoto ?? "",
            pancardphoto: rest.pancardphoto ?? "",
            gstcertphoto: rest.gstcertphoto ?? "",
          },
        });

        if (categories.length > 0)
          await tx.mstledcatnfo.createMany({
            data: categories.map((c) => ({ ledcd, ledctcd: c.ledctcd })),
          });
        if (applicableUnits.length > 0)
          await tx.mstledunitlink.createMany({
            data: applicableUnits.map((untcd) => ({ ledcd, untcd })),
          });
      });

      return { success: true, ledcd };
    }),

  update: publicProcedure
    .input(LedgerInput.extend({ ledcd: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const {
        ledcd,
        categories,
        applicableUnits,
        roundoff,
        bilstcd,
        shpstcd,
        ...rest
      } = input;

      await ctx.db.mopl.$transaction(async (tx) => {
        await Promise.all([
          tx.mstlednfo.update({
            where: { ledcd },
            data: {
              ledcrtdt: rest.ledcrtdt ? new Date(rest.ledcrtdt) : undefined,
              lednm: rest.lednm,
              ledrptnm: rest.ledrptnm,
              ledchqnm: rest.ledchqnm,
              buntcd: rest.buntcd,
              ledtyp: rest.ledtyp, // now stores sysledcd string
              rof: roundoff === "Yes" ? 1 : 0,
              exmpt: rest.exmpt,
              ledsts: rest.ledsts,
              pcatcd: rest.pcatcd,
              per1prfx: rest.per1prfx,
              ctper1: rest.ctper1,
              cntno1: rest.cntno1,
              per2prfx: rest.per2prfx,
              ctper2: rest.ctper2,
              cntno2: rest.cntno2,
              ledadr1: rest.ledadr1,
              areacd: rest.areacd,
              ctycd: rest.ctycd,
              loccd: bilstcd,
              pincd: rest.pincd,
              empcd: rest.empcd,
              ledadr2: rest.ledadr2,
              ctycd2: rest.ctycd2,
              stncd: shpstcd,
              pincd2: rest.pincd2,
              paytyp: rest.paytyp,
              bnkledcd: rest.bnkledcd,
              accno: rest.accno,
              rtgsno: rest.rtgsno,
              paystncd: rest.paystncd,
              panno: rest.panno,
              pandt: rest.pandt ? new Date(rest.pandt) : undefined,
              tanno: rest.tanno,
              tandt: rest.tandt ? new Date(rest.tandt) : undefined,
              stxno: rest.stxno,
              stxdt: rest.stxdt ? new Date(rest.stxdt) : undefined,
              lmtamt: rest.lmtamt,
              consdays: rest.consdays,
              aadharno: rest.aadharno ?? "",
              aadharphoto: rest.aadharphoto ?? "",
              pancardphoto: rest.pancardphoto ?? "",
              gstcertphoto: rest.gstcertphoto ?? "",
            },
          }),
          tx.mstledcatnfo.deleteMany({ where: { ledcd } }),
          tx.mstledunitlink.deleteMany({ where: { ledcd } }),
        ]);

        await Promise.all([
          categories.length > 0
            ? tx.mstledcatnfo.createMany({
                data: categories.map((c) => ({ ledcd, ledctcd: c.ledctcd })),
              })
            : Promise.resolve(),
          applicableUnits.length > 0
            ? tx.mstledunitlink.createMany({
                data: applicableUnits.map((untcd) => ({ ledcd, untcd })),
              })
            : Promise.resolve(),
        ]);
      });

      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ ledcd: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.$transaction(async (tx) => {
        await Promise.all([
          tx.mstledcatnfo.deleteMany({ where: { ledcd: input.ledcd } }),
          tx.mstledunitlink.deleteMany({ where: { ledcd: input.ledcd } }),
        ]);
        await tx.mstlednfo.delete({ where: { ledcd: input.ledcd } });
      });
      return { success: true };
    }),
  checkDuplicates: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        excludeLedcd: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.name.trim().length < 2) return { matches: [] };

      const all = await ctx.db.mopl.mstlednfo.findMany({
        select: { ledcd: true, lednm: true },
        where: input.excludeLedcd
          ? { ledcd: { not: input.excludeLedcd } }
          : undefined,
      });

      const candidates = all.filter((l) => !!l.lednm) as {
        ledcd: string;
        lednm: string;
      }[];

      const Fuse = (await import("fuse.js")).default;

      const fuse = new Fuse(candidates, {
        keys: ["lednm"],
        threshold: 0.35,
        distance: 200,
        minMatchCharLength: 2,
        includeScore: true,
        ignoreLocation: true,
      });

      // Search the full phrase + each individual word, then union by ledcd
      const searchTerms = [
        input.name.trim(),
        ...input.name
          .trim()
          .split(/\s+/)
          .filter((w) => w.length >= 2),
      ];

      const seen = new Set<string>();
      const results: { ledcd: string; lednm: string }[] = [];

      for (const term of searchTerms) {
        for (const r of fuse.search(term)) {
          if (!seen.has(r.item.ledcd)) {
            seen.add(r.item.ledcd);
            results.push({ ledcd: r.item.ledcd, lednm: r.item.lednm });
          }
        }
      }

      return { matches: results.slice(0, 20) };
    }),
});
