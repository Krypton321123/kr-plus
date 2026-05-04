BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstclmfrnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000) NOT NULL,
    [fyear] NVARCHAR(1000) NOT NULL,
    [frcd] NVARCHAR(1000) NOT NULL,
    [itmcomcd] NVARCHAR(1000) NOT NULL,
    [fromdt] DATETIME2 NOT NULL,
    [todt] DATETIME2 NOT NULL,
    [sts] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstclmfrnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[mstclmfrdetnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [frcd] NVARCHAR(1000) NOT NULL,
    [frdesc] NVARCHAR(1000) NOT NULL,
    [cndprmnm] NVARCHAR(1000) NOT NULL,
    [inpprmnm] NVARCHAR(1000) NOT NULL,
    [hidezero] NVARCHAR(1000) NOT NULL,
    [clcdisp] NVARCHAR(1000) NOT NULL,
    [frdet] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstclmfrdetnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
