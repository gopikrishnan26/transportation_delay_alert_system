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

  console.log("Seeding: cleaning existing test data...");
  await pool.request().query(`DELETE FROM students_faculty;`);
  await pool.request().query(`DELETE FROM arrivals;`);
  await pool.request().query(`DELETE FROM busStops;`);
  await pool.request().query(`DELETE FROM driverRoutes;`);
  await pool.request().query(`DELETE FROM users WHERE role = 'driver';`);

  console.log("Seeding: inserting drivers (10)...");
  const driverIds = [];
  for (let i = 1; i <= 10; i++) {
    const username = `Driver ${i}`;
    const mobileNo = 9000000000 + i; // unique
    const password = "driver123";
    const insertRes = await pool.request()
      .input("username", username)
      .input("mobileNo", mobileNo)
      .input("password", password)
      .query(`
        INSERT INTO users (username, mobileNo, password, role)
        OUTPUT INSERTED.userID
        VALUES (@username, @mobileNo, @password, 'driver')
      `);
    driverIds.push(insertRes.recordset[0].userID);
  }

  console.log("Seeding: inserting routes (10) and assigning drivers...");
  const routeIds = [];
  for (let i = 1; i <= 10; i++) {
    const routeName = `Route ${i}`;
    const numStops = 5;
    const driverID = driverIds[i - 1];
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

    await pool.request()
      .input("routeID", routeID)
      .input("driverID", driverID)
      .query(`UPDATE driverRoutes SET driverID = @driverID WHERE routeID = @routeID`);
  }

  console.log("Seeding: inserting 5 bus stops per route (50 total)...");
  const stopNames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"];
  const routeIdToStops = new Map();
  for (let i = 0; i < routeIds.length; i++) {
    const routeID = routeIds[i];
    const stopsForRoute = [];
    for (let s = 0; s < 5; s++) {
      const stopName = `${stopNames[s]} Stop ${i + 1}`;
      // Base times vary per route for variety
      const baseHour = 7 + (i % 4); // 07..10
      const baseMinute = (i * 3) % 60; // spread minutes
      const arrivalTime = timeAdd(baseHour, baseMinute, s * 12); // every 12 mins
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

  console.log("Seeding: inserting subscribers (5 per stop, 250 total)...");
  let subCounter = 1;
  for (let i = 0; i < routeIds.length; i++) {
    const routeID = routeIds[i];
    const routeName = `Route ${i + 1}`;
    const stops = routeIdToStops.get(routeID) || [];
    for (const stop of stops) {
      for (let k = 0; k < 5; k++) {
        const isFaculty = (k % 2) === 1;
        const name = isFaculty ? `Faculty ${subCounter}` : `Student ${subCounter}`;
        const mobileNo = `8${pad2(i + 1)}${pad2(stop.stopID % 100)}${pad2(k + 1)}${pad2(subCounter % 100)}`.padEnd(10, '5');
        await pool.request()
          .input("name", name)
          .input("routeName", routeName)
          .input("stopName", stop.stopName)
          .input("mobileNo", mobileNo)
          .query(`
            INSERT INTO students_faculty (name, routeName, stopName, mobileNo)
            VALUES (@name, @routeName, @stopName, @mobileNo)
          `);
        subCounter++;
      }
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});


