BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[userScreen] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [screen] INT NOT NULL,
    CONSTRAINT [userScreen_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[userUnit] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [unit] INT NOT NULL,
    CONSTRAINT [userUnit_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[mstMenuConfig] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [scrcd] NVARCHAR(1000) NOT NULL,
    [scrnm] NVARCHAR(1000) NOT NULL,
    [scrlnk] NVARCHAR(1000) NOT NULL,
    [scrcat] NVARCHAR(1000) NOT NULL,
    [scrtyp] NVARCHAR(1000) NOT NULL,
    [scrmodcd] NVARCHAR(1000) NOT NULL,
    [scrid] INT NOT NULL,
    [scrpntid] INT NOT NULL,
    [oldid] INT NOT NULL,
    CONSTRAINT [mstMenuConfig_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- AddForeignKey
ALTER TABLE [dbo].[userScreen] ADD CONSTRAINT [userScreen_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([rowid]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[userScreen] ADD CONSTRAINT [userScreen_screen_fkey] FOREIGN KEY ([screen]) REFERENCES [dbo].[mstMenuConfig]([rowid]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[userUnit] ADD CONSTRAINT [userUnit_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([rowid]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[userUnit] ADD CONSTRAINT [userUnit_unit_fkey] FOREIGN KEY ([unit]) REFERENCES [dbo].[Unit]([rowid]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
