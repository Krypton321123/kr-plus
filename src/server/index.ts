import { authRouter } from "./routers/authRouter";
import { usersRouter } from "./routers/usersRouter";
import {publicProcedure, router} from "./trpc"

export const appRouter = router({
    hello: publicProcedure.query(async () => "hi"), 
    useDb: publicProcedure.query(async ({ ctx }) => {
        const data = await ctx.db.common.mstfinyear.findMany();
        return data; 
    }),
    auth: authRouter, 
    users: usersRouter
}); 

export type AppRouter = typeof appRouter; 