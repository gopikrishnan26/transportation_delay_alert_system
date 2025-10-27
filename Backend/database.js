import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
  user: process.env.AZURE_SQL_USER, // e.g., yourAdmin
  password: process.env.AZURE_SQL_PASSWORD, // your Azure SQL password
  server: process.env.AZURE_SQL_SERVER, // e.g., yourservername.database.windows.net
  database: process.env.AZURE_SQL_DATABASE, // e.g., transportation_db
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

// Connect to Azure SQL
export const poolPromise = sql.connect(config)
  .then((pool) => {
    console.log("✅ Connected to Azure SQL Database");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });

// Function to create tables (if they don't exist)
export async function initializeTables() {
  const pool = await poolPromise;

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
    CREATE TABLE users (
      userID INT IDENTITY(1,1) PRIMARY KEY,
      username NVARCHAR(100) NOT NULL,
      mobileNo BIGINT NOT NULL UNIQUE,
      password NVARCHAR(100) NOT NULL,
      role NVARCHAR(50) NOT NULL,
      login_timestamp DATETIME2 NULL,
      logout_timestamp DATETIME2 NULL,
      created_at DATETIME2 DEFAULT GETDATE()
    );
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='driverRoutes' AND xtype='U')
    CREATE TABLE driverRoutes (
      routeID INT IDENTITY(1,1) PRIMARY KEY,
      routeName NVARCHAR(100) NOT NULL,
      numStops INT DEFAULT 0,
      driverID INT UNIQUE NULL,
      FOREIGN KEY (driverID) REFERENCES users(userID)
    );
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='busStops' AND xtype='U')
    CREATE TABLE busStops (
      stopID INT IDENTITY(1,1) PRIMARY KEY,
      routeID INT NOT NULL,
      stopName NVARCHAR(100) NOT NULL,
      arrivalTime NVARCHAR(50),
      departureTime NVARCHAR(50),
      FOREIGN KEY (routeID) REFERENCES driverRoutes(routeID)
    );
  `);

  console.log("✅ Tables verified/created successfully in Azure SQL");
}