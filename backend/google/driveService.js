const { google, getAuthClient } = require("./googleClient");

const createFolder = async (name) => {
  const auth = await getAuthClient();
  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    parents: ["1vNhUih6snKyOyL7KjrjTzpFhANg3w43A"],
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    fields: "id, webViewLink",
  });
  // const folderInfo = await drive.files.get({
  //   fileId: res.data.id,
  //   fields: "id, name, parents",
  // });
  // console.log("Created Folder Location:", folderInfo.data);

  return res.data;
};

module.exports = createFolder;
