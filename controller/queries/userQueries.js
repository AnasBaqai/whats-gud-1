// all user related aggregate / long queries here

exports.searchUsersQuery = (searchTerm = null) => {
  return [
    {
      $match: {
        $or: [
          { firstName: { $regex: searchTerm, $options: "i" } },
          { lastName: { $regex: searchTerm, $options: "i" } },
        ],
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
        _id: 1,
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
      },
    },
    {
      $sort: { followersCount: -1 }, // Sort by followersCount in descending order
    },
  ];
};
