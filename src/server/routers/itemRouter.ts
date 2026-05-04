import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

// ─── Shared item input shape ───────────────────────────────────────────────────

const itemInput = z.object({
  itmnm: z.string().min(1),
  itmtypcd: z.string().min(1),
  itmmaincomcd: z.string().default(""),
  itmcomcd: z.string().default(""),
  itmgrpcd: z.string().default(""),
  itmsubgrpcd: z.string().default(""),
  itmcat: z.string().default(""),
  itmsubcat: z.string().default(""),
  hsncode: z.string().default(""),
  // Packing
  itmcatgrp: z.string().default(""),
  fillitmcd: z.string().default(""),
  itmbrdcd: z.string().default(""),
  lsitmnm: z.string().default(""),
  lsitmunt: z.string().default(""),
  pcksz: z.number().int().default(1),
  emtbxwgt: z.number().default(0),
  // UOM
  stkmngin: z.string().default("QUANTITY UNIT"),
  rateappon: z.string().default("QUANTITY UNIT"),
  autowgtcalc: z.string().default("Automatic By Conversion Factor"),
  wgtconv: z.number().default(0),
  qtyitmunitcd: z.string().default(""),
  wgtitmunitcd: z.string().default(""),
  ordmngin: z.string().default("QUANTITY UNIT"),
  sale: z.number().int().default(1),
  // Purchase
  poreq: z.string().default("1"),
  smat: z.string().default("0"),
  // Fix Assets
  deprate: z.number().default(0),
  uselife: z.number().default(0),
  // Schema-required fields with sensible defaults
  step: z.string().default(""),
  smatcd: z.string().default(""),
  pur: z.number().default(0),
  man: z.number().default(0),
  cons: z.number().default(0),
  exc: z.number().default(0),
  vat: z.number().default(0),
  kit: z.number().default(0),
  sttaxcatcd: z.string().default(""),
  cttaxcatcd: z.string().default(""),
});

const PAGE_SIZE = 25;

// ─── Router ───────────────────────────────────────────────────────────────────

export const itemRouter = router({

  // ── Paginated list with server-side search ──────────────────────────────────
  getAll: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        search: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, search } = input;
      const skip = (page - 1) * PAGE_SIZE;

      // Build a filter only when a search term is present
      const where = search.trim()
        ? {
            OR: [
              { itmnm: { contains: search, mode: "insensitive" as const } },
              { itrmcd: { contains: search, mode: "insensitive" as const } },
              { itmcat: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : undefined;

      const [rows, total] = await Promise.all([
        ctx.db.mopl.mstitmnfo.findMany({
          where,
          orderBy: { rowid: "desc" },
          skip,
          take: PAGE_SIZE,
        }),
        ctx.db.mopl.mstitmnfo.count({ where }),
      ]);

      return {
        rows,
        total,
        page,
        pageCount: Math.ceil(total / PAGE_SIZE),
      };
    }),

  // ── Lightweight list used only for the "Filled Item" combobox ──────────────
  // Returns just the two fields the dropdown needs — never the full 4 000 rows.
  getAllForSelect: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmnfo.findMany({
      select: { itrmcd: true, itmnm: true },
      orderBy: { itmnm: "asc" },
    });
  }),

  // ── Lookup tables ───────────────────────────────────────────────────────────
  getTypes: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmtypnfo.findMany({ orderBy: { itmtypnm: "asc" } });
  }),

  getMainCommodities: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmmaincomnfo.findMany({
      orderBy: { itmmaincomnm: "asc" },
    });
  }),

  getCommodities: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmcomnfo.findMany({
      orderBy: { itmcomnm: "asc" },
    });
  }),

  getGroups: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmgrpnfo.findMany({
      orderBy: { itmgrpnm: "asc" },
    });
  }),

  getSubGroups: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmsubgrpnfo.findMany({
      orderBy: { itmsubgrpnm: "asc" },
    });
  }),

  getBrands: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmbrdnfo.findMany({
      orderBy: { itmbrdnm: "asc" },
    });
  }),

  getItemUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstitmuntnfo.findMany({
      orderBy: { itmuntnm: "asc" },
    });
  }),

  // ── Create ──────────────────────────────────────────────────────────────────
  create: publicProcedure
    .input(itemInput)
    .mutation(async ({ ctx, input }) => {
      const itrmcd = await generateNextCode(
        ctx.db.mopl,
        "mstitmnfo",
        "itrmcd",
        "ITMA"
      );
      return ctx.db.mopl.mstitmnfo.create({
        data: { ...input, itrmcd },
      });
    }),

  // ── Update ──────────────────────────────────────────────────────────────────
  update: publicProcedure
    .input(itemInput.extend({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { rowid, ...data } = input;
      return ctx.db.mopl.mstitmnfo.update({
        where: { rowid },
        data,
      });
    }),

  // ── Delete ──────────────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstitmnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});