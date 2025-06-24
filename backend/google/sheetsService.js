const { google, getAuthClient } = require("./googleClient");

/**
 * Appends form data to the next free row in a Google Sheet.
 * @param {string} sheetId - The ID of the Google Sheet.
 * @param {string} range - The range to append (e.g., 'Sheet1!A1').
 * @param {object} formData - The object containing form fields and values.
 */
const updateFormDataById = async (id, data) => {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: "1paQg1NOPqbMyAFws4e0BwDnvjYWZYgEGwLY1hyrBPao",
      range: "Master Sheet!A:A", // Only column A
    });

    const rows = getResponse.data.values || [];

    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      console.log(`ID '${id}' not found in Column A.`);
      return;
    }

    const targetRow = rowIndex + 1;

    const updateRange = `Master Sheet!I${targetRow}:K${targetRow}`;
    const updateValues = [[data.dob, data.mobileNo, data.NIN]];

    // Convert formData object to an array of values

    await sheets.spreadsheets.values.update({
      spreadsheetId: "1paQg1NOPqbMyAFws4e0BwDnvjYWZYgEGwLY1hyrBPao",
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: updateValues,
      },
    });

    console.log(`Row ${targetRow} updated successfully for ID '${id}'`);
  } catch (error) {
    console.error("Error updating sheet", error);
    throw error;
  }
};

const updateSubmissionStatusInSheet = async (id) => {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = "1paQg1NOPqbMyAFws4e0BwDnvjYWZYgEGwLY1hyrBPao";
    const sheetName = "Master Sheet";

    // 1. Get all values in Column A
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = getResponse.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      console.warn(`ID '${id}' not found in Column A of the sheet.`);
      return;
    }

    const targetRow = rowIndex + 1; // 1-based indexing in Sheets
    const updateRange = `${sheetName}!F${targetRow}`;
    const updateValues = [["Submitted"]];

    // 2. Update Column F
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: updateValues },
    });

    console.log(`✅ Sheet updated: Row ${targetRow}, Column F = "Submitted"`);
  } catch (error) {
    console.error("❌ Error updating Google Sheet:", error);
  }
};

module.exports = { updateFormDataById, updateSubmissionStatusInSheet };
