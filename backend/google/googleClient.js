const { google } = require("googleapis");
const path = require("path");
const keyPath = path.join(__dirname, "./credentials.json");

const auth = new google.auth.GoogleAuth({
  keyFile: keyPath,
  scopes: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const getAuthClient = async () => {
  const authClient = await auth.getClient();
  return authClient;
};

module.exports = { google, getAuthClient };
