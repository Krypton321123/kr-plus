BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstledctnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [ledctcd] NVARCHAR(1000) NOT NULL,
    [ledctnm] NVARCHAR(1000) NOT NULL,
    [sysledcd] NVARCHAR(1000) NOT NULL,
    [ledgrpcd] NVARCHAR(1000) NOT NULL,
    [ledctshtnm] NVARCHAR(1000) NOT NULL,
    [itmcomcd] NVARCHAR(1000) NOT NULL,
    [maildet] NVARCHAR(1000) NOT NULL,
    [parentid] NVARCHAR(1000) NOT NULL,
    [hasled] NVARCHAR(1000) NOT NULL,
    [hasparties] NVARCHAR(1000) NOT NULL,
    [showintrial] NVARCHAR(1000) NOT NULL,
    [locwisemerge] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstledctnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
