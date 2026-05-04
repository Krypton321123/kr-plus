import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

// Bank system ledger codes from mstsyslednfo:
// 1 = BANK ACCOUNTS, 2 = BANK OCC A/C, 3 = BANK OD A/C
const BANK_SYSLED_CODES = ["1", "2", "3"];

export const depotBankRouter = router({
  // ── All units (locations) for the combobox ──────────────────────────────
  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
      orderBy: { untnm: "asc" },
    });
  }),

  // ── Bank ledgers: ledgers whose category's sysledcd is 1/2/3 ────────────
  // Path: mstledcatnfo → mstledctnfo.sysledcd IN ['1','2','3'] → mstlednfo
  getBankLedgers: publicProcedure.query(async ({ ctx }) => {
    // Step 1: get all ledct codes that map to bank system ledgers
    const bankLedctRows = await ctx.db.mopl.mstledctnfo.findMany({
      where: { sysledcd: { in: BANK_SYSLED_CODES } },
      select: { ledctcd: true },
    });
    const bankLedctCodes = bankLedctRows.map((r) => r.ledctcd);

    if (bankLedctCodes.length === 0) return [];

    // Step 2: find ledcds that have at least one of these ledct codes
    const catLinks = await ctx.db.mopl.mstledcatnfo.findMany({
      where: { ledctcd: { in: bankLedctCodes } },
      select: { ledcd: true },
    });
    const bankLedcds = [...new Set(catLinks.map((r) => r.ledcd))];

    if (bankLedcds.length === 0) return [];

    // Step 3: fetch the actual ledger records
    const ledgers = await ctx.db.mopl.mstlednfo.findMany({
      where: { ledcd: { in: bankLedcds } },
      select: { ledcd: true, lednm: true, accno: true, buntcd: true },
      orderBy: { lednm: "asc" },
    });

    // Enrich with the HO unit name (buntcd → Unit)
    const untcds = [...new Set(ledgers.map((l) => l.buntcd).filter(Boolean) as string[])];
    const units = untcds.length
      ? await ctx.db.mopl.unit.findMany({
          where: { untcd: { in: untcds } },
          select: { untcd: true, untnm: true },
        })
      : [];
    const unitMap = new Map(units.map((u) => [u.untcd, u.untnm]));

    return ledgers.map((l) => ({
      ledcd: l.ledcd,
      // Display: "Ledger Name Ac. No. XXXX" — mirrors the original spring boot UI
      displayName: l.accno
        ? `${l.lednm} ${l.accno}`
        : (l.lednm ?? l.ledcd),
      hountcd: l.buntcd ?? "",
      hountnm: l.buntcd ? (unitMap.get(l.buntcd) ?? l.buntcd) : "",
    }));
  }),

  // ── Get saved bank rows for a given unit ────────────────────────────────
  getByUnit: publicProcedure
    .input(z.object({ untcd: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.mopl.mstuntbanknfo.findMany({
        where: { untcd: input.untcd },
        orderBy: { rowid: "asc" },
      });

      if (rows.length === 0) return [];

      // Enrich with ledger display names
      const ledcds = [...new Set(rows.map((r) => r.bankledcd))];
      const ledgers = await ctx.db.mopl.mstlednfo.findMany({
        where: { ledcd: { in: ledcds } },
        select: { ledcd: true, lednm: true, accno: true, buntcd: true },
      });

      // Enrich with HO unit names
      const hountcds = [
        ...new Set([
          ...rows.map((r) => r.hountcd),
          ...ledgers.map((l) => l.buntcd).filter(Boolean) as string[],
        ]),
      ];
      const units = hountcds.length
        ? await ctx.db.mopl.unit.findMany({
            where: { untcd: { in: hountcds } },
            select: { untcd: true, untnm: true },
          })
        : [];
      const unitMap = new Map(units.map((u) => [u.untcd, u.untnm]));

      const ledgerMap = new Map(
        ledgers.map((l) => [
          l.ledcd,
          {
            displayName: l.accno ? `${l.lednm} ${l.accno}` : (l.lednm ?? l.ledcd),
            hountcd: l.buntcd ?? "",
            hountnm: l.buntcd ? (unitMap.get(l.buntcd) ?? l.buntcd) : "",
          },
        ])
      );

      return rows.map((r) => ({
        rowid: r.rowid,
        bankledcd: r.bankledcd,
        hountcd: r.hountcd,
        displayName: ledgerMap.get(r.bankledcd)?.displayName ?? r.bankledcd,
        hountnm: unitMap.get(r.hountcd) ?? r.hountcd,
      }));
    }),

  // ── Save: replace all rows for a unit ───────────────────────────────────
  save: publicProcedure
    .input(
      z.object({
        untcd: z.string().min(1),
        frmdt: z.string().min(1), // ISO date string
        rows: z.array(
          z.object({
            bankledcd: z.string().min(1),
            hountcd: z.string().min(1),
          })
        ),
        entusrnm: z.string().default("SYSTEM"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { untcd, frmdt, rows, entusrnm } = input;
      const entdt = new Date();
      const frmdtDate = new Date(frmdt);

      // Full replace strategy — same pattern as ledger categories
      await ctx.db.mopl.mstuntbanknfo.deleteMany({ where: { untcd } });

      if (rows.length > 0) {
        // Generate a unique untwbcd for each row sequentially.
        // We call generateNextCode once per row so each gets its own
        // incremented code (LWBA00001, LWBA00002, …) even within one save.
        const rowsWithCodes = [];
        for (const r of rows) {
          const untwbcd = await generateNextCode(
            ctx.db.mopl,
            "mstuntbanknfo",
            "untwbcd",
            "LWBA"
          );
          rowsWithCodes.push({
            untcd,
            untwbcd,
            bankledcd: r.bankledcd,
            hountcd: r.hountcd,
            frmdt: frmdtDate,
            entusrnm,
            entdt,
          });
        }

        await ctx.db.mopl.mstuntbanknfo.createMany({ data: rowsWithCodes });
      }

      return { success: true };
    }),
});