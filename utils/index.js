"use strict";

const multer = require("multer");
const fs = require("fs");
//const FCM = require('fcm-node');

const { STATUS_CODES } = require("./constants");
const axios = require("axios");
const moment = require("moment");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const openAI = require("openai");

const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service provider
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});
exports.getReverseGeocodingData = async (latitude, longitude) => {
  const accessToken = process.env.MAP_BOX_API_KEY; // Replace with your Mapbox access token
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}&language=en`;

  try {
    const response = await axios.get(url);

    if (
      response.data &&
      response.data.features &&
      response.data.features.length > 0
    ) {
      const feature = response.data.features[0];

      let city, state, country;

      feature.context.forEach((item) => {
        if (item.id.startsWith("place")) {
          city = item.text;
        } else if (item.id.startsWith("region")) {
          state = item.text;
        } else if (item.id.startsWith("country")) {
          country = item.text;
        }
      });

      return {
        city: city,
        state: state,
        country: country,
      };
    }
    return "No address found";
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return "Error retrieving address";
  }
};

const apiKey = process.env.OPEN_AI_KEY; // Replace with your API key
const openai = new openAI({ apiKey: apiKey });

exports.queryChatGPT = async (message) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: message }],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

exports.getWeatherByCoordinates = async (latitude, longitude, date) => {
  const apiKey = process.env.WEATHER_API_KEY; // Replace with your API key
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    const forecastData = response.data;

    // Convert the desired date to the same format used in the API response
    const desiredDate = new Date(date).toISOString().split("T")[0];

    // Find the closest time slot to 12:00 PM on the desired date
    const dailyForecast = forecastData.list.find((forecast) => {
      const forecastDate = new Date(forecast.dt * 1000)
        .toISOString()
        .split("T")[0];
      const forecastTime = new Date(forecast.dt * 1000)
        .toISOString()
        .split("T")[1];
      return (
        forecastDate === desiredDate && forecastTime.startsWith("12:00:00")
      );
    });

    if (!dailyForecast) {
      throw new Error("Forecast for the desired date is not available.");
    }

    return {
      date: desiredDate,
      temperature: dailyForecast.main.temp,
      generalCondition: dailyForecast.weather[0].main,
      weather: dailyForecast.weather[0].description,
      humidity: dailyForecast.main.humidity,
      windSpeed: dailyForecast.wind.speed,
      // Add more fields as needed
    };
  } catch (error) {
    console.error("Error fetching weather forecast data:", error);
    return null;
  }
};

exports.generateResponse = (data, message, res, code = 200) => {
  return res.status(code).json({
    message,
    data,
  });
};

exports.parseBody = (body) => {
  let obj;
  if (typeof body === "object") obj = body;
  else obj = JSON.parse(body);
  return obj;
};

exports.generateRandomOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

exports.generateResetToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

exports.sendResetEmail = async (email, token, userId) => {
  const resetUrl = `https://whatsgud.cyclic.app/api/reset/token/verify?token=${token}&userId=${userId}`;

  const mailOptions = {
    to: email,
    from: process.env.GMAIL_USER,
    subject: "Password Reset",
    text:
      `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
      `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
      `${resetUrl}\n\n` +
      `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  };

  await transporter.sendMail(mailOptions);
};

exports.upload = (folderName) => {
  return multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const path = `uploads/${folderName}/`;
        fs.mkdirSync(path, { recursive: true });
        cb(null, path);
      },

      // By default, multer removes file extensions so let's add them back
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "." + file.originalname.split(".").pop());
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB //
    fileFilter: (req, file, cb) => {
      // check mime type
      if (
        !file.mimetype.match(
          /image\/(jpg|JPG|webp|jpeg|JPEG|png|PNG|gif|GIF|jfif|JFIF)/
        )
      ) {
        req.fileValidationError = "Only image files are allowed!";
        return cb(null, false);
      }
      cb(null, true);
    },
  });
};

exports.sendNotificationToAll = ({ body, fcmTokens }) => {
    const serverKey = process.env.FIREBASE_SERVER_KEY;
    const fcm = new FCM(serverKey);
    const title = process.env.APP_NAME;

    const message = {
        // the registration tokens of the devices you want to send the message to
        registration_ids: [...fcmTokens],
        notification: { title, body },
    };

    fcm.send(message, function (err, response) {
        if (err) {
            console.log("FCM - Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
}

exports.sendNotification = ({
  title,
  body,
  fcmToken,
  data,
  priority = "normal",
}) => {
  const serverKey = process.env.FIREBASE_SERVER_KEY;
  const fcm = new FCM(serverKey);

  const message = {
    to: fcmToken,
    priority,
    notification: {
      title,
      body,
    },
    data,
  };

  // Send the notification
  fcm.send(message, (error, response) => {
    if (error) {
      console.error("Error sending notification:", error);
    } else {
      console.log("Notification sent successfully:", response);
    }
  });
};

// pagination with mongoose paginate library
exports.getMongoosePaginatedData = async ({
  model,
  page = 1,
  limit = 10,
  query = {},
  populate = "",
  select = "-password",
  sort = { createdAt: -1 },
}) => {
  const options = {
    select,
    sort,
    populate,
    lean: true,
    page,
    limit,
    customLabels: {
      totalDocs: "totalItems",
      docs: "data",
      limit: "perPage",
      page: "currentPage",
      meta: "pagination",
    },
  };

  const { data, pagination } = await model.paginate(query, options);
  return { data, pagination };
};

// aggregate pagination with mongoose paginate library
exports.getMongooseAggregatePaginatedData = async ({
  model,
  page = 1,
  limit = 10,
  query = [],
  populate = "",
  select = "-password",
  sort = { dateAndTime: 1, createdAt: -1 },
}) => {
  const options = {
    select,
    sort,
    populate,
    lean: true,
    page,
    limit,
    customLabels: {
      totalDocs: "totalItems",
      docs: "data",
      limit: "perPage",
      page: "currentPage",
      meta: "pagination",
    },
  };

  const myAggregate = model.aggregate(query);
  const { data, pagination } = await model.aggregatePaginate(
    myAggregate,
    options
  );
  return { data, pagination };
};

exports.formatDate = (date) => moment(date).format("DD-MM-YYYY");

exports.formatTime = (date) => moment(date).format("HH:mm:ss");

exports.formatDateTime = (date) => moment(date).format("DD-MM-YYYY HH:mm:ss");
