import { QueueClient } from "@azure/storage-queue";

export default async function (context, req) {
  try {
    const { routeName, stopName, mobileNo, note } = req.body || {};
    if (!routeName || !stopName || !mobileNo) {
      context.res = { status: 400, body: { message: "routeName, stopName, mobileNo required" } };
      return;
    }

    const queueClient = new QueueClient(process.env.AZURE_STORAGE_QUEUE_CONN, process.env.DELAY_QUEUE_NAME);
    await queueClient.createIfNotExists();
    const payload = Buffer.from(JSON.stringify({
      type: "USER_REPORT_LATE",
      routeName, stopName, mobileNo, note: note || null, ts: Date.now()
    })).toString("base64");
    await queueClient.sendMessage(payload);

    context.res = { status: 202, body: { message: "Report accepted" } };
  } catch (e) {
    context.log.error(e);
    context.res = { status: 500, body: { message: "Function error" } };
  }
}


