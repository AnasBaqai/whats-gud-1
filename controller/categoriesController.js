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
      ...transformedCategories,
      Events: eventTypes,
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
