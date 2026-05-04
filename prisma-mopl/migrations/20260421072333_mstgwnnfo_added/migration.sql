BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstgwnnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000) NOT NULL,
    [gwncd] NVARCHAR(1000) NOT NULL,
    [gwnnm] NVARCHAR(1000) NOT NULL,
    [gwntyp] NVARCHAR(1000) NOT NULL,
    [hgt] INT NOT NULL,
    [rel] INT NOT NULL,
    [slsmancd] NVARCHAR(1000) NOT NULL,
    [drvcd] NVARCHAR(1000) NOT NULL,
    [stkcat] NVARCHAR(1000) NOT NULL,
    [mmlgwncd] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstgwnnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[mstgwnitmcomdetnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [gwncd] NVARCHAR(1000) NOT NULL,
    [itmmaincomcd] NVARCHAR(1000) NOT NULL,
    [itmcomcd] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstgwnitmcomdetnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
