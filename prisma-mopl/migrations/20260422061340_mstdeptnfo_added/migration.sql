BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstdeptnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000),
    [dptcd] NVARCHAR(1000),
    [dptnm] NVARCHAR(1000),
    [empcd] NVARCHAR(1000),
    [wkoff] NVARCHAR(1000),
    [wkoffday] NVARCHAR(1000),
    [almlv] NVARCHAR(1000),
    [nolv] INT,
    [alflv] NVARCHAR(1000),
    [alnhd] NVARCHAR(1000),
    [ernlv] NVARCHAR(1000),
    [dismlv] NVARCHAR(1000),
    [eldys] INT,
    [mldys] INT,
    [lnkpt] NVARCHAR(1000),
    [ptcd] NVARCHAR(1000),
    [dyshtsttm] DATETIME2,
    [dyshtenttm] DATETIME2,
    [ntshtsttm] DATETIME2,
    [ntshtenttm] DATETIME2,
    [ovapp] NVARCHAR(1000),
    [hosttm] DATETIME2,
    [hoentm] DATETIME2,
    [horbtm1] DATETIME2,
    [horbtm2] DATETIME2,
    [horbtm3] DATETIME2,
    [horbdy1] INT,
    [horbdy2] INT,
    [horbdy3] INT,
    [horbhrs] INT,
    [rbhrsdys] INT,
    CONSTRAINT [mstdeptnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
