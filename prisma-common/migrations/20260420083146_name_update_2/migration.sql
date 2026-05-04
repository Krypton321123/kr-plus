/*
  Warnings:

  - You are about to drop the column `stdnm` on the `mstState` table. All the data in the column will be lost.
  - Added the required column `stnm` to the `mstState` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[mstState] DROP COLUMN [stdnm];
ALTER TABLE [dbo].[mstState] ADD [stnm] NVARCHAR(1000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
