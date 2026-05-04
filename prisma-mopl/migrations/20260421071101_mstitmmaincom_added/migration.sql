BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstitmmaincomnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [itmmaincomcd] NVARCHAR(1000) NOT NULL,
    [itmmaincomnm] NVARCHAR(1000) NOT NULL,
    [itmmaincomshnm] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstitmmaincomnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
