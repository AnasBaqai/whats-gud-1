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
const Mailer = require("../utils/mailer");
const { default: mongoose } = require("mongoose");
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
    console.log(error.message);
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
    console.log(error.message);
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
    if (!user.isActive) {
      return next({
        statusCode: STATUS_CODES.UNAUTHORIZED,
        message: "User is not verified",
      });
    }
    // bcrypt.compare is CPU-intensive but necessary for security
    if (!(await bcrypt.compare(password, user.password))) {
      return next({
        statusCode: STATUS_CODES.UNAUTHORIZED,
        message: "Invalid username or password",
      });
    }
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    // Add the token to the response
    res.setHeader("authorization", token);
    //add the refresh token to the user
    user.refreshToken = refreshToken;
    const updatedUser = await updateUser(
      { _id: user._id },
      { refreshToken }
    ).exec();
    // Return the token and the user object
    return generateResponse(
      { accessToken: token, user: updatedUser },
      "User authenticated",
      res
    );
  } catch (error) {
    // Handle the error
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
exports.registerUser = async (req, res, next) => {
  const body = parseBody(req.body);
  const { email, password } = body // Directly destructure email and password

  // Joi validation
  const { error } = registerUserValidation.validate({ email, password });
  if (error) {
    return next({
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: error.message,
    });
  }

  try {
    // Check if the user already exists in the database
    if (await findUser({ email }).exec()) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "User already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user and save to the database
    const newUser = await createUser({ email, password: hashedPassword });

    // Generate tokens
    const refreshToken = generateRefreshToken(newUser);
    const token = generateToken(newUser);

    // Update user with refreshToken asynchronously
    updateUser({ _id: newUser._id }, { refreshToken }).exec();

    // Set the token in the response header
    res.setHeader("authorization", token);

    // Optionally, create relations asynchronously if it's not required to wait for its completion
   await  createRelation({ user: newUser._id });
    const vericationUrl = `${process.env.BASE_URL}/api/auth/verify?userId=${newUser._id}`;
    const message = 'Thank you for signing up, please verify your email by clicking the link below \n\n' + vericationUrl + '\n\n'
    await Mailer.sendEmail({
      email: newUser.email,
      subject: "email verification",
      message: message,
    });
    // Return the token and the user object
    return generateResponse(
      { accessToken: token, user: newUser },
      "User signed Up",
      res
    );
  } catch (error) {
    console.error(error); // Consider more selective logging in production
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

exports.verifyUser = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const user = await findUser({ _id: mongoose.Types.ObjectId( userId) });
    if (!user) {
      return res.render("index", {
        mainMessage: "sorry",
        message: "account not found",
      });
    }
    if (user.isActive) {
      return res.render("index", {
        mainMessage: "YOU CAN LOGIN NOW",
        message: "your account is already verified",
      });
    }
    user.isActive = true;
    await user.save();
    return res.render("index", {
      mainMessage: "Your account is verified",
      message: "you can login now",
    });
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};
