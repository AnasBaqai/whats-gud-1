const bcrypt = require("bcrypt");
const { parseBody, generateResponse } = require("../utils");
const {
  findUser,
  generateToken,
  generateRefreshToken,
  createUser,
  updateUser,
} = require("../models/userModel");
const { STATUS_CODES } = require("../utils/constants");
const { findManyEventsByIds } = require("../models/eventTypeModel");
const {
  registerUserValidation,
  loginUserValidation,
} = require("../validation/authValidation");
const { createRelation, findRelation } = require("../models/relationModel");
const saltRounds = parseInt(process.env.SALT);

exports.googleLogin = async (accessToken, refreshToken, profile, done) => {
  const { id, displayName, emails, photos } = profile;
  const photo = photos[0].value;
  try {
    let user = await findUser({ googleId: profile.id });
    if (!user) {
      user = await createUser({
        googleId: id,
        firstName: displayName,
        email: emails[0].value,
        image: photo,
        // ... other profile information ...
      });
      await createRelation({ user: user._id });
    }

    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    // Add the token to the response
    res.setHeader("authorization", token);
    //add the refresh token to the user
    user.refreshToken = refreshToken;
    const updatedUser = await updateUser({ _id: user._id }, { refreshToken });
    //Return the token and the user object
    return generateResponse(
      { token, user: updatedUser },
      "signed in by google",
      res
    );
  } catch (error) {
    console.log(error);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

exports.facebookLogin = async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await findUser({ facebookId: profile.id });
    const { id, emails, photos, name } = profile;
    const photo = photos[0].value;
    const email = emails[0].value;
    const { givenName, familyName } = name;
    if (!user) {
      user = await createUser({
        facebookId: id,
        firstName: givenName,
        lastName: familyName,
        email,
        image: photo,
        // ... other profile information ...
      });
      await createRelation({ user: user._id });
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

exports.facebookCallback = async (req, res, next) => {
  try {
    const user = req.user;
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    // Add the token to the response
    res.setHeader("authorization", token);
    //add the refresh token to the user
    user.refreshToken = refreshToken;
    const updatedUser = await updateUser({ _id: user._id }, { refreshToken });
    //Return the token and the user object
    return generateResponse(
      { accessToken: token, user: updatedUser },
      "signed in by FACEBOOK",
      res
    );
  } catch (error) {
    console.log(error);
    next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// Function for user login
exports.loginUser = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { error } = loginUserValidation.validate(body);
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    // Retrieve the hashed password from the database
    const { email, password } = body;
    const user = await findUser({ email }).exec();
    if (!user) {
      return next({
        statusCode: STATUS_CODES.UNAUTHORIZED,
        message: "User does not exist",
      });
    }
    // bcrypt.compare is CPU-intensive but necessary for security
    if (!(await bcrypt.compare(password, user.password))) {
      return next({
        statusCode: STATUS_CODES.UNAUTHORIZED,
        message: "Invalid username or password",
      });
    }

    // const hashedPasswordFromDB = user.password; // Replace with actual retrieval logic

    // // Compare the provided password with the hashed password
    // const isPasswordMatch = await bcrypt.compare(
    //   password,
    //   hashedPasswordFromDB
    // );
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    // Add the token to the response
    res.setHeader("authorization", token);
    //add the refresh token to the user
    user.refreshToken = refreshToken;
    const updatedUser = await updateUser({ _id: user._id }, { refreshToken });
    // Return the token and the user object
    return generateResponse(
      { accessToken: token, user: updatedUser },
      "User authenticated",
      res
    );

    // if (isPasswordMatch) {
    //   // Passwords match, user is authenticated
    //   // Generate a token
    //   const token = generateToken(user);
    //   const refreshToken = generateRefreshToken(user);
    //   // Add the token to the response
    //   res.setHeader("authorization", token);
    //   //add the refresh token to the user
    //   user.refreshToken = refreshToken;
    //   const updatedUser = await updateUser({ _id: user._id }, { refreshToken });
    //   // Return the token and the user object
    //   return generateResponse(
    //     { accessToken: token, user: updatedUser },
    //     "User authenticated",
    //     res
    //   );
    //   // Add your logic for handling the authenticated user here
    // } else {
    //   // Passwords do not match, user is not authenticated
    //   // Return an error response
    //   return next({
    //     statusCode: STATUS_CODES.UNAUTHORIZED,
    //     message: "Invalid username or password",
    //   });
    // }
  } catch (error) {
    // Handle the error
    console.log(error);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

exports.registerUser = async (req, res, next) => {
  const body = parseBody(req.body);

  const { email, password } = body;
  // implement the logic of joi validation
  const { error } = registerUserValidation.validate(body);
  if (error)
    return next({
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: error.message,
    });
  // Check if the user already exists in the database
  const userExists = await findUser({ email });

  if (userExists)
    return next({
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: "User already exists",
    });
  try {
    // Hash the password

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user object
    const newUser = await createUser({
      email,
      password: hashedPassword,
    });
    // Save the new user to the database

    //create a refresh token
    const refreshToken = generateRefreshToken(newUser);
    newUser.refreshToken = refreshToken;
    const updatedUser = await updateUser(
      { _id: newUser._id },
      { refreshToken }
    );

    // Generate a token
    const token = generateToken(updatedUser);
    // Add the token to the response by setting it in with a name authorization
    res.setHeader("authorization", token);
    await createRelation({ user: updatedUser._id });
    // Return the token and the user object
    return generateResponse(
      { accessToken: token, user: updatedUser },
      "User signed Up",
      res
    );
  } catch (error) {
    // Return an error response
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
