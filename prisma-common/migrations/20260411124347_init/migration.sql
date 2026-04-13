BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[mstcmpnfo] (
    [rowid] BIGINT NOT NULL IDENTITY(1,1),
    [cmpcd] VARCHAR(50) NOT NULL,
    [cmpnm] VARCHAR(250),
    [cmpshnm] VARCHAR(50),
    [cmpadr1] VARCHAR(500),
    [cmpadr2] VARCHAR(500),
    [cmpctycd] VARCHAR(50),
    [cmpzipcd] VARCHAR(6),
    [cmpphn] VARCHAR(100),
    [cmpfax] VARCHAR(100),
    [cmpeml] VARCHAR(100),
    [cmpweb] VARCHAR(100),
    [cmptinno] VARCHAR(50),
    [cmptindt] DATETIME,
    [cmptanno] VARCHAR(50),
    [cmptandt] DATETIME,
    [cmplstno] VARCHAR(50),
    [cmplstdt] DATETIME,
    [cmpcstno] VARCHAR(50),
    [cmpcstdt] DATETIME,
    [cmppanno] VARCHAR(50),
    [cmppandt] DATETIME,
    [cmpstno] VARCHAR(50),
    [cmpstdt] DATETIME,
    [cmpexno] VARCHAR(50),
    [cmpexdt] DATETIME,
    CONSTRAINT [mstcmpnfo_pkey] PRIMARY KEY CLUSTERED ([rowid])
);

-- CreateTable
CREATE TABLE [dbo].[mstfinyear] (
    [rowid] BIGINT NOT NULL IDENTITY(1,1),
    [cmpcd] VARCHAR(50),
    [finyear] VARCHAR(50),
    [startdate] DATE,
    [enddate] DATE,
    CONSTRAINT [mstfinyear_pkey] PRIMARY KEY CLUSTERED ([rowid])
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
