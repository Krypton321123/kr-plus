/*
  Warnings:

  - The primary key for the `mstlednfo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `rowid` on table `mstlednfo` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;

-- RedefineTables
BEGIN TRANSACTION;
DECLARE @SQL NVARCHAR(MAX) = N''
SELECT @SQL += N'ALTER TABLE '
    + QUOTENAME(OBJECT_SCHEMA_NAME(PARENT_OBJECT_ID))
    + '.'
    + QUOTENAME(OBJECT_NAME(PARENT_OBJECT_ID))
    + ' DROP CONSTRAINT '
    + OBJECT_NAME(OBJECT_ID) + ';'
FROM SYS.OBJECTS
WHERE TYPE_DESC LIKE '%CONSTRAINT'
    AND OBJECT_NAME(PARENT_OBJECT_ID) = 'mstlednfo'
    AND SCHEMA_NAME(SCHEMA_ID) = 'dbo'
EXEC sp_executesql @SQL
;
CREATE TABLE [dbo].[_prisma_new_mstlednfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [ledcd] NVARCHAR(1000) NOT NULL,
    [acccd] NVARCHAR(1000),
    [ledprfx] NVARCHAR(1000),
    [lednm] NVARCHAR(1000),
    [ledrptnm] NVARCHAR(1000),
    [ledchqnm] NVARCHAR(1000),
    [buntcd] NVARCHAR(1000),
    [ledcrtdt] DATETIME2,
    [ledsts] NVARCHAR(1000),
    [pcatcd] NVARCHAR(1000),
    [per1prfx] NVARCHAR(1000),
    [ctper1] NVARCHAR(1000),
    [per2prfx] NVARCHAR(1000),
    [ctper2] NVARCHAR(1000),
    [cntno1] NVARCHAR(1000),
    [cntno2] NVARCHAR(1000),
    [ledadr1] NVARCHAR(1000),
    [ctycd] NVARCHAR(1000),
    [pincd] NVARCHAR(1000),
    [areacd] NVARCHAR(1000),
    [loccd] NVARCHAR(1000),
    [ledadr2] NVARCHAR(1000),
    [ctycd2] NVARCHAR(1000),
    [pincd2] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [mobile] NVARCHAR(1000),
    [fax] NVARCHAR(1000),
    [paytyp] NVARCHAR(1000),
    [bnkledcd] NVARCHAR(1000),
    [stncd] NVARCHAR(1000),
    [accno] NVARCHAR(1000),
    [paystncd] NVARCHAR(1000),
    [rtgsno] NVARCHAR(1000),
    [cstno] NVARCHAR(1000),
    [cstdt] DATETIME2,
    [lstno] NVARCHAR(1000),
    [lstdt] DATETIME2,
    [tinno] NVARCHAR(1000),
    [tindt] DATETIME2,
    [tanno] NVARCHAR(1000),
    [tandt] DATETIME2,
    [panno] NVARCHAR(1000),
    [pandt] DATETIME2,
    [stxno] NVARCHAR(1000),
    [stxdt] DATETIME2,
    [ledtyp] NVARCHAR(1000),
    [lmtamt] INT,
    [consdays] INT,
    [bulkdays] INT,
    [othdays] INT,
    [rof] INT,
    [exmpt] NVARCHAR(1000),
    [empcd] NVARCHAR(1000),
    [mmlledcd] NVARCHAR(1000),
    CONSTRAINT [mstlednfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);
SET IDENTITY_INSERT [dbo].[_prisma_new_mstlednfo] ON;
IF EXISTS(SELECT * FROM [dbo].[mstlednfo])
    EXEC('INSERT INTO [dbo].[_prisma_new_mstlednfo] ([acccd],[accno],[areacd],[bnkledcd],[bulkdays],[buntcd],[cntno1],[cntno2],[consdays],[cstdt],[cstno],[ctper1],[ctper2],[ctycd],[ctycd2],[email],[empcd],[exmpt],[fax],[ledadr1],[ledadr2],[ledcd],[ledchqnm],[ledcrtdt],[lednm],[ledprfx],[ledrptnm],[ledsts],[ledtyp],[lmtamt],[loccd],[lstdt],[lstno],[mmlledcd],[mobile],[othdays],[pandt],[panno],[paystncd],[paytyp],[pcatcd],[per1prfx],[per2prfx],[phone],[pincd],[pincd2],[rof],[rowid],[rtgsno],[stncd],[stxdt],[stxno],[tandt],[tanno],[tindt],[tinno]) SELECT [acccd],[accno],[areacd],[bnkledcd],[bulkdays],[buntcd],[cntno1],[cntno2],[consdays],[cstdt],[cstno],[ctper1],[ctper2],[ctycd],[ctycd2],[email],[empcd],[exmpt],[fax],[ledadr1],[ledadr2],[ledcd],[ledchqnm],[ledcrtdt],[lednm],[ledprfx],[ledrptnm],[ledsts],[ledtyp],[lmtamt],[loccd],[lstdt],[lstno],[mmlledcd],[mobile],[othdays],[pandt],[panno],[paystncd],[paytyp],[pcatcd],[per1prfx],[per2prfx],[phone],[pincd],[pincd2],[rof],[rowid],[rtgsno],[stncd],[stxdt],[stxno],[tandt],[tanno],[tindt],[tinno] FROM [dbo].[mstlednfo] WITH (holdlock tablockx)');
SET IDENTITY_INSERT [dbo].[_prisma_new_mstlednfo] OFF;
DROP TABLE [dbo].[mstlednfo];
EXEC SP_RENAME N'dbo._prisma_new_mstlednfo', N'mstlednfo';
COMMIT;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
