import { httpBatchLink } from "@trpc/client";

import {appRouter} from "@/server"
import {createContext} from "@/server/context"

export const serverClient = appRouter.createCaller(await createContext())