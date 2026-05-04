BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstitmsubgrpnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [itmsubgrpcd] NVARCHAR(1000) NOT NULL,
    [itmsubgrpnm] NVARCHAR(1000) NOT NULL,
    [itmsubgrpshnm] NVARCHAR(1000) NOT NULL,
    [itmgrpcd] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstitmsubgrpnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
