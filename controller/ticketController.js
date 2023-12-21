const {
  createTicket,
  countTickets,
  updateTicket,
  findTicket,
  deleteTicket
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



exports.createNewTicket = async (req, res, next) => {
  const { eventId, price, quantity } = req.body;
  const userId = req.user.id;

  // Validate quantity
  if (quantity <= 0) {
    return next({ statusCode: STATUS_CODES.BAD_REQUEST, message: "Invalid ticket quantity" });
  }

  try {
    const eventIdObj = mongoose.Types.ObjectId(eventId);
    const event = await findEvent({ _id: eventIdObj });
    const ticketsBought = await countTickets({ eventId: eventIdObj });

    // Check event capacity
    if (ticketsBought + quantity > event.capacity) {
      return next({ statusCode: STATUS_CODES.BAD_REQUEST, message: "Event capacity will be exceeded" });
    }

    let tickets = [];
    for (let i = 0; i < quantity; i++) {
      const newTicket = await createAndValidateTicket(userId, eventIdObj, price);
      if (newTicket.error) {
        // Rollback logic
        await rollbackTickets(tickets);
        return next({ statusCode: STATUS_CODES.BAD_REQUEST, message: newTicket.error });
      }
      tickets.push(newTicket);
    }
    return generateResponse(tickets, "Tickets created successfully", res);
  } catch (error) {
    // Rollback in case of any error
    await rollbackTickets(tickets);
    console.error(error); // Consider more selective logging
    return next({ statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, message: "Internal server error" });
  }
};

async function createAndValidateTicket(userId, eventId, price) {
  const ticketId = new mongoose.Types.ObjectId();
  const barcode = await generateBarcode(ticketId.toString());
  const barcodeUrl = await s3Uploadv3([barcode]);
  const ticketData = { _id: ticketId, userId, eventId, price, barcode: barcodeUrl[0] };

  const { error } = ticketValidation.validate(ticketData);
  if (error) {
    await deleteImage([barcodeUrl]);
    return { error: error.message };
  }
  const ticket = await createTicket(ticketData);
  return ticket;
}

async function rollbackTickets(tickets) {
  for (let ticket of tickets) {
    await deleteTicket({ _id: ticket._id });
    await deleteImage([ticket.barcode]);
  }
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
