import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { poolPromise, initializeTables } from "./database.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB tables (optional)
initializeTables();

// ✅ LOGIN
app.post("/login", async (req, res) => {
  const { mobileNo, password, role } = req.body;
  if (!mobileNo || !password || !role)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const pool = await poolPromise;

    // Check credentials
    const result = await pool.request()
      .input("mobileNo", mobileNo)
      .input("password", password)
      .input("role", role)
      .query(`
        SELECT * FROM users
        WHERE mobileNo = @mobileNo AND password = @password AND role = @role
      `);

    const user = result.recordset[0];
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const loginTime = new Date();
    await pool.request()
      .input("loginTime", loginTime)
      .input("userID", user.userID)
      .query(`
        UPDATE users
        SET login_timestamp = @loginTime
        WHERE userID = @userID
      `);

    res.json({
      userID: user.userID,
      mobileNo: user.mobileNo,
      role: user.role,
      login_timestamp: loginTime,
    });

  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ LOGOUT
app.post("/logout", async (req, res) => {
  const { id } = req.body;
  const logoutTime = new Date();

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("logoutTime", logoutTime)
      .input("userID", id)
      .query(`
        UPDATE users
        SET logout_timestamp = @logoutTime
        WHERE userID = @userID
      `);

    res.json({ message: "Logout recorded", logout_timestamp: logoutTime });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ ADD DRIVER
app.post("/addDriver", async (req, res) => {
  const { username, mobile } = req.body;
  const defaultPassword = "driver123";

  if (!username || !mobile) {
    return res.status(400).json({ message: "Username and mobile are required" });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("username", username)
      .input("mobileNo", mobile)
      .input("password", defaultPassword)
      .query(`
        INSERT INTO users (username, mobileNo, role, password)
        VALUES (@username, @mobileNo, 'driver', @password)
      `);

    res.json({ message: "Driver added successfully" });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADD ROUTE
app.post("/add-route", async (req, res) => {
  const { routeName, numStops } = req.body;

  if (!routeName)
    return res.status(400).json({ message: "Route name is required" });

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("routeName", routeName)
      .input("numStops", numStops || 0)
      .query(`
        INSERT INTO driverRoutes (routeName, numStops)
        VALUES (@routeName, @numStops)
      `);

    res.json({ message: "✅ Route added successfully" });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ ASSIGN DRIVER TO ROUTE
app.post("/assign-driver", async (req, res) => {
  const { routeID, driverID } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("routeID", routeID)
      .input("driverID", driverID)
      .query(`
        UPDATE driverRoutes
        SET driverID = @driverID
        WHERE routeID = @routeID
      `);

    res.json({ message: "Driver assigned successfully" });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ ADD BUS STOP
app.post("/add-bus-stop", async (req, res) => {
  const { routeID, stopName, arrivalTime, departureTime } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("routeID", routeID)
      .input("stopName", stopName)
      .input("arrivalTime", arrivalTime)
      .input("departureTime", departureTime)
      .query(`
        INSERT INTO busStops (routeID, stopName, arrivalTime, departureTime)
        VALUES (@routeID, @stopName, @arrivalTime, @departureTime)
      `);

    res.json({ message: "Bus stop added successfully" });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ REMOVE BUS STOP
app.delete("/remove-bus-stop/:stopID", async (req, res) => {
  const { stopID } = req.params;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("stopID", stopID)
      .query(`
        DELETE FROM busStops WHERE stopID = @stopID
      `);

    res.json({ message: "Bus stop removed" });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ CHANGE DRIVER FOR ROUTE
app.post("/change-driver", async (req, res) => {
  const { routeID, newDriverID } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("routeID", routeID)
      .input("newDriverID", newDriverID)
      .query(`
        UPDATE driverRoutes
        SET driverID = @newDriverID
        WHERE routeID = @routeID
      `);

    res.json({ message: "Driver changed successfully" });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ DRIVER ROUTE + STOPS
app.get("/driver-route/:driverID", async (req, res) => {
  const { driverID } = req.params;

  try {
    const pool = await poolPromise;

    const routeResult = await pool.request()
      .input("driverID", driverID)
      .query(`
        SELECT * FROM driverRoutes WHERE driverID = @driverID
      `);

    const route = routeResult.recordset[0];
    if (!route)
      return res.status(404).json({ message: "No route assigned" });

    const stopsResult = await pool.request()
      .input("routeID", route.routeID)
      .query(`
        SELECT stopName, arrivalTime, departureTime
        FROM busStops
        WHERE routeID = @routeID
        ORDER BY arrivalTime ASC
      `);

    res.json({
      routeName: route.routeName,
      busStops: stopsResult.recordset,
    });

  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ GET ALL DRIVERS
app.get("/drivers", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT userID, username FROM users WHERE role = 'driver'
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ GET ALL ROUTES
app.get("/routes", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT routeID, routeName, driverID FROM driverRoutes
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ GET BUS STOPS FOR ROUTE
app.get("/bus-stops/:routeID", async (req, res) => {
  const { routeID } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("routeID", routeID)
      .query(`
        SELECT stopID, stopName, arrivalTime, departureTime
        FROM busStops
        WHERE routeID = @routeID
        ORDER BY arrivalTime ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// --------------------- SERVER START ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);