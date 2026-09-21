const { google } = require("googleapis");

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      found: false,
      error: "Method not allowed"
    });
  }

  try {
    const memberId = String(req.query.memberId || "").trim();
    const studentId = String(req.query.studentId || "").trim();

    // Check that both fields are provided
    if (!memberId || !studentId) {
      return res.status(400).json({
        found: false,
        error: "Missing Membership ID or Student ID"
      });
    }

    // Connect to Google Sheets using the service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly"
      ]
    });

    const sheets = google.sheets({
      version: "v4",
      auth
    });

    // Read the Members sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Members!A:F"
    });

    const rows = response.data.values || [];

    // Search for matching Membership ID + Student ID
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const sheetMemberId = String(row[0] || "").trim();
      const sheetStudentId = String(row[2] || "").trim();

      if (
        sheetMemberId === memberId &&
        sheetStudentId === studentId
      ) {
        return res.status(200).json({
          found: true,
          memberId: sheetMemberId,
          status: String(row[5] || ""),
          membershipYear: String(row[4] || "")
        });
      }
    }

    // No matching member found
    return res.status(404).json({
      found: false
    });

  } catch (error) {
    console.error("API Error:", error);

    return res.status(500).json({
      found: false,
      error: "Server error"
    });
  }
};
