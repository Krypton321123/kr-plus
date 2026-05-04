import z from "zod"
import { TRPCError } from "@trpc/server"
import { publicProcedure, router } from "../trpc"

export const authRouter = router({
    login: publicProcedure.input(z.object({
        username: z.string(),
        password: z.string(),
        locationCode: z.string(),
        cmpCode: z.string(),
        finYear: z.string()
    })).mutation(async ({ input, ctx }) => {
        const company = await ctx.db.common.mstcmpnfo.findFirst({
            where: { cmpcd: input.cmpCode }
        });

        console.log("Company", company); 

        if (!company) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Company not found"
            });
        }

        if (company.cmpnm === "MOPL") {
            const user = await ctx.db.mopl.user.findFirst({
                where: {
                    usrnm: input.username,
                    pass: input.password,
                },
                include: {
                    userCat: true
                }
            });

            if (!user) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid credentials"
                });
            }

            if (user.sts !== "ENABLED") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "User account is inactive"
                });
            }

            return {
                success: true,
                redirectTo: "/dashboard",
                user: {
                    username: user.usrnm,
                    usrcat: user.usrcat,
                    categoryName: user.userCat.catnm,
                    locationCode: user.bseuntcd,
                    cmpCode: input.cmpCode,
                    finYear: input.finYear,
                    cmpName: company.cmpnm,
                    rowid: user.rowid
                }
            };
        }

        // Fallback: no handler for this company yet
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `No login handler configured for company: ${company.cmpcd}`
        });
    }),

    getCompanies: publicProcedure.query(async ({ ctx }) => {
        const companies = await ctx.db.common.mstcmpnfo.findMany({
            select: {
                cmpcd: true, cmpnm: true
            }
        })
        return companies;
    }),

    getFinYear: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
        let finYears = await ctx.db.common.mstfinyear.findMany({
            where: { cmpcd: input },
            select: { finyear: true, rowid: true }
        })

        const mapped = finYears.map(item => ({ ...item, rowid: Number(item.rowid) }));
        return mapped;
    })
})