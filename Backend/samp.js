import sqlite3 from "sqlite3";
const sqlite3Verbose = sqlite3.verbose();

// Connect to SQLite database
const db = new sqlite3Verbose.Database("./database.db", (err) => {
  if (err) console.error("Error opening database:", err);
  else console.log("✅ Connected to SQLite database");
});

db.run(`
    INSERT INTO users (username, mobileNo, password, role)
        VALUES ('John Doe', 9876543210, '123456', 'driver');
`);
db.run(`
    INSERT INTO users (username, mobileNo, password, role)
        VALUES ('Prathap Singh', 8148234043, '456789', 'admin');
`);
db.run(`
    INSERT INTO users (username, mobileNo, password, role)
        VALUES ('Gopi', 9677066366, '456123', 'driver');
`);
db.run(`
    INSERT INTO users (username, mobileNo, password, role)
        VALUES ('Guhanraj', 987645432, '321654', 'driver');
`);
db.run(`
    INSERT INTO users (username, mobileNo, password, role)
        VALUES ('Giri', 9677066266, '987654', 'driver');
`);