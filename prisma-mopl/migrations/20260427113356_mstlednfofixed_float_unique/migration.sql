/*
  Warnings:

  - A unique constraint covering the columns `[ledcd]` on the table `mstlednfo` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateIndex
ALTER TABLE [dbo].[mstlednfo] ADD CONSTRAINT [mstlednfo_ledcd_key] UNIQUE NONCLUSTERED ([ledcd]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
