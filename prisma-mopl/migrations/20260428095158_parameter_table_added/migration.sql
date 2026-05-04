BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstpurprmnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000) NOT NULL,
    [prmcd] NVARCHAR(1000) NOT NULL,
    [itmcomcd] NVARCHAR(1000) NOT NULL,
    [fromdt] DATE NOT NULL,
    [toDt] DATE NOT NULL,
    [sts] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstpurprmnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[mstpurprmdetnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [prmcd] NVARCHAR(1000) NOT NULL,
    [cndprmnm] NVARCHAR(1000) NOT NULL,
    [cndprmtyp] NVARCHAR(1000) NOT NULL,
    [inpprmnm] NVARCHAR(1000) NOT NULL,
    [valtyp] NVARCHAR(1000) NOT NULL,
    [clcon] NVARCHAR(1000) NOT NULL,
    [prcusd] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstpurprmdetnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
