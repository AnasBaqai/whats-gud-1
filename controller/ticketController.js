const {
  createTicket,
  countTickets,
  updateTicket,
  findTicket,
  deleteTicket,
  findManyTickets,
} = require("../models/ticketModel");
const { generateBarcode } = require("../utils/barcodeGenerator");
const { generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { parseBody } = require("../utils");
const mongoose = require("mongoose");
const { s3Uploadv3, deleteImage } = require("../utils/s3Upload");
const { findEvent } = require("../models/eventModel");
const { TICKET_STATUS } = require("../utils/constants");
const { ticketValidation } = require("../validation/ticketValidation");
const { updateUser, findUser } = require("../models/userModel");
const { getUserTicketsQuery } = require("./queries/ticketQueries");
const stripe = require("stripe")(
  "sk_test_51OUd7mHbqQR9UTxNCpWRsgtfoDlQSI5EFOm6vKrjz6F5rWb6y96zkpigrVK4ib1rHUQJz7lNUAhfNofL2zfuy8xb0095zYWfAX"
);

// exports.createNewTicket = async (req, res, next) => {
//   const { eventId, price, quantity } = req.body;
//   const userId = req.user.id;

//   // Validate quantity
//   if (quantity <= 0) {
//     return next({
//       statusCode: STATUS_CODES.BAD_REQUEST,
//       message: "Invalid ticket quantity",
//     });
//   }

//   try {
//     const eventIdObj = mongoose.Types.ObjectId(eventId);
//     const event = await findEvent({ _id: eventIdObj });
//    // const eventCreator = event.creator
//    // const eventCreatorStripeAccountId = findUser({_id:mongoose.Types.ObjectId(eventCreator)}).stripeAccountId
//     const ticketsBought = await countTickets({ eventId: eventIdObj });

//     // Check event capacity
//     if (ticketsBought + quantity > event.capacity) {
//       return next({
//         statusCode: STATUS_CODES.BAD_REQUEST,
//         message: "Event capacity will be exceeded",
//       });
//     }

//     let tickets = [];
//     for (let i = 0; i < quantity; i++) {
//       const newTicket = await createAndValidateTicket(
//         userId,
//         eventIdObj,
//         price
//       );
//       if (newTicket.error) {
//         // Rollback logic
//         await rollbackTickets(tickets);
//         return next({
//           statusCode: STATUS_CODES.BAD_REQUEST,
//           message: newTicket.error,
//         });
//       }
//       tickets.push(newTicket);
//     }
//     // const totalPrice = price * quantity;

//     //Create a payment intent with Stripe Connect transfer
//     // const paymentIntent = await stripe.paymentIntents.create({
//     //   amount: totalPrice * 100, // Stripe expects amount in cents
//     //   currency: 'usd', // Set your currency
//     //   payment_method: paymentMethodId,
//     //   confirm: true, // Automatically confirm the payment
//     //   transfer_data: {
//     //     destination: eventCreatorStripeAccountId, // Event creator's connected Stripe account ID
//     //   },
//     //   // Optionally, add an application fee if you're taking a cut
//     //   application_fee_amount: 0/* your application fee amount */,
//     // });
//     //console.log(paymentIntent);
//     return generateResponse(tickets, "Tickets created successfully", res);
//   } catch (error) {
//     // Rollback in case of any error
//     await rollbackTickets(tickets);
//     console.error(error); // Consider more selective logging
//     return next({
//       statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
//       message: "Internal server error",
//     });
//   }
// };

// async function createAndValidateTicket(userId, eventId, price) {
//   const ticketId = new mongoose.Types.ObjectId();
//   const barcode = await generateBarcode(ticketId.toString());
//   const barcodeUrl = await s3Uploadv3([barcode]);
//   const ticketData = {
//     _id: ticketId,
//     userId,
//     eventId,
//     price,
//     barcode: barcodeUrl[0],
//   };

//   const { error } = ticketValidation.validate(ticketData);
//   if (error) {
//     await deleteImage([barcodeUrl]);
//     return { error: error.message };
//   }
//   const ticket = await createTicket(ticketData);
//   return ticket;
// }

// async function rollbackTickets(tickets) {
//   for (let ticket of tickets) {
//     await deleteTicket({ _id: ticket._id });
//     await deleteImage([ticket.barcode]);
//   }
// }
exports.createNewTicket = async (req, res, next) => {
  const { eventId, price, quantity } = req.body;
  const userId = req.user.id;

  // Validate quantity
  if (quantity <= 0) {
    return next({
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: "Invalid ticket quantity",
    });
  }

  try {
    const eventIdObj = mongoose.Types.ObjectId(eventId);
    const event = await findEvent({ _id: eventIdObj });

    const ticketsBought = await countTickets({ eventId: eventIdObj });

    // Check event capacity
    if (ticketsBought + quantity > event.capacity) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Event capacity will be exceeded",
      });
    }

    const newTicket = await createAndValidateTicket(
      userId,
      eventIdObj,
      price,
      quantity
    );

    if (newTicket.error) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: newTicket.error,
      });
    }

    return generateResponse(newTicket, "Ticket created successfully", res);
  } catch (error) {
    console.error(error);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};
