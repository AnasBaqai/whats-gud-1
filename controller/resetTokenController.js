const bcrypt = require("bcrypt");
const {
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
} = require("../models/resetTokenModel"); // Path to your PasswordReset model
const { generateResetToken, parseBody, generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { findUser } = require("../models/userModel");
const { sendResetEmail } = require("../utils");
const { resetPasswordValidation } = require("../validation/userValidation");
const saltRounds = parseInt(process.env.SALT_ROUNDS);

const providePasswordResetToken = async (userId) => {
  const token = generateResetToken();
  const expires = new Date(Date.now() + 3600000); // 1 hour from now
  const tokenGranted = await findPasswordResetToken({ user: userId });
  if (tokenGranted) {
    await deletePasswordResetToken({ user: userId });
  }

  const passwordReset = await createPasswordResetToken({
    user: userId,
    token: token,
    expires: expires,
  });

  return token;
};
exports.mailToken = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await findUser({ email });

    if (!user) {
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "User not found.",
      });
    }

    const token = await providePasswordResetToken(user._id);
    await sendResetEmail(email, token, user._id); // sendResetEmail needs to be implemented

    return generateResponse(null, "Password reset email sent.", res);
  } catch (error) {
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: error.message,
    });
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const { token, userId } = req.query;
    const passwordReset = await findPasswordResetToken({
      user: userId,
      token: token,
      expires: { $gt: Date.now() },
    });

    if (!passwordReset) {
      return res.render("index", {
        mainMessage: "sorry",
        message: "invalid or expired link",
      });
      // return next({
      //   statusCode: STATUS_CODES.NOT_FOUND,
      //   message: "Invalid or expired password reset token.",
      // });
    }
    if (passwordReset.isVerified) {
      return res.render("index", {
        mainMessage: "sorry",
        message: "the link has already been used",
      });
      // return next({
      //   statusCode: STATUS_CODES.BAD_REQUEST,
      //   message: "the link has been used.",
      // });
    }
    passwordReset.isVerified = true;
    await passwordReset.save();
    return res.render("index", {
      mainMessage: "You are verified",
      message: "you can proceed for password reset.",
    });
    // return generateResponse(
    //   { verified: true, userId: passwordReset.userId },
    //   "Password reset token verified.",
    //   res
    // );
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

exports.verifyconfirmation = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { email } = body;
    const user = await findUser({ email });
    const passwordReset = await findPasswordResetToken({
      user: user._id,
    });
    if (!passwordReset.isVerified) {
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "please verify from link first.",
        isVarified: false,
      });
    }
    return generateResponse(
      { verified: true, userId: passwordReset.userId },
      "Password reset token verified.",
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

exports.resetPassword = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { password, email } = body;
    const user = await findUser({ email });

    // const passwordReset = await findPasswordResetToken({
    //   user: user._id,
    // });

    // if (!passwordReset.isVerified) {
    //   return next({
    //     statusCode: STATUS_CODES.NOT_FOUND,
    //     message: "please verify from link first.",
    //     isVarified:false
    //   });
    // }
    const { error } = resetPasswordValidation.validate({
      password,
      confirmPassword: password,
    });
    if (error)
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: error.message,
      });
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    user.password = hashedPassword;

    await user.save();
    await deletePasswordResetToken({ user: user._id });
    return generateResponse(
      { success: true },
      "Password has been reset successfully",
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
