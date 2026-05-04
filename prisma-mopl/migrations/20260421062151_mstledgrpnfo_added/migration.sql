BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstledgrpnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [ledgrpcd] NVARCHAR(1000) NOT NULL,
    [ledgrplvlcd] NVARCHAR(1000) NOT NULL,
    [ledgrpnm] NVARCHAR(1000) NOT NULL,
    [ledgrpid] INT NOT NULL,
    [ledgrppntid] INT NOT NULL,
    CONSTRAINT [mstledgrpnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
