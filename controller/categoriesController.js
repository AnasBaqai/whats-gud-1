const {createCategories,findCategory,updateCategory}= require('../models/categoriesModel');
const { findEvent } = require('../models/eventModel');
const { findEventType } = require('../models/eventTypeModel');
const { parseBody, generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");


exports.createCategoriesController = async (req, res, next) => {
  try {
    const { name } = req.body;
    const category = await createCategories({ name });
    return generateResponse(category, "Category created successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
}

//function to push subcategory to category

exports.pushSubCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
    const category = await findCategory({ _id: id });
    if (!category) {
      return next({
        statusCode: STATUS_CODES.NOT_FOUND,
        message: "Category not found",
      });
    }
    const subCategory = {
      name,
    };
    const updatedCategory = await updateCategory(
      { _id: id },
      { $push: { subCategory } }
    );
    return generateResponse(updatedCategory, "Subcategory added successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
}
const sampleData1 =[
  {
    "_id": "1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  {
    "_id": "2",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com"
  },
  {
    "_id": "3",
    "firstName": "Mike",
    "lastName": "Johnson",
    "email": "mike.johnson@example.com"
  },
  {
    "_id": "4",
    "firstName": "Sara",
    "lastName": "Williams",
    "email": "sara.williams@example.com"
  },
  {
    "_id": "5",
    "firstName": "Alex",
    "lastName": "Brown",
    "email": "alex.brown@example.com"
  },
  {
    "_id": "6",
    "firstName": "Chris",
    "lastName": "Miller",
    "email": "chris.miller@example.com"
  },
  {
    "_id": "7",
    "firstName": "Emily",
    "lastName": "Davis",
    "email": "emily.davis@example.com"
  },
  {
    "_id": "8",
    "firstName": "Daniel",
    "lastName": "Clark",
    "email": "daniel.clark@example.com"
  },
  {
    "_id": "9",
    "firstName": "Megan",
    "lastName": "Moore",
    "email": "megan.moore@example.com"
  }
]

const sampleData2 =[
  {
    "_id": "10",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  {
    "_id": "11",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com"
  },
  {
    "_id": "12",
    "firstName": "Mike",
    "lastName": "Johnson",
    "email": "mike.johnson@example.com"
  },
  {
    "_id": "13",
    "firstName": "Sara",
    "lastName": "Williams",
    "email": "sara.williams@example.com"
  },
  {
    "_id": "14",
    "firstName": "Alex",
    "lastName": "Brown",
    "email": "alex.brown@example.com"
  },
  {
    "_id": "15",
    "firstName": "Chris",
    "lastName": "Miller",
    "email": "chris.miller@example.com"
  },
  {
    "_id": "16",
    "firstName": "Emily",
    "lastName": "Davis",
    "email": "emily.davis@example.com"
  },
  {
    "_id": "17",
    "firstName": "Daniel",
    "lastName": "Clark",
    "email": "daniel.clark@example.com"
  },
  {
    "_id": "18",
    "firstName": "Megan",
    "lastName": "Moore",
    "email": "megan.moore@example.com"
  }
]



// function to get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await findCategory({});
    const eventTypes = await findEventType({});

    // Transform categories array into an object with name as key
    // Transform categories array into an array of objects
    const transformedCategories = categories.reduce((acc, category) => {
      acc[category.name] = category.subCategory;
      return acc;
    }, {});    
    // Combine transformed categories and eventTypes
    const result = {
      Events: eventTypes,
      Streamers: sampleData1,
      DJ: sampleData2,
      ...transformedCategories,
    };

    return generateResponse(result, "Categories fetched successfully", res);
  } catch (error) {
    console.log(error.message);
    return next({
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};
