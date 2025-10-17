import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./database.js";

dotenv.config();

const app = express();
const build_path = path.join(__dirname__, '..', 'frontend', 'build');
app.use(express.static(build_path));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use(cors());
app.use(express.json());


// --------------------- AUTH APIs ---------------------

// ✅ LOGIN
app.post("/login", (req, res) => {
  const { mobileNo, password, role } = req.body;

  if (!mobileNo || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.get(
    "SELECT * FROM users WHERE mobileNo = ? AND password = ? AND role = ?",
    [mobileNo, password, role],
    (err, user) => {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const loginTime = new Date().toISOString();

      db.run(
        "UPDATE users SET login_timestamp = ? WHERE userID = ?",
        [loginTime, user.userID],
        (updateErr) => {
          if (updateErr) {
            console.error("DB Error:", updateErr.message);
            return res.status(500).json({ message: "DB Error" });
          }

          res.json({
            userID: user.userID,
            mobileNo: user.mobileNo,
            role: user.role,
            login_timestamp: loginTime,
          });
        }
      );
    }
  );
});

// ✅ LOGOUT
app.post("/logout", (req, res) => {
  const { id } = req.body;
  const logoutTime = new Date().toISOString();

  db.run(
    "UPDATE users SET logout_timestamp = ? WHERE userID = ?",
    [logoutTime, id],
    function (err) {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }

      res.json({
        message: "Logout recorded",
        logout_timestamp: logoutTime,
      });
    }
  );
});

// --------------------- ADMIN APIs ---------------------

// ✅ Assign Driver to Route
app.post("/assign-driver", (req, res) => {
  const { routeID, driverID } = req.body;

  db.run(
    "UPDATE driverRoutes SET driverID = ? WHERE routeID = ?",
    [driverID, routeID],
    function (err) {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }
      res.json({ message: "Driver assigned successfully" });
    }
  );
});

// ✅ Add Bus Stop
app.post("/add-bus-stop", (req, res) => {
  const { routeID, stopName, arrivalTime, departureTime } = req.body;

  db.run(
    "INSERT INTO busStops (routeID, stopName, arrivalTime, departureTime) VALUES (?, ?, ?, ?)",
    [routeID, stopName, arrivalTime, departureTime || null],
    function (err) {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }
      res.json({ message: "Bus stop added", stopID: this.lastID });
    }
  );
});

// ✅ Add New Driver
app.post("/addDriver", (req, res) => {
  const { driverName, mobileNo } = req.body;
  const defaultPassword = "driver123";

  if (!driverName || !mobileNo) {
    console.log(driverName, mobileNo);
    return res.status(400).json({ message: "Username and mobile are required" });
  }

  db.run(
    "INSERT INTO users (username, mobileNo, role, password) VALUES (?, ?, 'driver', ?)",
    [driverName, mobileNo, defaultPassword],
    function (err) {
      if (err) {
        console.error("Error inserting driver:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({
        message: "Driver added successfully",
        id: this.lastID,
      });
    }
  );
});

// ✅ Add New Route
app.post("/add-route", (req, res) => {
  const { routeName, numStops } = req.body;

  if (!routeName)
    return res.status(400).json({ message: "Route name is required" });

  db.run(
    "INSERT INTO driverRoutes (routeName, numStops) VALUES (?, ?)",
    [routeName, numStops || 0],
    function (err) {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }
      res.json({
        message: "✅ Route added successfully",
        routeID: this.lastID,
      });
    }
  );
});

// ✅ Remove Bus Stop
app.delete("/remove-bus-stop/:stopID", (req, res) => {
  const { stopID } = req.params;
  db.run(
    "DELETE FROM busStops WHERE stopID = ?",
    [stopID],
    function (err) {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }
      res.json({ message: "Bus stop removed" });
    }
  );
});

// ✅ Change Driver for Route
app.post("/change-driver", (req, res) => {
  const { routeID, newDriverID } = req.body;

  db.run(
    "UPDATE driverRoutes SET driverID = ? WHERE routeID = ?",
    [newDriverID, routeID],
    function (err) {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }
      res.json({ message: "Driver changed successfully" });
    }
  );
});

// --------------------- DRIVER APIs ---------------------

// ✅ Get Driver Route + Stops
app.get("/driver-route/:driverID", (req, res) => {
  const { driverID } = req.params;

  db.get(
    "SELECT * FROM driverRoutes WHERE driverID = ?",
    [driverID],
    (err, route) => {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }

      if (!route)
        return res.status(404).json({ message: "No route assigned" });

      db.all(
        "SELECT stopName, arrivalTime, departureTime FROM busStops WHERE routeID = ? ORDER BY arrivalTime ASC",
        [route.routeID],
        (err, stops) => {
          if (err) {
            console.error("DB Error:", err.message);
            return res.status(500).json({ message: "DB Error" });
          }

          res.json({
            routeName: route.routeName,
            busStops: stops,
          });
        }
      );
    }
  );
});

// --------------------- DASHBOARD HELPER APIs ---------------------

// ✅ Get All Drivers
app.get("/drivers", (req, res) => {
  db.all(
    "SELECT userID, username FROM users WHERE role = 'driver'",
    [],
    (err, rows) => {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }
      res.json(rows);
    }
  );
});

// ✅ Get All Routes
app.get("/routes", (req, res) => {
  db.all(
    "SELECT routeID, routeName, driverID FROM driverRoutes",
    [],
    (err, rows) => {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }
      res.json(rows);
    }
  );
});

// ✅ Get Bus Stops for a Route
app.get("/bus-stops/:routeID", (req, res) => {
  const { routeID } = req.params;

  db.all(
    "SELECT stopID, stopName, arrivalTime, departureTime FROM busStops WHERE routeID = ? ORDER BY arrivalTime ASC",
    [routeID],
    (err, rows) => {
      if (err) {
        console.error("DB Error:", err.message);
        return res.status(500).json({ message: "DB Error" });
      }
      res.json(rows);
    }
  );
});

// --------------------- SERVER START ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);