import { commonDb } from "./db/common";
import { dbMopl } from "./db/mopl";

export async function createContext() {
    return {
        db: {
            common: commonDb,
            mopl: dbMopl
        }
    }
}

export type context = Awaited<ReturnType<typeof createContext>>; 