async function createAndValidateTicket(userId, eventId, price, quantity) {
  const ticketId = new mongoose.Types.ObjectId();
  const barcode = await generateBarcode(ticketId.toString());
  const barcodeUrl = await s3Uploadv3([barcode]);
  const ticketData = {
    _id: ticketId,
    userId,
    eventId,
    price,
    quantity,  // Add quantity here
    barcode: barcodeUrl[0],
  };

  const { error } = ticketValidation.validate(ticketData);
  if (error) {
    await deleteImage([barcodeUrl]);
    return { error: error.message };
  }
  const ticket = await createTicket(ticketData);
  return ticket;
}

exports.verifyTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.query;
    const ticket = await findTicket({ _id: mongoose.Types.ObjectId(ticketId) });
    if (!ticket) {
      return res.render("index", {
        mainMessage: "sorry",
        message: "Ticket not found",
      });
    }
    if (ticket.status === TICKET_STATUS.USED) {
      return res.render("index", {
        mainMessage: "sorry",
        message: "Ticket already used",
      });
    }
    await updateTicket(
      { _id: mongoose.Types.ObjectId(ticketId) },
      { status: TICKET_STATUS.USED }
    );
    return res.render("index", {
      mainMessage: "Hooray",
      message: "your ticket has been verified",
    });
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};

// get all users tickets sorted on createdAt
exports.getAllTickets = async (req, res, next) => {
  const userId = mongoose.Types.ObjectId(req.user.id);
  const query = getUserTicketsQuery(userId);
  try {
    const tickets = await findManyTickets(query);
    return generateResponse(tickets, "Tickets retrieved successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
};



exports.stripeOnBoarding = async (req, res, next) => {
  userId = req.user.id;
  try {
    const account = await stripe.accounts.create({ type: "express" });
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "http://localhost:5000/api/ticket/stripe/reauth",
      return_url: `http://localhost:5000/api/ticket/stripe/onboarding-complete?stripeUserId=${account.id}&userId=${userId}`,
      type: "account_onboarding",
    });

    return generateResponse(
      { url: accountLink.url },
      "Stripe onboarding url",
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

// reauth function
exports.reAuth = (req, res) => {
  // Redirect the user to the part of your app where they can restart the Stripe onboarding process
  res.redirect("http://localhost:5000/api/ticket/stripe/onboarding");
};

exports.onBoardingComplete = async (req, res) => {
  const { stripeUserId,userId } = req.query; // Assuming Stripe returns the user ID in the query


  try {
    const stripeAccount = await stripe.accounts.retrieve(stripeUserId);

    // Check if the Stripe account is properly set up
    if (stripeAccount.details_submitted) {
      // Update your database to mark this user's Stripe account as connected
      // Your database update logic here
      const updatedUser = await updateUser(
        { _id: mongoose.Types.ObjectId(userId) },
        {
          stripeAccountId: stripeUserId,
        }
      );

     res.render("index", {
        mainMessage: "Onboarding Process Completed",
        message: "Stripe account connected",
      })
    } else {
      // Handle cases where details were not submitted
      res.render("index", {
        mainMessage: "Onboarding Process interrupted",
        message: "Stripe account not connected try again ",
      })
    }
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    })
  }
};
