import { advPerRouter } from "./routers/advperRouter";
import { areaRouter } from "./routers/areaRouter";
import { authRouter } from "./routers/authRouter";
import { brkgRouter } from "./routers/brkgRouter";
import { casteRouter } from "./routers/casteRouter";
import { dateLockRouter } from "./routers/dateLockRouter";
import { departmentRouter } from "./routers/departmentRouter";
import { depotBankRouter } from "./routers/depotBankRouter";
import { designationRouter } from "./routers/designationRouter";
import { employeeRouter } from "./routers/employeeRouter";
import { itemRouter } from "./routers/itemRouter";
import { commodityRouter, godownRouter, itemBrandRouter, itemGroupRouter, itemSubGroupRouter, itemUnitRouter, mainCommodityRouter } from "./routers/itemRouters";
import { itemTypeRouter } from "./routers/itemTypeRouter";
import { jvRouter } from "./routers/jvRouter";
import { ledgerCategoryRouter } from "./routers/ledgerCategoryRouter";
import { ledgerGroupRouter } from "./routers/ledgerGroupRouter";
import { ledgerRouter, ledgerSupportRouter } from "./routers/ledgerRouter";
import { cityRouter, stateRouter, stationRouter } from "./routers/locationRouters";
import { partyCatRouter } from "./routers/partyCategory";
import { poCatComRouter } from "./routers/pocatcom";
import { prqSitCtgRouter } from "./routers/preqsitctg";
import { purBrgRouter } from "./routers/purBrgRouter";
import { purOrderAuditRouter } from "./routers/purOrderAuditRouter";
import { purOrderBookingRouter } from "./routers/purOrdrerBookingRouter";
import { purParamRouter } from "./routers/purParamRouter";
import { screenRouter } from "./routers/screenRouter";
import { unitRouter } from "./routers/unitRouter";
import { usersRouter } from "./routers/usersRouter";
import {publicProcedure, router} from "./trpc"

export const appRouter = router({
    hello: publicProcedure.query(async () => "hi"), 
    useDb: publicProcedure.query(async ({ ctx }) => {
        const data = await ctx.db.common.mstfinyear.findMany();
        return data; 
    }),
    auth: authRouter, 
    users: usersRouter, 
    screen: screenRouter,
    unit: unitRouter,
    state: stateRouter,
    city: cityRouter, 
    station: stationRouter, 
    partyCat: partyCatRouter,
    area: areaRouter, 
    dateLock: dateLockRouter,
    ledgerGroup: ledgerGroupRouter,
    itemBrand: itemBrandRouter, 
    mainCommodity: mainCommodityRouter, 
    itemGroup: itemGroupRouter, 
    itemUnit: itemUnitRouter, 
    commodity: commodityRouter, 
    itemSubGroup: itemSubGroupRouter,
    godown: godownRouter,
    itemType: itemTypeRouter,
    ledgerCategory: ledgerCategoryRouter, 
    item: itemRouter,
    prqSitCtg: prqSitCtgRouter,
    caste: casteRouter,
    department: departmentRouter,
    designation: designationRouter,
    employee: employeeRouter,
    ledgerSupport: ledgerSupportRouter, 
    ledger: ledgerRouter,
    depotBank: depotBankRouter,
    purParam: purParamRouter, 
    advPer: advPerRouter,
    brkg: brkgRouter,
    poCatCom: poCatComRouter, 
    purBrg: purBrgRouter, 
    jv: jvRouter,
    purOrderBooking: purOrderBookingRouter,
    purOrderAudit: purOrderAuditRouter,
}); 

export type AppRouter = typeof appRouter; 