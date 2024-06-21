const fs = require("fs");
const { google } = require("googleapis");
const path = require("path");

// Load OAuth2 client credentials
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

// Load credentials
fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.error("Error loading client secret file:", err);

  authorize(JSON.parse(content), uploadFile);
});

// Authorize the client with credentials
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    "http://localhost:3000/oauth2callback"
  );

  // Check if token already exists
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

// Get and store new token
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.question("Enter the code from that page here: ", (code) => {
    readline.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// Upload file to Google Drive
function uploadFile(auth) {
  const drive = google.drive({ version: "v3", auth });
  const filePath = "./dist/bundle.js"; // Replace with your file path
  const fileMetadata = { name: "bundle.js" };
  const media = {
    mimeType: "text/javascript",
    body: fs.createReadStream(filePath),
  };

  drive.files.create(
    {
      resource: fileMetadata,
      media: media,
      fields: "id",
    },
    (err, file) => {
      if (err) {
        console.error("Error uploading file:", err);
      } else {
        console.log("File Id:", file.data.id);
        console.log(
          `File uploaded successfully. Access it at: https://drive.google.com/uc?export=view&id=${file.data.id}`
        );
      }
    }
  );
}
