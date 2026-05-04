BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[admin] (
    [id] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [admin_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [admin_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[state] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [stcd] NVARCHAR(1000) NOT NULL,
    [stdnm] NVARCHAR(1000) NOT NULL,
    [stshnm] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [state_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[city] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [ctycd] NVARCHAR(1000) NOT NULL,
    [ctynm] NVARCHAR(1000) NOT NULL,
    [ctystcd] NVARCHAR(1000) NOT NULL,
    [ctystncd] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [city_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
