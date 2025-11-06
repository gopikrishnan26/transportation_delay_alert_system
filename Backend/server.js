import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { poolPromise, initializeTables } from "./database.js";

dotenv.config();
const app = express();

// ✅ Always place this before any route definitions
app.use(cors({
  origin: ["http://localhost:3000", "https://your-frontend-domain-if-deployed.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
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
      username: user.username,
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
  const { username, mobileNo } = req.body;
  const defaultPassword = "driver123";

  if (!username || !mobileNo) {
    return res.status(400).json({ message: "Username and mobile are required" });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("username", username)
      .input("mobileNo", mobileNo)
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

// ✅ UPSERT SUBSCRIBER (students_faculty)
app.post("/subscribers", async (req, res) => {
  const { name, routeName, stopName, mobileNo } = req.body;
  if (!name || !mobileNo) {
    return res.status(400).json({ message: "name and mobileNo are required" });
  }

  try {
    const pool = await poolPromise;
    // If exists, update; else insert
    const existsRes = await pool.request()
      .input("mobileNo", mobileNo)
      .query(`SELECT id FROM students_faculty WHERE mobileNo = @mobileNo`);

    if (existsRes.recordset.length > 0) {
      await pool.request()
        .input("name", name)
        .input("routeName", routeName || null)
        .input("stopName", stopName || null)
        .input("mobileNo", mobileNo)
        .query(`
          UPDATE students_faculty
          SET name = @name, routeName = @routeName, stopName = @stopName
          WHERE mobileNo = @mobileNo
        `);
      return res.json({ message: "Subscription updated" });
    }

    await pool.request()
      .input("name", name)
      .input("routeName", routeName || null)
      .input("stopName", stopName || null)
      .input("mobileNo", mobileNo)
      .query(`
        INSERT INTO students_faculty (name, routeName, stopName, mobileNo)
        VALUES (@name, @routeName, @stopName, @mobileNo)
      `);
    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ GET SUBSCRIBER BY MOBILE
app.get("/subscribers/:mobileNo", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("mobileNo", req.params.mobileNo)
      .query(`SELECT id, name, routeName, stopName, mobileNo FROM students_faculty WHERE mobileNo = @mobileNo`);
    if (result.recordset.length === 0) return res.status(404).json({ message: "Not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
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
        SELECT stopID, stopName, arrivalTime
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
      SELECT userID, username, mobileNo FROM users WHERE role = 'driver'
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
        SELECT stopID, stopName, arrivalTime
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

// ✅ ARRIVAL LOGGING AND DELAY CALCULATION
app.post("/arrive", async (req, res) => {
  const { stopID, driverID } = req.body;

  if (!stopID || !driverID) {
    return res.status(400).json({ message: "stopID and driverID are required" });
  }

  try {
    const pool = await poolPromise;

    // Get stop info and route
    const stopResult = await pool.request()
      .input("stopID", stopID)
      .query(`
        SELECT bs.stopID, bs.routeID, bs.stopName, bs.arrivalTime
        FROM busStops bs
        WHERE bs.stopID = @stopID
      `);

    const stop = stopResult.recordset[0];
    if (!stop) return res.status(404).json({ message: "Stop not found" });

    // Compute delay (basic): compare now vs scheduled arrival (assumes HH:mm format)
    const now = new Date();
    const scheduled = stop.arrivalTime;

    let delayMinutes = 0;
    if (scheduled) {
      const [hh, mm] = String(scheduled).split(":");
      if (!isNaN(hh) && !isNaN(mm)) {
        const scheduledDate = new Date(now);
        scheduledDate.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
        delayMinutes = Math.max(0, Math.round((now.getTime() - scheduledDate.getTime()) / 60000));
      }
    }

    const threshold = parseInt(process.env.DELAY_MINUTES_THRESHOLD || "5", 10);
    const status = delayMinutes > threshold ? "Delayed" : "On time";

    // Insert arrival record
    await pool.request()
      .input("routeID", stop.routeID)
      .input("stopID", stop.stopID)
      .input("driverID", driverID)
      .input("scheduledArrival", scheduled || null)
      .input("delayMinutes", delayMinutes)
      .input("status", status)
      .query(`
        INSERT INTO arrivals (routeID, stopID, driverID, scheduledArrival, actualArrival, delayMinutes, status)
        VALUES (@routeID, @stopID, @driverID, @scheduledArrival, GETDATE(), @delayMinutes, @status)
      `);

    // Minimal notification dispatcher placeholder
    if (delayMinutes > threshold) {
      console.log(
        `Dispatcher: Route ${stop.routeID}, Stop ${stop.stopName} delayed by ${delayMinutes} mins. (Would send SMS here)`
      );
    }

    res.json({ delayMinutes, status, threshold });
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ message: "DB Error" });
  }
});

// ✅ REPORT LATE (from student/faculty when no notification received)
app.post("/report-late", async (req, res) => {
  try {
    const { routeName, stopName, mobileNo, note } = req.body;
    if (!routeName || !stopName || !mobileNo) {
      return res.status(400).json({ message: "routeName, stopName, mobileNo are required" });
    }

    // Heuristic "GenAI" placeholder: determine affected downstream stops and reason
    const reason = "Possible congestion due to traffic or signal delays";

    // Find routeID and stops
    const pool = await poolPromise;
    const routeRes = await pool.request().query(`
      SELECT routeID FROM driverRoutes WHERE routeName = '${routeName.replace(/'/g, "''")}'
    `);
    const route = routeRes.recordset[0];
    if (!route) return res.status(404).json({ message: "Route not found" });

    const stopsRes = await pool.request()
      .input("routeID", route.routeID)
      .query(`
        SELECT stopID, stopName, arrivalTime
        FROM busStops
        WHERE routeID = @routeID
        ORDER BY arrivalTime ASC
      `);

    const stops = stopsRes.recordset || [];
    const currentIdx = stops.findIndex(s => s.stopName === stopName);
    const affectedStops = currentIdx >= 0 ? stops.slice(currentIdx).map(s => s.stopName) : stops.map(s => s.stopName);

    console.log(
      `ReportLate Dispatcher: Route ${routeName}, from stop ${stopName}. Affected stops: ${affectedStops.join(", ")}. Reason: ${reason}. (Would send SMS here)`
    );

    res.json({ message: "Report received", reason, affectedStops });
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