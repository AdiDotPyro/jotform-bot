import puppeteer from "puppeteer";
import fs from "fs";
import csvParser from "csv-parser"; // for reading Google Sheet exported as CSV

// ===== CONFIG =====
const FORM_URL = "https://form.jotform.com/YOUR_FORM_ID"; // replace with your Jotform public URL
const CSV_FILE = "submissions.csv"; // export your Google Sheet as CSV

// ===== READ CSV DATA =====
async function readCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_FILE)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

// ===== MAIN FUNCTION =====
async function main() {
  const browser = await puppeteer.launch({ headless: false }); // headless:true for invisible mode
  const page = await browser.newPage();

  const submissions = await readCSV();
  console.log(`Loaded ${submissions.length} submissions`);

  for (let i = 0; i < submissions.length; i++) {
    const row = submissions[i];
    console.log(`Submitting #${i + 1}:`, row);

    await page.goto(FORM_URL, { waitUntil: "networkidle2" });

    // === Fill form fields ===
    // These selectors depend on your Jotform field IDs (inspect form in browser to confirm)
    if (row.q1_fullname) {
      await page.type("input[name='q1_fullname[first]']", row.q1_fullname.split(" ")[0] || "");
      await page.type("input[name='q1_fullname[last]']", row.q1_fullname.split(" ")[1] || "");
    }
    if (row.q2_email) {
      await page.type("input[name='q2_email']", row.q2_email);
    }
    if (row.q3_phone) {
      await page.type("input[name='q3_phone[full]']", row.q3_phone);
    }

    // === Submit form ===
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log(`✅ Submission ${i + 1} completed`);

    // OPTIONAL: wait a bit before next submission to look natural
    await page.waitForTimeout(2000);
  }

  await browser.close();
}

main().catch((err) => console.error("❌ Error:", err));
