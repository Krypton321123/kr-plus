/*
  Warnings:

  - A unique constraint covering the columns `[catcd]` on the table `userCategory` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_usrcat_fkey];

-- AlterTable
ALTER TABLE [dbo].[User] ALTER COLUMN [usrcat] NVARCHAR(1000) NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[userCategory] ADD CONSTRAINT [userCategory_catcd_key] UNIQUE NONCLUSTERED ([catcd]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_usrcat_fkey] FOREIGN KEY ([usrcat]) REFERENCES [dbo].[userCategory]([catcd]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
