// all user related aggregate / long queries here

exports.searchUsersQuery = (searchTerm = null) => {
  let searchTerms = searchTerm.split(" ");

  let andConditions = searchTerms.map(term => ({
    $or: [
      { firstName: { $regex: `\\b${term}`, $options: "i" } },
      { lastName: { $regex: `\\b${term}`, $options: "i" } }
    ]
  }));

  return [
    {
      $match:  {
        $and: andConditions,
      },
    },
    {
      $lookup: {
        from: "relations", // Replace with your actual relations collection name
        localField: "_id",
        foreignField: "user",
        as: "userRelations",
      },
    },
    {
      $project: {
        _id: 0, // Exclude _id from the projected fields
        id: "$_id",
        firstName: 1,
        lastName: 1,
        image: 1,
        email: 1,
        type: { $literal: "user" },
        followersCount: {
          $size: {
            $ifNull: [{ $arrayElemAt: ["$userRelations.followers", 0] }, []],
          },
        },
        // Add an additional sorting key based on the priority of matches in firstName
        firstNameMatch: {
          $cond: [
            { $eq: [{ $indexOfCP: ["$firstName", searchTerm] }, 0] },
            0,
            1,
          ],
        },
      },
    },
    {
      $sort: { firstNameMatch: 1, firstName: 1 }, // Sort by firstNameMatch (priority) and then firstName
    },
  ];
};
