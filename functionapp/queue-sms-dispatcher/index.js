import { getPool } from "../shared/db.js";
import { sendSmsBatch } from "../shared/notification.js";

export default async function (context, queueItem) {
  const msg = typeof queueItem === "string" ? JSON.parse(queueItem) : queueItem;
  const pool = await getPool();

  if (msg.type === "DELAY_DETECTED") {
    const subs = await pool.request()
      .input("routeName", msg.routeName)
      .query(`SELECT name, mobileNo FROM students_faculty WHERE routeName = @routeName`);
    const messages = subs.recordset.map(s => ({
      mobileNo: s.mobileNo,
      text: `Delay on ${msg.routeName} at ${msg.stopName}: ${msg.delayMinutes} mins.`
    }));
    await sendSmsBatch(messages);
    return;
  }

  if (msg.type === "USER_REPORT_LATE") {
    const subs = await pool.request()
      .input("routeName", msg.routeName)
      .query(`SELECT name, mobileNo FROM students_faculty WHERE routeName = @routeName`);
    const messages = subs.recordset.map(s => ({
      mobileNo: s.mobileNo,
      text: `Reported late on ${msg.routeName} near ${msg.stopName}. We are investigating.`
    }));
    await sendSmsBatch(messages);
  }
}


