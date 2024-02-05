exports.getUserTicketsQuery = (userId)=>{
  return[
    { $match: { userId: userId } },
    { $sort: { purchaseDate: -1 } },
    {
      $lookup: {
        from: "events", // Replace with your actual collection name
        localField: "eventId",
        foreignField: "_id",
        as: "eventDetails"
      }
    },
    {
      $unwind: "$eventDetails"
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        purchaseDate: 1,
        price: 1,
        status: 1,
        barcode: 1,
        eventName: "$eventDetails.eventName"
      }
    }
  ]
}