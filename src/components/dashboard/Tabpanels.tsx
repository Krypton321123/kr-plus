"use client"

import { useTabStore } from "@/store/tabStore"
import { HomePanelContent } from "./HomePanelContent"
import { UsersPanelContent } from "../userCreation/UserPanelContent"
import UserPermissionPanel from "../userPermission/UserPermissionPanel"
import { CityPanelContent, StatePanelContent, StationPanelContent } from "../locations/LocationPanels"
import { PartyCatPanelContent } from "../PartyCategory/PartyCategoryPanel"
import { AreaPanelContent } from "../areaPanel/AreaPanel"
import { DateLockPanelContent } from "../datelock/DateLockPanel"
import LedgerGroupPage from "../ledgerGroup/LedgerGroup"
import { ItemBrandPanelContent, ItemGroupPanelContent, ItemUnitPanelContent, MainCommodityPanelContent } from "../items/itemPanels"
import { ItemSubGroupPanelContent } from "../items/subitemspanels"
import { GodownPanelContent } from "../items/GodownPanel"
import { CommodityPanelContent } from "../items/CommodityPanel"
import { ItemTypePanelContent } from "../items/Itemtype"
import { LedgerCategoryPanelContent } from "../ledgerCategory/LedgerCategory"
import { ItemMasterContent } from "../items/ItemMasterPage"
import { PrqSitCtgContent } from "../Prerequisites/Prerequsites"
import CastePage from "../caste/CastePanel"
import DepartmentPage from "../department/DepartmentPage"
import { DesignationPanelContent } from "../designation/DesignationPanel"
import { EmployeePanelContent } from "../employee/EmployeePanel"
import { LedgerPanelContent } from "../Ledger/LedgerPanel"
import { DepotBankPanelContent } from "../DepotBank/DepotBankPanel"
import { PurParamPanelContent } from "../Purparam/PurParam"
import AdvancePercentagePage from "../AdvancePer/AdvancePercentagePage"
import PurchaseBrokeragePage from "../purchase/PurchaseBrokerPage"
import { PoCatComPanelContent } from "../poCatCom/PoCatComPage"
import { PurBrgPanelContent } from "../PurBrg/PurBrgContent"
import { JournalVoucherContent } from "../Journal/JournalVocherContent"
import PurchaseOrderBookingPage from "../purchase/PurchaseOrderBookingPage"
import PurchaseOrderAuditPage from "../purchase/PurchaseAuditPage"


const PANEL_MAP: Record<string, React.ReactNode> = {
    home: <HomePanelContent />,
    users: <UsersPanelContent />, 
    permissions: <UserPermissionPanel />,
    state: <StatePanelContent />, 
    city: <CityPanelContent />,
    station: <StationPanelContent />, 
    partycat: <PartyCatPanelContent />,
    area: <AreaPanelContent />,
    datelock: <DateLockPanelContent />, 
    ledgergroup: <LedgerGroupPage />,
    itembrand: <ItemBrandPanelContent />,
    maincommodity: <MainCommodityPanelContent />,
    itemgroup: <ItemGroupPanelContent />,
    itemUnit: <ItemUnitPanelContent />, 
    itemsubgroup: <ItemSubGroupPanelContent />, 
    commodity: <CommodityPanelContent />, 
    godownmanage: <GodownPanelContent />, 
    itemtype: <ItemTypePanelContent />,
    accounttype: <LedgerCategoryPanelContent />, 
    itemmaster: <ItemMasterContent />,
    prereqmanage: <PrqSitCtgContent />, 
    caste: <CastePage />,
    department: <DepartmentPage />, 
    designation: <DesignationPanelContent />,
    employee: <EmployeePanelContent />,
    Ledger: <LedgerPanelContent />,
    depotbank: <DepotBankPanelContent />,
    purparam: <PurParamPanelContent />, 
    advperpage: <AdvancePercentagePage />,
    purchasebrokerpage: <PurchaseBrokeragePage brkrgtyp="purchase" pageTitle="Purchase Brokerage" />,
    pocatcom: <PoCatComPanelContent />,
    purbrg: <PurBrgPanelContent />,
    jvpage: <JournalVoucherContent />,
    purorderbooking: <PurchaseOrderBookingPage />,
    purauditpage: <PurchaseOrderAuditPage />
}

function PlaceholderPanel({ label }: { label: string }) {
    return (
        <div className="flex flex-col">
            <p className="text-[16px] font-medium text-[#1a1a1a] mb-1">{label}</p>
            <p className="text-[13px] text-[#888] mb-5">Connect this panel to your tRPC backend.</p>
            <div className="bg-white border border-[#E8E6E1] rounded-xl p-10 flex flex-col items-center justify-center text-[#C0BDB7]">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#C0BDB7" strokeWidth="1.5" strokeLinecap="round" className="mb-3">
                    <rect x="4" y="6" width="24" height="20" rx="2" />
                    <line x1="4" y1="12" x2="28" y2="12" />
                    <line x1="10" y1="18" x2="18" y2="18" />
                    <line x1="10" y1="22" x2="15" y2="22" />
                </svg>
                <span className="text-[13px]">{label} — no data loaded yet</span>
            </div>
        </div>
    )
}

export function TabPanels() {
    const { tabs, active } = useTabStore()

    return (
        <>
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={`${active === tab.id ? "block" : "hidden"}`}
                >
                    {PANEL_MAP[tab.id] ?? <PlaceholderPanel label={tab.label} />}
                </div>
            ))}
        </>
    )
}