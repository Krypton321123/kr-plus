BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Unit] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [untcd] NVARCHAR(1000) NOT NULL,
    [untnm] NVARCHAR(1000) NOT NULL,
    [untshnm] NVARCHAR(1000),
    [untcmpcd] NVARCHAR(1000),
    [unttyp] NVARCHAR(1000),
    [untledcd] NVARCHAR(1000),
    [cshledcd] NVARCHAR(1000),
    [untctempcd1] NVARCHAR(1000),
    [untctmob1] NVARCHAR(1000),
    [untctempcd2] NVARCHAR(1000),
    [untctmob2] NVARCHAR(1000),
    [untcomadr1] NVARCHAR(1000),
    [untcomadr2] NVARCHAR(1000),
    [untcomctycd] NVARCHAR(1000),
    [cuntcomzipcd] NVARCHAR(1000),
    [untcomphn] NVARCHAR(1000),
    [untcomfax] NVARCHAR(1000),
    [untcomeml] NVARCHAR(1000),
    [untcomweb] NVARCHAR(1000),
    [untchkbil] BIT,
    [untbiladr1] NVARCHAR(1000),
    [untbiladr2] NVARCHAR(1000),
    [untbilctycd] NVARCHAR(1000),
    [cuntbilzipcd] NVARCHAR(1000),
    [untbilphn] NVARCHAR(1000),
    [untbilfax] NVARCHAR(1000),
    [untbileml] NVARCHAR(1000),
    [untbilweb] NVARCHAR(1000),
    [untchkshpbil] BIT,
    [untchkshpcom] BIT,
    [untshpadr1] NVARCHAR(1000),
    [untshpadr2] NVARCHAR(1000),
    [untshpctycd] NVARCHAR(1000),
    [cuntshpzipcd] NVARCHAR(1000),
    [untshpphn] NVARCHAR(1000),
    [untshpfax] NVARCHAR(1000),
    [untshpeml] NVARCHAR(1000),
    [untshpweb] NVARCHAR(1000),
    [unttinno] NVARCHAR(1000),
    [unttindt] DATETIME2,
    [unttanno] NVARCHAR(1000),
    [unttandt] DATETIME2,
    [untlstno] NVARCHAR(1000),
    [untlstdt] DATETIME2,
    [untcstno] NVARCHAR(1000),
    [untcstdt] DATETIME2,
    [untpanno] NVARCHAR(1000),
    [untpandt] DATETIME2,
    [untstno] NVARCHAR(1000),
    [untstdt] DATETIME2,
    [untexno] NVARCHAR(1000),
    [untexdt] DATETIME2,
    [untdispnm] NVARCHAR(1000),
    [avgsale] DECIMAL(32,16),
    [days] DECIMAL(32,16),
    [mmluntcd] NVARCHAR(1000),
    CONSTRAINT [Unit_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [usrcd] NVARCHAR(1000),
    [usrnm] NVARCHAR(1000) NOT NULL,
    [usrshnm] NVARCHAR(1000) NOT NULL,
    [bseuntcd] NVARCHAR(1000) NOT NULL,
    [usrcat] INT NOT NULL,
    [pass] NVARCHAR(1000) NOT NULL,
    [validdt] DATETIME2 NOT NULL,
    [dlock] NVARCHAR(1000) NOT NULL,
    [msgenable] NVARCHAR(1000) NOT NULL,
    [untall] NVARCHAR(1000) NOT NULL,
    [usertyp] NVARCHAR(1000) NOT NULL,
    [userdep] NVARCHAR(1000) NOT NULL,
    [sts] NVARCHAR(1000) NOT NULL,
    [entusrnm] NVARCHAR(1000) NOT NULL,
    [entdt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[userCategory] (
    [rowid] INT NOT NULL IDENTITY(1,1),
    [catcd] NVARCHAR(1000),
    [catnm] NVARCHAR(1000) NOT NULL,
    [sts] NVARCHAR(1000) NOT NULL,
    [entusrnm] NVARCHAR(1000) NOT NULL,
    [entdt] DATETIME2 NOT NULL,
    CONSTRAINT [userCategory_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_usrcat_fkey] FOREIGN KEY ([usrcat]) REFERENCES [dbo].[userCategory]([rowid]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
