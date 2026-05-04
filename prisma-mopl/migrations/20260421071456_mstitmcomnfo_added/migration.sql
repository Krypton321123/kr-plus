BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstitmcomnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [itmcomcd] NVARCHAR(1000) NOT NULL,
    [itmcomnm] NVARCHAR(1000) NOT NULL,
    [itmcomshnm] NVARCHAR(1000) NOT NULL,
    [itmcomtxcd] NVARCHAR(1000) NOT NULL,
    [itmmaincomcd] NVARCHAR(1000) NOT NULL,
    [itcrate] INT NOT NULL,
    [stype] NVARCHAR(1000) NOT NULL,
    [snature] NVARCHAR(1000) NOT NULL,
    [poreq] INT NOT NULL,
    [ratetax] NVARCHAR(1000) NOT NULL,
    [srcmng] NVARCHAR(1000) NOT NULL,
    [rateautocalc] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstitmcomnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
