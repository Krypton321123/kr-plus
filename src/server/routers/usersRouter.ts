import z from "zod"
import { TRPCError } from "@trpc/server"
import { publicProcedure, router } from "../trpc"

export const usersRouter = router({
    getAll: publicProcedure.query(async ({ ctx }) => {
        const users = await ctx.db.mopl.user.findMany({
            include: { userCat: true },
            orderBy: { rowid: "desc" }
        })
        return users.map(u => ({
            ...u,
            validdt: u.validdt.toISOString(),
            entdt: u.entdt.toISOString(),
        }))
    }),

    getCategories: publicProcedure.query(async ({ ctx }) => {
        const categories = await ctx.db.mopl.userCategory.findMany({
            select: { catcd: true, catnm: true }
        })

        console.log("categories", categories); 
        return categories; 
    }),

    getUnits: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.mopl.unit.findMany({
            select: { untcd: true, untnm: true }
        })
    }),

    create: publicProcedure.input(z.object({
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
    })).mutation(async ({ input, ctx }) => {
        if (input.pass !== input.confirmPass) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Passwords do not match" })
        }

        const existing = await ctx.db.mopl.user.findFirst({
            where: { usrnm: input.usrnm }
        })
        if (existing) {
            throw new TRPCError({ code: "CONFLICT", message: "Username already exists" })
        }

        const user = await ctx.db.mopl.user.create({
            data: {
                usrcd: input.usrcd ?? "",
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
            }
        })

        return { success: true, rowid: user.rowid }
    })
})