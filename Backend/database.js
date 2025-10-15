import sqlite3 from "sqlite3";
const sqlite3Verbose = sqlite3.verbose();

// Connect to SQLite database
const db = new sqlite3Verbose.Database("./database.db", (err) => {
  if (err) console.error("Error opening database:", err);
  else console.log("✅ Connected to SQLite database");
});

db.serialize(() => {
  //Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userID INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      mobileNo INTEGER NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      login_timestamp TEXT,
      logout_timestamp TEXT
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  //Driver Routes table
  db.run(`
    CREATE TABLE IF NOT EXISTS driverRoutes (
      routeID INTEGER PRIMARY KEY AUTOINCREMENT,
      routeName TEXT NOT NULL,
      numStops INTEGER DEFAULT 0,
      driverID INTEGER UNIQUE,  -- one route per driver
      FOREIGN KEY (driverID) REFERENCES users(userID)
    );
  `);

  //Bus Stops table
  db.run(`
    CREATE TABLE IF NOT EXISTS busStops (
      stopID INTEGER PRIMARY KEY AUTOINCREMENT,
      routeID INTEGER,
      stopName TEXT NOT NULL,
      arrivalTime TEXT,       -- "HH:MM" or ISO timestamp
      departureTime TEXT,     -- "HH:MM" or ISO timestamp
      FOREIGN KEY (routeID) REFERENCES driverRoutes(routeID)
    );
  `);
});

export default db;