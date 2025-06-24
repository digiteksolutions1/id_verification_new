const { google, getAuthClient } = require("./googleClient");

// const createGoogleDoc = async (title, folderId) => {
//   const auth = await getAuthClient();
//   const drive = google.drive({ version: "v3", auth });

//   const fileMetadata = {
//     name: title,
//     mimeType: "application/vnd.google-apps.document",
//     parents: [folderId],
//   };

//   const file = await drive.files.create({
//     resource: fileMetadata,
//     fields: "id, webViewLink",
//   });
//   return file.data;
// };

async function saveToGoogleDoc(requests, title, parentId) {
  const auth = await getAuthClient();
  const drive = google.drive({ version: "v3", auth });
  const docs = google.docs({ version: "v1", auth });

  // Step 1: Create a new Google Doc directly inside the parent folder
  const fileMetadata = {
    name: title || "Quote",
    mimeType: "application/vnd.google-apps.document",
    parents: parentId ? [parentId] : [],
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    fields: "id, name",
  });

  const documentId = file.data.id;

  // Step 2: Insert formatted content into the document
  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests, // ✅ Correct field name
    },
  });

  // Step 3: Get and return the document link
  const fileMeta = await drive.files.get({
    fileId: documentId,
    fields: "webViewLink",
  });

  return {
    documentId,
    link: fileMeta.data.webViewLink,
  };
}

async function duplicateFile(originalFileId, parentFolderId, newTitle) {
  const auth = await getAuthClient();
  const drive = google.drive({ version: "v3", auth });

  const copiedFile = await drive.files.copy({
    fileId: originalFileId,
    requestBody: {
      name: newTitle,
      parents: [parentFolderId],
    },
    fields: "webViewLink",
  });

  console.log("File duplicated with ID:", copiedFile.data);
  return copiedFile.data;
}

async function overwriteAnnexSection(docId, requests) {
  try {
    // Validate inputs
    if (typeof docId !== "string") {
      throw new Error("docId must be a string");
    }

    // Ensure htmlContent is a string
    // const htmlString = String(htmlContent || "");

    const auth = await getAuthClient();
    const docs = google.docs({ version: "v1", auth });

    // Get the document
    const doc = await docs.documents.get({ documentId: docId });

    // Execute the batch update
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });

    console.log("Successfully updated ANNEX 1 section");
    return { success: true };
  } catch (error) {
    console.error("Error in overwriteAnnexSection:", error);
    throw error; // Re-throw for caller to handle
  }
}

module.exports = {
  duplicateFile,
  overwriteAnnexSection,
  saveToGoogleDoc,
};

// module.exports = saveToGoogleDoc;
