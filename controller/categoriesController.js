const { default: mongoose } = require("mongoose");
const {
  createCategories,
  findCategory,
  updateCategory,
} = require("../models/categoriesModel");
const { findEvent, getAllEvents } = require("../models/eventModel");
const {
  findEventType,
  findAllEventTypeByQuery,
} = require("../models/eventTypeModel");
const { parseBody, generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");
const { getStreamersQuery } = require("./queries/streamQueries");
const { getAllStreams } = require("../models/streamModel");
const { getCelebQuery } = require("./queries/eventQueries");

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
};

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
    return generateResponse(
      updatedCategory,
      "Subcategory added successfully",
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

// function to get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await findCategory({});
    const eventTypes = await findAllEventTypeByQuery({});

    // Transform categories array into an object with name as key
    // Transform categories array into an array of objects
    const transformedCategories = categories.reduce((acc, category) => {
      acc[category.name] = category.subCategory;
      return acc;
    }, {});
    // Combine transformed categories and eventTypes
    const userId = mongoose.Types.ObjectId(req.user.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = getStreamersQuery(userId);
    const streamers = await getAllStreams({
      query,
      page,
      limit,
      responseKey: "Streamers",
    });
    const queryCeleb = getCelebQuery(userId);
    const celebs = await getAllEvents({
      query: queryCeleb,
      page,
      limit,
      responseKey: "celebs",
    });
    const result = {
      Events: eventTypes,
      Streamers: streamers.Streamers,
      DJ: celebs.celebs,
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
