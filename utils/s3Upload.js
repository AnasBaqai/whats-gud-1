const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  S3,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const uuid = require("uuid").v4;
const storage = multer.memoryStorage();

function config() {
  return {
    region: process.env.REGION_AWS, // e.g., 'us-west-2'
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
  };
}

const fileFilter = (req, file, cb) => {
  try {
    if (file.mimetype.split("/")[0] === "image") {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
  } catch (e) {
    console.log(e);
    // res.json(error("Server Error", e));
  }
};

// ["image", "jpeg"]

exports.upload = multer({
  storage,
  fileFilter,
  // limits: { fileSize: 2000000, files: 4 },
});

exports.s3Uploadv3 = async (files, base64 = false) => {
  try {
    const s3client = new S3Client(config());
    let keys = [];
    let key = "";
    let buf;
    const params = files.map((file) => {
      if (base64) {
        buf = Buffer.from(
          file.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
      }
      key = `uploads/${uuid()}-${base64 ? ".png" : file.originalname}`;
      return {
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: base64 ? buf : file.buffer,
        ContentEncoding: "base64",
        ContentType: "image/png",
      };
    });

    await Promise.all(
      params.map((param) =>
        s3client.send(new PutObjectCommand(param)).then((v) => {
          keys.push(param.Key);
        })
      )
    );
    return keys;
  } catch (e) {
    console.log(e);
  }
};

const mimeTypeToExtension = (mimeType) => {
  const mimeMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "video/mp4": ".mp4",
    // add more mappings as necessary
  };
  return mimeMap[mimeType] || "";
};

exports.provideSignedUrl = async (req, res) => {
  try {
    const mimeType = req.query.mimeType; // MIME type from the query
    const fileExtension = mimeTypeToExtension(mimeType);
    const key = `uploads/${uuid()}${fileExtension}`;
    const s3client = new S3Client(config());
    // Create a command to put an object
    const putCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: mimeType, // Set ContentType based on the query parameter
      // additional settings can be provided here (like ContentType)
    });

    // Generate a pre-signed URL for putObject
    const url = await getSignedUrl(s3client, putCommand, { expiresIn: 600 });

    res.json({ key, url });
  } catch (error) {
    console.error("Error generating pre-signed URL", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteImage = async (images) => {
  try {
    if (images.length != 0 && images[0] == null) return;
    const s3 = new S3Client(config());

    const params = images.map((file) => {
      return {
        Bucket: process.env.BUCKET_NAME,
        Key: file,
      };
    });

    return await Promise.all(
      params.map((param) => s3.send(new DeleteObjectCommand(param)))
    );
  } catch (e) {
    console.log(e);
  }
};
