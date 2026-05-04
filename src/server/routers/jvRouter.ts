import { z } from "zod";
import { publicProcedure, router } from "../trpc";

// ─── Journal Voucher Router ───────────────────────────────────────────────────

export const jvRouter = router({
  // ── Lookups ────────────────────────────────────────────────────────────────

  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({
      select: { rowid: true, untcd: true, untnm: true, untshnm: true },
      orderBy: { untnm: "asc" },
    });
  }),

  // Returns first 25 ledgers, or filters by search term if provided
  searchLedgers: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const q = input.query.trim();
      return ctx.db.mopl.mstlednfo.findMany({
        select: { rowid: true, ledcd: true, lednm: true },
        where: q
          ? {
              OR: [{ lednm: { contains: q } }, { ledcd: { contains: q } }],
            }
          : undefined,
        orderBy: { lednm: "asc" },
        take: 25,
      });
    }),

  // ── Company info (for voucher code generation) ─────────────────────────────
  // Reads cmpvchcdno from mstcmpnfo in common db
  getCompanyVchChar: publicProcedure
    .input(z.object({ cmpcd: z.string() }))
    .query(async ({ ctx, input }) => {
      const cmp = await ctx.db.common.mstcmpnfo.findFirst({
        where: { cmpcd: input.cmpcd },
        select: { cmpvchcdno: true },
      });
      return cmp?.cmpvchcdno ?? "A";
    }),

  // ── Financial year info ────────────────────────────────────────────────────
  getFinYear: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .query(async ({ ctx, input }) => {
      const fy = await ctx.db.common.mstfinyear.findFirst({
        where: { rowid: BigInt(input.rowid) },
        select: { finyear: true, startdate: true, enddate: true },
      });
      return fy ?? null;
    }),

  // ── Generate next voucher code ─────────────────────────────────────────────
  // prefix = e.g. "AGRJVR27A"
  // Finds the last jvcd starting with that prefix and increments
  getNextVoucherNo: publicProcedure
    .input(z.object({ prefix: z.string() }))
    .query(async ({ ctx, input }) => {
      // Find the last voucher with this prefix
      const last = await ctx.db.mopl.trnjvnfo.findFirst({
        where: { jvcd: { startsWith: input.prefix } },
        orderBy: { rowid: "desc" },
        select: { jvcd: true },
      });

      if (!last) {
        return `${input.prefix}0001`;
      }

      // Extract the numeric suffix (last 4 digits)
      const suffix = last.jvcd.slice(input.prefix.length);
      const num = parseInt(suffix, 10);
      const next = isNaN(num) ? 1 : num + 1;
      return `${input.prefix}${String(next).padStart(4, "0")}`;
    }),

  // ── List all JV headers (for the history table) ────────────────────────────
  getAll: publicProcedure.query(async ({ ctx }) => {
    const jvs = await ctx.db.mopl.trnjvnfo.findMany({
      orderBy: { rowid: "desc" },
    });
    return jvs;
  }),

  // ── Get details for a single JV ────────────────────────────────────────────
  getDetails: publicProcedure
    .input(z.object({ jvcd: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.mopl.trnjvdetnfo.findMany({
        where: { jvcd: input.jvcd },
        orderBy: { rowid: "asc" },
      });

      if (rows.length === 0) return [];

      // Collect unique ledger codes from the detail rows
      const ledCodes = [...new Set(rows.map((r) => r.ledcd))];

      // Fetch names for all those codes in one query
      const ledgers = await ctx.db.mopl.mstlednfo.findMany({
        where: { ledcd: { in: ledCodes } },
        select: { ledcd: true, lednm: true },
      });

      const ledMap = new Map(ledgers.map((l) => [l.ledcd, l.lednm]));

      return rows.map((r) => ({
        ...r,
        lednm: ledMap.get(r.ledcd) ?? null,
      }));
    }),

  // ── Save (create or update) ────────────────────────────────────────────────
  save: publicProcedure
    .input(
      z.object({
        jvcd: z.string(), // full voucher code
        untcd: z.string(),
        jvdt: z.string(), // ISO date string
        mode: z.string(),
        rows: z.array(
          z.object({
            ledcd: z.string(),
            lednarr: z.string(),
            amtdr: z.number(),
            amtcr: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const jvdt = new Date(input.jvdt);

      // Check if header already exists (edit mode)
      const existing = await ctx.db.mopl.trnjvnfo.findFirst({
        where: { jvcd: input.jvcd },
      });

      if (existing) {
        // Update header
        await ctx.db.mopl.trnjvnfo.update({
          where: { rowid: existing.rowid },
          data: { jvdt, mode: input.mode },
        });
        // Delete old details and re-insert
        await ctx.db.mopl.trnjvdetnfo.deleteMany({
          where: { jvcd: input.jvcd },
        });
      } else {
        // Create header
        await ctx.db.mopl.trnjvnfo.create({
          data: {
            untcd: input.untcd,
            jvcd: input.jvcd,
            jvdt,
            mode: input.mode,
          },
        });
      }

      // Insert detail rows
      if (input.rows.length > 0) {
        await ctx.db.mopl.trnjvdetnfo.createMany({
          data: input.rows.map((r) => ({
            jvcd: input.jvcd,
            ledcd: r.ledcd,
            lednarr: r.lednarr,
            amtdr: r.amtdr,
            amtcr: r.amtcr,
          })),
        });
      }

      return { jvcd: input.jvcd };
    }),
});
