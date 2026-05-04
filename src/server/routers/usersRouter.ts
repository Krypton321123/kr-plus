import z from "zod"
import { TRPCError } from "@trpc/server"
import { publicProcedure, router } from "../trpc"
import { generateNextCode } from "@/lib/utils"

export const usersRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.mopl.user.findMany({
      include: { userCat: true },
      orderBy: { rowid: "desc" },
    })
    return users.map((u) => ({
      ...u,
      validdt: u.validdt.toISOString(),
      entdt: u.entdt.toISOString(),
    }))
  }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.userCategory.findMany({
      select: { catcd: true, catnm: true },
    })
  }),

  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
    })
  }),

  create: publicProcedure
    .input(
      z.object({
        usrcd: z.string().optional(),
        usrnm: z.string().min(1),
        usrshnm: z.string().min(1),
        bseuntcd: z.string().min(1),
        usrcat: z.string().min(1),
        pass: z.string().min(1),
        confirmPass: z.string().min(1),
        validdt: z.string(),
        dlock: z.enum(["Yes", "No"]),
        msgenable: z.enum(["Yes", "No"]),
        untall: z.enum(["Yes", "No"]),
        usertyp: z.string().min(1),
        userdep: z.string().min(1),
        sts: z.enum(["ENABLED", "DISABLED"]),
        entusrnm: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.pass !== input.confirmPass) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Passwords do not match" })
      }
      const existing = await ctx.db.mopl.user.findFirst({
        where: { usrnm: input.usrnm },
      })
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Username already exists" })
      }

      const nextUserCode = await generateNextCode(ctx.db.mopl, 'User', 'usrcd', 'USR'); 
      const user = await ctx.db.mopl.user.create({
        data: {
          usrcd: nextUserCode,
          usrnm: input.usrnm,
          usrshnm: input.usrshnm,
          bseuntcd: input.bseuntcd,
          usrcat: input.usrcat,
          pass: input.pass,
          validdt: new Date(input.validdt),
          dlock: input.dlock,
          msgenable: input.msgenable,
          untall: input.untall,
          usertyp: input.usertyp,
          userdep: input.userdep,
          sts: input.sts,
          entusrnm: input.entusrnm,
          entdt: new Date(),
        },
      })
      return { success: true, rowid: user.rowid }
    }),

  update: publicProcedure
    .input(
      z.object({
        rowid: z.number(),
        usrcd: z.string().optional(),
        usrnm: z.string().min(1),
        usrshnm: z.string().min(1),
        bseuntcd: z.string().min(1),
        usrcat: z.string().min(1),
        // pass is optional on update — only update if provided
        pass: z.string().optional(),
        confirmPass: z.string().optional(),
        validdt: z.string(),
        dlock: z.enum(["Yes", "No"]),
        msgenable: z.enum(["Yes", "No"]),
        untall: z.enum(["Yes", "No"]),
        usertyp: z.string().min(1),
        userdep: z.string().min(1),
        sts: z.enum(["ENABLED", "DISABLED"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.pass || input.confirmPass) {
        if (input.pass !== input.confirmPass) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Passwords do not match" })
        }
      }

      // Check username uniqueness only if it changed
      const current = await ctx.db.mopl.user.findFirst({
        where: { rowid: input.rowid },
      })
      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
      }
      if (current.usrnm !== input.usrnm) {
        const taken = await ctx.db.mopl.user.findFirst({
          where: { usrnm: input.usrnm },
        })
        if (taken) {
          throw new TRPCError({ code: "CONFLICT", message: "Username already exists" })
        }
      }

      await ctx.db.mopl.user.update({
        where: { rowid: input.rowid },
        data: {
          usrcd: input.usrcd ?? "",
          usrnm: input.usrnm,
          usrshnm: input.usrshnm,
          bseuntcd: input.bseuntcd,
          usrcat: input.usrcat,
          ...(input.pass ? { pass: input.pass } : {}),
          validdt: new Date(input.validdt),
          dlock: input.dlock,
          msgenable: input.msgenable,
          untall: input.untall,
          usertyp: input.usertyp,
          userdep: input.userdep,
          sts: input.sts,
        },
      })
      return { success: true }
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Clean up related records first to avoid FK violations
      await ctx.db.mopl.userScreen.deleteMany({ where: { userId: input.rowid } })
      await ctx.db.mopl.userUnit.deleteMany({ where: { userId: input.rowid } })
      await ctx.db.mopl.user.delete({ where: { rowid: input.rowid } })
      return { success: true }
    }),
})