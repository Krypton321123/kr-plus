import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { generateNextCode } from "../../lib/utils";

const JOINING_TYPES = ["ON STIPEND", "ON SALARY"] as const;
const PAYMENT_MODES = ["CASH", "NEFT", "A/C TRANSFER", "CHEQUE"] as const;
const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"] as const;
const PF_OPTIONS = ["YES", "NO"] as const;
const ACTIVE_OPTIONS = ["ACTIVE", "INACTIVE"] as const;

export const employeeRouter = router({
  // ── Lookups ────────────────────────────────────────────────────────────────

  getUnits: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.unit.findMany({
      select: { untcd: true, untnm: true },
      orderBy: { untnm: "asc" },
    });
  }),

  getReligionCastes: publicProcedure.query(async ({ ctx }) => {
    // Returns all caste rows joined with their religion name
    const castes = await ctx.db.mopl.mstrlgcstnfo.findMany({
      orderBy: { rlgcstnm: "asc" },
    });
    const religions = await ctx.db.mopl.mstrlgnfo.findMany({
      select: { rlgcd: true, rlgnm: true },
    });
    const rlgMap = new Map(religions.map((r) => [r.rlgcd, r.rlgnm]));
    return castes.map((c) => ({
      ...c,
      rlgnm: rlgMap.get(c.rlgcd) ?? c.rlgcd,
    }));
  }),

  getCities: publicProcedure.query(async ({ ctx }) => {
    const cities = await ctx.db.common.mstCity.findMany({
      orderBy: { ctynm: "asc" },
    });
    const states = await ctx.db.common.mstState.findMany({
      select: { stcd: true, stnm: true },
    });
    const stMap = new Map(states.map((s) => [s.stcd, s.stnm]));
    return cities.map((c) => ({
      ...c,
      stnm: stMap.get(c.ctystcd) ?? c.ctystcd,
    }));
  }),

  getAreas: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstareanfo.findMany({
      select: { areacd: true, areanm: true, untcd: true, areactycd: true },
      orderBy: { areanm: "asc" },
    });
  }),

  getDepartments: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstdeptnfo.findMany({
      select: { dptcd: true, dptnm: true, empcd: true },
      orderBy: { dptnm: "asc" },
    });
  }),

  // Returns prerequisites linked to a department, enriched with prqsitsctgsinfo details
  getDeptPrerequisites: publicProcedure
    .input(z.object({ dptcd: z.string() }))
    .query(async ({ ctx, input }) => {
      const links = await ctx.db.mopl.mstdeptprqlink.findMany({
        where: { dptcd: input.dptcd },
      });
      if (!links.length) return [];

      const prfcds = links.map((l) => l.prfcd);
      const prqs = await ctx.db.mopl.mstprqsitsctgsinfo.findMany({
        where: { prfcd: { in: prfcds } },
      });

      return prqs.map((p) => ({
        prfcd: p.prfcd,
        ctgname: p.ctgname,
        valtyp: p.valtyp, // "fixed" or "%"
        value: 0, // user fills this in the UI
      }));
    }),

  getDesignations: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.mopl.mstdsgnfo.findMany({
      select: { dsgcd: true, dsgnm: true },
      orderBy: { dsgnm: "asc" },
    });
  }),

  // ── CRUD ───────────────────────────────────────────────────────────────────

  getAll: publicProcedure.query(async ({ ctx }) => {
    const employees = await ctx.db.mopl.mstempnfo.findMany({
      orderBy: { rowid: "desc" },
    });

    const [units, depts, dsgs] = await Promise.all([
      ctx.db.mopl.unit.findMany({ select: { untcd: true, untnm: true } }),
      ctx.db.mopl.mstdeptnfo.findMany({ select: { dptcd: true, dptnm: true } }),
      ctx.db.mopl.mstdsgnfo.findMany({ select: { dsgcd: true, dsgnm: true } }),
    ]);

    const unitMap = new Map(units.map((u) => [u.untcd, u.untnm]));
    const deptMap = new Map(depts.map((d) => [d.dptcd, d.dptnm]));
    const dsgMap = new Map(dsgs.map((d) => [d.dsgcd, d.dsgnm]));

    return employees.map((e) => ({
      ...e,
      unitName: unitMap.get(e.untcd) ?? e.untcd,
      deptName: deptMap.get(e.dptcd) ?? e.dptcd,
      dsgName: dsgMap.get(e.dsgcd) ?? e.dsgcd,
    }));
  }),

  create: publicProcedure
    .input(
      z.object({
        // General
        untcd: z.string().min(1),
        currdt: z.string(), // ISO date string
        entrydt: z.string(),
        empnm: z.string().min(1),
        fthnm: z.string().min(1),
        gender: z.enum(GENDER_OPTIONS),
        dob: z.string(),
        rlgcstcd: z.string().min(1),
        isactive: z.enum(ACTIVE_OPTIONS).default("ACTIVE"),

        // Correspondence Address
        corraddr1: z.string().min(1),
        corraddr2: z.string().default(""),
        corrctycd: z.string().min(1),
        corrareanm: z.string().default(""),
        corrphno: z.string().default(""),

        // Permanent Address
        peraddr1: z.string().min(1),
        peraddr2: z.string().default(""),
        perctycd: z.string().min(1),
        perareanm: z.string().default(""),
        perphno: z.string().default(""),

        // Contact
        mobno: z.string().default(""),
        email: z.string().default(""),
        prefby: z.string().default(""),
        prefctno: z.string().default(""),
        srefby: z.string().default(""),
        srefctno: z.string().default(""),

        // Joining
        jointyp: z.enum(JOINING_TYPES),
        joindt: z.string(),
        dptcd: z.string().min(1),
        dsgcd: z.string().min(1),
        rptper: z.string().default(""),

        // Payment
        paymod: z.enum(PAYMENT_MODES),
        bnkledcd: z.string().default(""),
        bnkaccnm: z.string().default(""),
        bnkaccno: z.string().default(""),

        prereqs: z
          .array(
            z.object({
              prfcd: z.string(),
              prfval: z.string(), // store the value as string — matches mstempdetnfo.prfval
            }),
          )
          .default([]),

        // Salary
        bscsal: z.number().default(0),
        tmpgs: z.number().default(0),
        pfded: z.enum(PF_OPTIONS).default("NO"),

        // Employee Ledger (required by schema, send empty for now)
        empledcd: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const empcd = await generateNextCode(
        ctx.db.mopl,
        "mstempnfo",
        "empcd",
        "EMPA",
      );

      return ctx.db.mopl.$transaction(async (tx) => {
        const employee = await tx.mstempnfo.create({
          data: {
            empcd,
            untcd: input.untcd,
            currdt: new Date(input.currdt),
            entrydt: new Date(input.entrydt),
            empnm: input.empnm,
            fthnm: input.fthnm,
            gender: input.gender,
            dob: new Date(input.dob),
            rlgcstcd: input.rlgcstcd,
            isactive: input.isactive,
            corraddr1: input.corraddr1,
            corraddr2: input.corraddr2,
            corrctycd: input.corrctycd,
            corrareanm: input.corrareanm,
            corrphno: input.corrphno,
            peraddr1: input.peraddr1,
            peraddr2: input.peraddr2,
            perctycd: input.perctycd,
            perareanm: input.perareanm,
            perphno: input.perphno,
            mobno: input.mobno,
            email: input.email,
            prefby: input.prefby,
            prefctno: input.prefctno,
            srefby: input.srefby,
            srefctno: input.srefctno,
            jointyp: input.jointyp,
            joindt: new Date(input.joindt),
            dptcd: input.dptcd,
            dsgcd: input.dsgcd,
            rptper: input.rptper,
            paymod: input.paymod,
            bnkledcd: input.bnkledcd
              ? input.bnkledcd.slice(0, 3).toUpperCase()
              : "",
            bnkaccnm: input.bnkaccnm,
            bnkaccno: input.bnkaccno,
            bscsal: input.bscsal,
            tmpgs: input.tmpgs,
            pfded: input.pfded,
            empledcd: input.empledcd,
          },
        });

        if (input.prereqs.length > 0) {
          await tx.mstempdetnfo.createMany({
            data: input.prereqs.map((p) => ({
              empcd,
              prfcd: p.prfcd,
              prfval: p.prfval,
            })),
          });
        }

        return employee;
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        rowid: z.number(),
        untcd: z.string().min(1),
        currdt: z.string(),
        entrydt: z.string(),
        empnm: z.string().min(1),
        fthnm: z.string().min(1),
        gender: z.enum(GENDER_OPTIONS),
        dob: z.string(),
        rlgcstcd: z.string().min(1),
        isactive: z.enum(ACTIVE_OPTIONS),
        corraddr1: z.string().min(1),
        corraddr2: z.string().default(""),
        corrctycd: z.string().min(1),
        corrareanm: z.string().default(""),
        corrphno: z.string().default(""),
        peraddr1: z.string().min(1),
        peraddr2: z.string().default(""),
        perctycd: z.string().min(1),
        perareanm: z.string().default(""),
        perphno: z.string().default(""),
        mobno: z.string().default(""),
        email: z.string().default(""),
        prefby: z.string().default(""),
        prefctno: z.string().default(""),
        srefby: z.string().default(""),
        srefctno: z.string().default(""),
        jointyp: z.enum(JOINING_TYPES),
        joindt: z.string(),
        dptcd: z.string().min(1),
        dsgcd: z.string().min(1),
        rptper: z.string().default(""),
        paymod: z.enum(PAYMENT_MODES),
        bnkledcd: z.string().default(""),
        bnkaccnm: z.string().default(""),
        bnkaccno: z.string().default(""),
        bscsal: z.number().default(0),
        prereqs: z
          .array(
            z.object({
              prfcd: z.string(),
              prfval: z.string(),
            }),
          )
          .default([]),
        tmpgs: z.number().default(0),
        pfded: z.enum(PF_OPTIONS),
        empledcd: z.string().default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { rowid, prereqs, ...data } = input;

      return ctx.db.mopl.$transaction(async (tx) => {
        const employee = await tx.mstempnfo.update({
          where: { rowid },
          data: {
            ...data,
            currdt: new Date(data.currdt),
            entrydt: new Date(data.entrydt),
            dob: new Date(data.dob),
            joindt: new Date(data.joindt),
            bnkledcd: data.bnkledcd
              ? data.bnkledcd.slice(0, 3).toUpperCase()
              : "",
          },
        });

        // Wipe old prereq rows for this employee, re-insert fresh
        await tx.mstempdetnfo.deleteMany({ where: { empcd: employee.empcd } });

        if (prereqs.length > 0) {
          await tx.mstempdetnfo.createMany({
            data: prereqs.map((p) => ({
              empcd: employee.empcd,
              prfcd: p.prfcd,
              prfval: p.prfval,
            })),
          });
        }

        return employee;
      });
    }),

  getEmpPrereqs: publicProcedure
    .input(z.object({ empcd: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.mopl.mstempdetnfo.findMany({
        where: { empcd: input.empcd },
      });
    }),

  delete: publicProcedure
    .input(z.object({ rowid: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mopl.mstempnfo.delete({ where: { rowid: input.rowid } });
      return { success: true };
    }),
});
