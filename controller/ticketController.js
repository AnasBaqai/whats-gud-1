const {
  createTicket,
  countTickets,
  updateTicket,
  findTicket,
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
  try {
    const body = parseBody(req.body);
    const { eventId, price, quantity } = body;
    const userId = req.user.id;

    // Check for valid quantity
    if (quantity <= 0) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Invalid ticket quantity",
      });
    }

    // Check if event capacity is full
    const event = await findEvent({ _id: mongoose.Types.ObjectId(eventId) });
    const ticketsBought = await countTickets({
      eventId: mongoose.Types.ObjectId(eventId),
    });

    if (ticketsBought + quantity > event.capacity) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Event capacity will be exceeded with this purchase",
      });
    }

    let tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketId = new mongoose.Types.ObjectId();
      const ticketIdString = ticketId.toString();
      const barcode = await generateBarcode(ticketIdString);
      const barcodeUrl = await s3Uploadv3([barcode]);
      const newTicket = {
        _id: ticketId,
        userId,
        eventId,
        price,
        barcode: barcodeUrl[0],
      };
      const { error } = ticketValidation.validate(newTicket);
      if (error) {
        await deleteImage([barcodeUrl]);
        // If error occurs, rollback any tickets already created in this loop
        for (let createdTicket of tickets) {
          await deleteTicket({ _id: createdTicket._id });
          await deleteImage([createdTicket.barcode]);
        }
        return next({
          statusCode: STATUS_CODES.BAD_REQUEST,
          message: error.message,
        });
      }
      const ticket = await createTicket(newTicket);
      tickets.push(ticket);
    }
    return generateResponse(tickets, "Tickets created successfully", res);
  } catch (error) {
    console.log(error.message);
    // Rollback in case of any error
    for (let ticket of tickets) {
      await deleteTicket({ _id: ticket._id });
      await deleteImage([ticket.barcode]);
    }
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

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
