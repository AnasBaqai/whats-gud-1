const bwipjs = require("bwip-js");

exports.generateBarcode = (ticketId) => {
  return new Promise((resolve, reject) => {
    // Convert ticketId to a string if it's not already
    const barcodeString = String(ticketId);

    bwipjs.toBuffer(
      {
        bcid: "qrcode", // Barcode type
        text: barcodeString, // Text to encode
        scale: 3, // 3x scaling factor
        height: 10, // Bar height, in millimeters
        includetext: true, // Show human-readable text
        textxalign: "center", // Always good to set this
      },
      function (err, png) {
        if (err) {
          reject(err);
        } else {
          // Resolve with a base64 encoded image
          resolve(png.toString("base64"));
        }
      }
    );
  });
};
