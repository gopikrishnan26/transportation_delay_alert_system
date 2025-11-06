import { QueueClient } from "@azure/storage-queue";
import { getPool } from "../shared/db.js";

export default async function (context, myTimer) {
  try {
    const pool = await getPool();
    const threshold = parseInt(process.env.DELAY_MINUTES_THRESHOLD || "5", 10);
    const result = await pool.request().query(`
      SELECT a.routeID, a.stopID, a.delayMinutes, s.stopName, r.routeName
      FROM arrivals a
      JOIN busStops s ON s.stopID = a.stopID
      JOIN driverRoutes r ON r.routeID = a.routeID
      WHERE a.actualArrival > DATEADD(minute, -10, SYSUTCDATETIME())
        AND a.delayMinutes > ${threshold}
    `);

    if (!result.recordset || result.recordset.length === 0) return;

    const queue = new QueueClient(process.env.AZURE_STORAGE_QUEUE_CONN, process.env.DELAY_QUEUE_NAME);
    await queue.createIfNotExists();

    for (const row of result.recordset) {
      const payload = Buffer.from(JSON.stringify({
        type: "DELAY_DETECTED",
        routeID: row.routeID,
        routeName: row.routeName,
        stopID: row.stopID,
        stopName: row.stopName,
        delayMinutes: row.delayMinutes,
        ts: Date.now()
      })).toString("base64");
      await queue.sendMessage(payload);
    }
  } catch (e) {
    context.log.error(e);
  }
}


