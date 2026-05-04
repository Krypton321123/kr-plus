/*
  Warnings:

  - You are about to drop the `city` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `state` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropTable
DROP TABLE [dbo].[city];

-- DropTable
DROP TABLE [dbo].[state];

-- CreateTable
CREATE TABLE [dbo].[mstState] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [stcd] NVARCHAR(1000) NOT NULL,
    [stdnm] NVARCHAR(1000) NOT NULL,
    [stshnm] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstState_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[mstCity] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [ctycd] NVARCHAR(1000) NOT NULL,
    [ctynm] NVARCHAR(1000) NOT NULL,
    [ctystcd] NVARCHAR(1000) NOT NULL,
    [ctystncd] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstCity_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
