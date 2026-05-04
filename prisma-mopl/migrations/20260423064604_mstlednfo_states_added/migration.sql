BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[mstlednfo] ADD [ledtyp] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[mstledunitlink] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [ledcd] NVARCHAR(1000) NOT NULL,
    [untcd] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstledunitlink_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[mstledcatnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [ledcd] NVARCHAR(1000) NOT NULL,
    [ledctcd] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstledcatnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
