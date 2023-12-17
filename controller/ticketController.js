const { createTicket, countTickets,updateTicket, findTicket } = require("../models/ticketModel");
const { generateBarcode } = require("../utils/barcodeGenerator");
const { generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { parseBody } = require("../utils");
const mongoose = require("mongoose");
const { s3Uploadv3 } = require("../utils/s3Upload");
const { findEvent } = require("../models/eventModel");
const {TICKET_STATUS}= require("../utils/constants"); 

exports.createNewTicket = async (req, res, next) => {
  try {
    const body = parseBody(req.body);
    const { eventId, price } = body;
    const userId = req.user.id;

    // Generate a new ObjectId
    //check if event capacity is full
    const event = await findEvent({ _id: mongoose.Types.ObjectId(eventId) });
    const ticketsBought = await countTickets({ eventId: mongoose.Types.ObjectId(eventId) });
    console.log(ticketsBought);
    if (ticketsBought >= event.capacity) {
      return next({
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Event capacity is full",
      });
    }
    const ticketId = new mongoose.Types.ObjectId();

    // Convert the ObjectId to a string if you need to use it in a URL or other text-based formats
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
    const ticket = await createTicket(newTicket);
    return generateResponse(ticket, "Ticket created successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
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
    const updatedTicket = await updateTicket(
      { _id: mongoose.Types.ObjectId(ticketId) },
      { status: TICKET_STATUS.USED }
    );
    console.log(updatedTicket);
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