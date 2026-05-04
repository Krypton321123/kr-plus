BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstpocatcomnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000) NOT NULL,
    [pocatcomcd] NVARCHAR(1000) NOT NULL,
    [pocatcomnm] NVARCHAR(1000) NOT NULL,
    [prmcd] NVARCHAR(1000) NOT NULL,
    [cattyp] NVARCHAR(1000) NOT NULL,
    [itmcomcd] NVARCHAR(1000) NOT NULL,
    [fromdt] DATETIME2 NOT NULL,
    [todt] DATETIME2 NOT NULL,
    [wgtreq] NVARCHAR(1000) NOT NULL,
    [shtdis] INT NOT NULL,
    [duedys] INT NOT NULL,
    [duedyscng] NVARCHAR(1000) NOT NULL,
    [smat] NVARCHAR(1000) NOT NULL,
    [frghttyp] NVARCHAR(1000) NOT NULL,
    [billdiff_ded] NVARCHAR(1000) NOT NULL,
    [shortage_ded] NVARCHAR(1000) NOT NULL,
    [bill_type] NVARCHAR(1000) NOT NULL,
    [conddesc] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstpocatcomnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[mstpocatcomdetnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [pocatcomcd] NVARCHAR(1000) NOT NULL,
    [cndprmnm] NVARCHAR(1000) NOT NULL,
    [cmnprmval] INT NOT NULL,
    [cndprmded] INT NOT NULL,
    [cndprmrate] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstpocatcomdetnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
