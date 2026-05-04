BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstempnfo] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [empcd] NVARCHAR(1000) NOT NULL,
    [untcd] NVARCHAR(1000) NOT NULL,
    [currdt] DATETIME2 NOT NULL,
    [entrydt] DATETIME2 NOT NULL,
    [empnm] NVARCHAR(1000) NOT NULL,
    [fthnm] NVARCHAR(1000) NOT NULL,
    [gender] NVARCHAR(1000) NOT NULL,
    [dob] DATETIME2 NOT NULL,
    [rlgcstcd] NVARCHAR(1000) NOT NULL,
    [corraddr1] NVARCHAR(1000) NOT NULL,
    [corraddr2] NVARCHAR(1000),
    [corrctycd] NVARCHAR(1000) NOT NULL,
    [corrareanm] NVARCHAR(1000) NOT NULL,
    [corrphno] NVARCHAR(1000),
    [peraddr1] NVARCHAR(1000) NOT NULL,
    [peraddr2] NVARCHAR(1000),
    [perctycd] NVARCHAR(1000) NOT NULL,
    [perareanm] NVARCHAR(1000) NOT NULL,
    [perphno] NVARCHAR(1000),
    [mobno] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [prefby] NVARCHAR(1000),
    [prefctno] NVARCHAR(1000),
    [srefby] NVARCHAR(1000),
    [srefctno] NVARCHAR(1000),
    [jointyp] NVARCHAR(1000) NOT NULL,
    [joindt] DATETIME2 NOT NULL,
    [dptcd] NVARCHAR(1000) NOT NULL,
    [dsgcd] NVARCHAR(1000) NOT NULL,
    [rptper] NVARCHAR(1000),
    [paymod] NVARCHAR(1000) NOT NULL,
    [bnkledcd] NVARCHAR(1000),
    [bnkaccnm] NVARCHAR(1000),
    [bnkaccno] NVARCHAR(1000),
    [bscsal] INT NOT NULL,
    [tmpgs] INT NOT NULL,
    [pfded] NVARCHAR(1000) NOT NULL,
    [empledcd] NVARCHAR(1000) NOT NULL,
    [isactive] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [mstempnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
