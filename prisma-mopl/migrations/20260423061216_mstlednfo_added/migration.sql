BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstlednfo] (
    [ledcd] NVARCHAR(1000) NOT NULL,
    [rowid] INT,
    [acccd] NVARCHAR(1000),
    [ledprfx] NVARCHAR(1000),
    [lednm] NVARCHAR(1000),
    [ledrptnm] NVARCHAR(1000),
    [ledchqnm] NVARCHAR(1000),
    [buntcd] NVARCHAR(1000),
    [ledcrtdt] DATETIME2,
    [ledsts] NVARCHAR(1000),
    [pcatcd] NVARCHAR(1000),
    [per1prfx] NVARCHAR(1000),
    [ctper1] NVARCHAR(1000),
    [per2prfx] NVARCHAR(1000),
    [ctper2] NVARCHAR(1000),
    [cntno1] NVARCHAR(1000),
    [cntno2] NVARCHAR(1000),
    [ledadr1] NVARCHAR(1000),
    [ctycd] NVARCHAR(1000),
    [pincd] NVARCHAR(1000),
    [areacd] NVARCHAR(1000),
    [loccd] NVARCHAR(1000),
    [ledadr2] NVARCHAR(1000),
    [ctycd2] NVARCHAR(1000),
    [pincd2] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [mobile] NVARCHAR(1000),
    [fax] NVARCHAR(1000),
    [paytyp] NVARCHAR(1000),
    [bnkledcd] NVARCHAR(1000),
    [stncd] NVARCHAR(1000),
    [accno] NVARCHAR(1000),
    [paystncd] NVARCHAR(1000),
    [rtgsno] NVARCHAR(1000),
    [cstno] NVARCHAR(1000),
    [cstdt] DATETIME2,
    [lstno] NVARCHAR(1000),
    [lstdt] DATETIME2,
    [tinno] NVARCHAR(1000),
    [tindt] DATETIME2,
    [tanno] NVARCHAR(1000),
    [tandt] DATETIME2,
    [panno] NVARCHAR(1000),
    [pandt] DATETIME2,
    [stxno] NVARCHAR(1000),
    [stxdt] DATETIME2,
    [lmtamt] INT,
    [consdays] INT,
    [bulkdays] INT,
    [othdays] INT,
    [rof] INT,
    [exmpt] NVARCHAR(1000),
    [empcd] NVARCHAR(1000),
    [mmlledcd] NVARCHAR(1000),
    CONSTRAINT [mstlednfo_pkey] PRIMARY KEY CLUSTERED ([ledcd])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
