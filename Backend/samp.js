import { poolPromise, initializeTables } from "./database.js";

const username = "Giri";
const mobile = 9677066266;
const password = "987654";
// Connect to SQLite database
const pool = await poolPromise;
    await pool.request()
      .input("username", username)
      .input("mobileNo", mobile)
      .input("password", password)
      .query(`
        INSERT INTO users (username, mobileNo, role, password)
        VALUES (@username, @mobileNo, 'driver', @password)
      `);

    res.json({ message: "Driver added successfully" });