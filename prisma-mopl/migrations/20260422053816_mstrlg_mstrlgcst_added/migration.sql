BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstrlgnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [rlgcd] NVARCHAR(1000) NOT NULL,
    [rlgnm] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstrlgnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[mstrlgcstnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [rlgcstcd] NVARCHAR(1000) NOT NULL,
    [rlgcstnm] NVARCHAR(1000) NOT NULL,
    [rlgcd] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstrlgcstnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
