/*
  Warnings:

  - You are about to drop the column `dyshtenttm` on the `mstdeptnfo` table. All the data in the column will be lost.
  - You are about to drop the column `ntshtenttm` on the `mstdeptnfo` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[mstdeptnfo] DROP COLUMN [dyshtenttm],
[ntshtenttm];
ALTER TABLE [dbo].[mstdeptnfo] ADD [dyshtentm] DATETIME2,
[ntshtentm] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
