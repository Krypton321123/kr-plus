BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstpurbrgnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000) NOT NULL,
    [purbrgcd] NVARCHAR(1000) NOT NULL,
    [purbrgdt] DATETIME2 NOT NULL,
    [pocatcomcd] NVARCHAR(1000) NOT NULL,
    [itmcd] NVARCHAR(1000) NOT NULL,
    [brgqty] INT NOT NULL,
    [brgrate] INT NOT NULL,
    [conddays] INT NOT NULL,
    [condrate] INT NOT NULL,
    [mblbrg] NVARCHAR(1000) NOT NULL,
    [apprateid] INT NOT NULL,
    [sts] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstpurbrgnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
