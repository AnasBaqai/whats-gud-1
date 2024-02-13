const bwipjs = require("bwip-js");

exports.generateBarcode = (ticketId) => {
  return new Promise((resolve, reject) => {
    // Create a unique string for barcode using userId and eventId
    const barcodeString = `${process.env.BASE_URL}/api/ticket/barcode/verify?ticketId=${ticketId}`

    bwipjs.toBuffer(
      {
        bcid: 'qrcode',            // Barcode type
        text: barcodeString,       // Text to encode
        scale: 10,                 // Increase scale for higher resolution
        height: 10,                // Bar height in millimeters
        width: 10,                 // Bar width in millimeters, may be omitted if square QR code is desired
        includetext: false,        // Exclude human-readable text
        textxalign: 'center',      // Center-align text
        paddingwidth: 20,          // Increase padding - quiet zone
        paddingheight: 20          // Increase padding - quiet zone
      },
      function (err, pngBuffer) {
        if (err) {
          reject(err);
        } else {
          // If you prefer a base64 string, you can convert the buffer
          // const base64Data = pngBuffer.toString("base64");
          resolve(pngBuffer);
        }
      }
    );
  });
};
