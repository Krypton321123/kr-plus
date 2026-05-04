BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstbrkgnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [brkgcd] NVARCHAR(1000) NOT NULL,
    [untcd] NVARCHAR(1000) NOT NULL,
    [brkrgtyp] NVARCHAR(1000) NOT NULL,
    [vfrom] DATETIME2 NOT NULL,
    [vto] DATETIME2 NOT NULL,
    [brkledcd] NVARCHAR(1000) NOT NULL,
    [itmcomcd] NVARCHAR(1000) NOT NULL,
    [pbrkgtyp] NVARCHAR(1000) NOT NULL,
    [pbrkgval] INT NOT NULL,
    [mbrkgtyp] NVARCHAR(1000) NOT NULL,
    [mbrkgval] INT NOT NULL,
    [slbrkgval] INT NOT NULL,
    [sts] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstbrkgnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
