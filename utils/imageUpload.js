const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const s3Client = new S3Client({
  region: process.env.REGION_AWS, // e.g., 'us-west-2'
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

exports.upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.BUCKET_NAME,
    // metadata : (req, file, cb) => {
    //   cb(null, { fieldName: file.fieldname });
    // },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, Date.now().toString() + "-" + file.originalname);
    },
  }),
});

exports.deleteFileFromS3 = async (fileKey) => {
  try {
    const deleteParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    };

    const command = new DeleteObjectCommand(deleteParams);
    const response = await s3Client.send(command);

    return response; // Or handle response as needed
  } catch (error) {
    throw error; // Or handle the error as needed
  }
};
