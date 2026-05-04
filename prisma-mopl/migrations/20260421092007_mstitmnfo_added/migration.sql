BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstitmnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [itrmcd] NVARCHAR(1000) NOT NULL,
    [itmnm] NVARCHAR(1000) NOT NULL,
    [itmtypcd] NVARCHAR(1000) NOT NULL,
    [itmgrpcd] NVARCHAR(1000) NOT NULL,
    [itmsubgrpcd] NVARCHAR(1000) NOT NULL,
    [itmcomcd] NVARCHAR(1000) NOT NULL,
    [itmmaincomcd] NVARCHAR(1000) NOT NULL,
    [step] NVARCHAR(1000) NOT NULL,
    [rateappon] NVARCHAR(1000) NOT NULL,
    [stkmngin] NVARCHAR(1000) NOT NULL,
    [ordmngin] NVARCHAR(1000) NOT NULL,
    [autowgtcalc] NVARCHAR(1000) NOT NULL,
    [wgtconv] FLOAT(53) NOT NULL,
    [qtyitmunitcd] NVARCHAR(1000) NOT NULL,
    [wgtitmunitcd] NVARCHAR(1000) NOT NULL,
    [itmcat] NVARCHAR(1000) NOT NULL,
    [itmsubcat] NVARCHAR(1000) NOT NULL,
    [hsncode] NVARCHAR(1000) NOT NULL,
    [itmcatgrp] NVARCHAR(1000) NOT NULL,
    [fillitmcd] NVARCHAR(1000) NOT NULL,
    [itmbrdcd] NVARCHAR(1000) NOT NULL,
    [lsitmnm] NVARCHAR(1000) NOT NULL,
    [lsitmunt] NVARCHAR(1000) NOT NULL,
    [pcksz] INT NOT NULL,
    [emtbxwgt] FLOAT(53) NOT NULL,
    [poreq] NVARCHAR(1000) NOT NULL,
    [smat] NVARCHAR(1000) NOT NULL,
    [smatcd] NVARCHAR(1000) NOT NULL,
    [pur] FLOAT(53) NOT NULL,
    [man] FLOAT(53) NOT NULL,
    [sale] FLOAT(53) NOT NULL,
    [cons] FLOAT(53) NOT NULL,
    [exc] FLOAT(53) NOT NULL,
    [vat] FLOAT(53) NOT NULL,
    [kit] FLOAT(53) NOT NULL,
    [sttaxcatcd] NVARCHAR(1000) NOT NULL,
    [cttaxcatcd] NVARCHAR(1000) NOT NULL,
    [deprate] FLOAT(53) NOT NULL,
    [uselife] INT NOT NULL,
    CONSTRAINT [mstitmnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
