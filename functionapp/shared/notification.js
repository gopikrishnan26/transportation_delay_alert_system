export async function sendSmsBatch(messages) {
  for (const m of messages) {
    console.log(`[SMS] to ${m.mobileNo} | ${m.text}`);
  }
}


