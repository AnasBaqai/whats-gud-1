// all user related aggregate / long queries here

exports.searchUsersQuery = (searchTerm=null) => {
  return [
    {
      $match: {
        $or: [
          { firstName: { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex match for firstName
          { lastName: { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex match for lastName
        ],
      },
    },
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        image:1,
        email:1,
        type: { $literal: "user" }, // Add a field 'type' with value 'user' to each document
      },
    },
  ];
};
