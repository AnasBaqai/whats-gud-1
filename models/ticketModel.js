const { Schema, model } = require("mongoose");
const { TICKET_STATUS } = require("../utils/constants");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { getMongooseAggregatePaginatedData } = require("../utils");

const ticketSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true,index:true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true,index:true },
  purchaseDate: { type: Date, default: Date.now },
  price: { type: Number, required: true },
  status: { type: String, enum:Object.values(TICKET_STATUS), default: 'unused' },
  barcode: { type: String, required: true },
})

ticketSchema.plugin(mongoosePaginate);
ticketSchema.plugin(aggregatePaginate);

ticketSchema.index({ userId: 1, eventId: 1 });

const TicketModel = model("Ticket", ticketSchema);

// create new ticket
exports.createTicket = (obj) => TicketModel.create(obj);

// find ticket by query
exports.findTicket = (query) => TicketModel.findOne(query);

// update ticket
exports.updateTicket = (query, obj) =>TicketModel.findOneAndUpdate(query, obj, { new: true });
//count tickets
exports.countTickets = (query) => TicketModel.countDocuments(query);
// get all tickets
exports.getAllTickets = async ({ query, page, limit, responseKey = "data" }) => {
  const { data, pagination } = await getMongooseAggregatePaginatedData({
    model: TicketModel,
    query,
    page,
    limit,
  });
  return  { [responseKey]: data, pagination };;
};

// delete ticket
exports.deleteTicket = (query) => TicketModel.deleteOne(query);

// delete many tickets
exports.deleteManyTickets = (query) => TicketModel.deleteMany(query);

