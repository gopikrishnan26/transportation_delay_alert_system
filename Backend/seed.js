import { poolPromise } from "./database.js";

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function timeAdd(baseHour, baseMinute, addMinutes) {
  const base = new Date();
  base.setHours(baseHour, baseMinute, 0, 0);
  const t = new Date(base.getTime() + addMinutes * 60000);
  return `${pad2(t.getHours())}:${pad2(t.getMinutes())}`;
}

async function run() {
  const pool = await poolPromise;

  try {
    console.log("Seeding: cleaning existing test data...");
    // keep order for FK constraints
    await pool.request().query(`DELETE FROM students_faculty;`);
    await pool.request().query(`DELETE FROM arrivals;`);
    await pool.request().query(`DELETE FROM busStops;`);
    await pool.request().query(`DELETE FROM driverRoutes;`);
    // remove drivers and subscribers/users of these roles
    await pool.request().query(`DELETE FROM users WHERE role IN ('driver','student','faculty');`);

    // Insert drivers
    console.log("Seeding: inserting drivers (10)...");
    const driverIds = [];
    for (let i = 1; i <= 10; i++) {
      const username = `Driver ${i}`;
      const mobileNo = 9000000000 + i;
      const password = "driver123";
      const insertRes = await pool.request()
        .input("username", username)
        .input("mobileNo", mobileNo)
        .input("password", password)
        .input("role", 'driver')
        .query(`
          INSERT INTO users (username, mobileNo, password, role)
          OUTPUT INSERTED.userID
          VALUES (@username, @mobileNo, @password, @role)
        `);
      driverIds.push(insertRes.recordset[0].userID);
    }

    // Insert routes and assign drivers
    console.log("Seeding: inserting routes (10) and assigning drivers...");
    const routeIds = [];
    for (let i = 1; i <= 10; i++) {
      const routeName = `Route ${i}`;
      const numStops = 5;
      const routeRes = await pool.request()
        .input("routeName", routeName)
        .input("numStops", numStops)
        .query(`
          INSERT INTO driverRoutes (routeName, numStops)
          OUTPUT INSERTED.routeID
          VALUES (@routeName, @numStops)
        `);
      const routeID = routeRes.recordset[0].routeID;
      routeIds.push(routeID);

      // assign driver to route
      const driverID = driverIds[i - 1];
      await pool.request()
        .input("routeID", routeID)
        .input("driverID", driverID)
        .query(`UPDATE driverRoutes SET driverID = @driverID WHERE routeID = @routeID`);
    }

    // Insert bus stops
    console.log("Seeding: inserting bus stops (5 per route)...");
    const stopNames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"];
    const routeIdToStops = new Map();
    for (let i = 0; i < routeIds.length; i++) {
      const routeID = routeIds[i];
      const stopsForRoute = [];
      for (let s = 0; s < 5; s++) {
        const stopName = `${stopNames[s]} Stop ${i + 1}`;
        const baseHour = 7 + (i % 4);
        const baseMinute = (i * 3) % 60;
        const arrivalTime = timeAdd(baseHour, baseMinute, s * 12);
        const stopRes = await pool.request()
          .input("routeID", routeID)
          .input("stopName", stopName)
          .input("arrivalTime", arrivalTime)
          .query(`
            INSERT INTO busStops (routeID, stopName, arrivalTime)
            OUTPUT INSERTED.stopID
            VALUES (@routeID, @stopName, @arrivalTime)
          `);
        stopsForRoute.push({ stopID: stopRes.recordset[0].stopID, stopName });
      }
      routeIdToStops.set(routeID, stopsForRoute);
    }

    // Insert students / faculty as users then reference in students_faculty
    console.log("Seeding: inserting students & faculty (as users) and mapping to students_faculty...");
    let subCounter = 1;
    for (let i = 0; i < routeIds.length; i++) {
      const routeID = routeIds[i];
      const routeName = `Route ${i + 1}`;
      const stops = routeIdToStops.get(routeID) || [];
      for (const stop of stops) {
        for (let k = 0; k < 5; k++) {
          const isFaculty = (k % 2) === 1;
          const role = isFaculty ? 'faculty' : 'student';
          const username = isFaculty ? `Faculty ${subCounter}` : `Student ${subCounter}`;
          // mobileNo generated to be unique
          const mobileNo = 80000000000 + (i * 10000) + (stop.stopID * 100) + (k * 10) + subCounter;
          const password = "subscriber123";

          // Create user
          const userRes = await pool.request()
            .input("username", username)
            .input("mobileNo", mobileNo)
            .input("password", password)
            .input("role", role)
            .query(`
              INSERT INTO users (username, mobileNo, password, role)
              OUTPUT INSERTED.userID
              VALUES (@username, @mobileNo, @password, @role)
            `);
          const userID = userRes.recordset[0].userID;

          // Map to students_faculty table using userID
          await pool.request()
            .input("userID", userID)
            .input("routeName", routeName)
            .input("stopName", stop.stopName)
            .query(`
              INSERT INTO students_faculty (userID, routeName, stopName)
              VALUES (@userID, @routeName, @stopName)
            `);

          subCounter++;
        }
      }
    }

    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
