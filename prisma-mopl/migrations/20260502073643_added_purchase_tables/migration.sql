BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[trnpurordnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000),
    [pocd] NVARCHAR(1000),
    [catpocd] NVARCHAR(1000),
    [ptypocd] NVARCHAR(1000),
    [brkpocd] NVARCHAR(1000),
    [pocatcomcd] NVARCHAR(1000),
    [posupcatcd] NVARCHAR(1000),
    [podt] DATETIME2,
    [potyp] NVARCHAR(1000),
    [posupat] NVARCHAR(1000),
    [poptyledcd] NVARCHAR(1000),
    [pobrkledcd] NVARCHAR(1000),
    [socd] NVARCHAR(1000),
    [pofrttyp] NVARCHAR(1000),
    [frgt] INT,
    [validdt] DATETIME2,
    [custledcd] NVARCHAR(1000),
    [pobknauditcd] NVARCHAR(1000),
    [remark] NVARCHAR(1000),
    [dlydt] DATETIME2,
    CONSTRAINT [trnpurordnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[trnpurordbknnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000),
    [pobkncd] NVARCHAR(1000),
    [pobkndt] DATETIME2,
    [dlydt] DATETIME2,
    [pocatcomcd] NVARCHAR(1000),
    [valdt] DATETIME2,
    [purbrgcd] NVARCHAR(1000),
    [frmcd] NVARCHAR(1000),
    [supat] NVARCHAR(1000),
    [custledcd] NVARCHAR(1000),
    [socd] NVARCHAR(1000),
    [usrnm] NVARCHAR(1000),
    [remark] NVARCHAR(1000),
    [apporderid] INT,
    CONSTRAINT [trnpurordbknnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[trnpurordbkndetnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [pobkncd] NVARCHAR(1000),
    [ptyledcd] NVARCHAR(1000),
    [brkrledcd] NVARCHAR(1000),
    [nof] INT,
    [itmcd] NVARCHAR(1000),
    [qty] INT,
    [wgt] INT,
    [frgttyp] NVARCHAR(1000),
    [ratetyp] NVARCHAR(1000),
    [frgt] INT,
    [rate] INT,
    CONSTRAINT [trnpurordbkndetnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[trnpurordbknauditnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000),
    [pobknauditcd] NVARCHAR(1000),
    [pobknauditdt] DATETIME2,
    [pobkncd] NVARCHAR(1000),
    [usrnm] NVARCHAR(1000),
    [sts] NVARCHAR(1000),
    [reason] NVARCHAR(1000),
    CONSTRAINT [trnpurordbknauditnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[trnpurordbknauditdetnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [pobknauditcd] NVARCHAR(1000),
    [ptyledcd] NVARCHAR(1000),
    [brkrledcd] NVARCHAR(1000),
    [nof] INT,
    [itmcd] NVARCHAR(1000),
    [qty] INT,
    [wgt] INT,
    [frgttyp] NVARCHAR(1000),
    [ratetyp] NVARCHAR(1000),
    [frgt] INT,
    [rate] INT,
    CONSTRAINT [trnpurordbknauditdetnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[trnpurorddetnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [pocd] NVARCHAR(1000),
    [poitmcd] NVARCHAR(1000),
    [poqty] INT,
    [powgt] INT,
    [porate] INT,
    [ratetyp] NVARCHAR(1000),
    CONSTRAINT [trnpurorddetnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
