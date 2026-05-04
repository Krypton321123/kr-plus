import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

// ─── Input shape ──────────────────────────────────────────────────────────────

const prqSitCtgInput = z.object({
  ctgname: z.string().min(1, "Category name is required"),
  valtyp: z.enum(["%", "Fix"]),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const prqSitCtgRouter = router({

  // ── Paginated list with server-side search ──────────────────────────────────
  getAll: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        search: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const PAGE_SIZE = 25;
      const { page, search } = input;
      const skip = (page - 1) * PAGE_SIZE;

      const where = search.trim()
        ? {
            OR: [
              { ctgname: { contains: search, mode: "insensitive" as const } },
              { prfcd: { contains: search, mode: "insensitive" as const } },
              { valtyp: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : undefined;

      const [rows, total] = await Promise.all([
        ctx.db.mopl.mstprqsitsctgsinfo.findMany({
          where,
          orderBy: { rowid: "desc" },
          skip,
          take: PAGE_SIZE,
        }),
        ctx.db.mopl.mstprqsitsctgsinfo.count({ where }),
      ]);

      return {
        rows,
        total,
        page,
        pageCount: Math.ceil(total / PAGE_SIZE),
      };
    }),

  // ── Create ──────────────────────────────────────────────────────────────────
  create: publicProcedure
    .input(prqSitCtgInput)
    .mutation(async ({ ctx, input }) => {
      const prfcd = await generateNextCode(
        ctx.db.mopl,
        "mstprqsitsctgsinfo",
        "prfcd",
        "PRF"
      );
      return ctx.db.mopl.mstprqsitsctgsinfo.create({
        data: { ...input, prfcd },
      });
    }),

  // ── Update ──────────────────────────────────────────────────────────────────
  update: publicProcedure
    .input(prqSitCtgInput.extend({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { rowid, ...data } = input;
      return ctx.db.mopl.mstprqsitsctgsinfo.update({
        where: { rowid },
        data,
      });
    }),

  // ── Delete ──────────────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstprqsitsctgsinfo.delete({
        where: { rowid: input.rowid },
      });
      return { success: true };
    }),
});