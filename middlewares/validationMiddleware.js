const { generateResponse } = require("../utils");
const { STATUS_CODES } = require("../utils/constants");

module.exports.validation = (schema, returnBool = false, query = false) => async (req, res, next) => {
  const body = query ? req.query : req.body;
  try {
    const d =  schema.validate(body);
    if (d?.error) throw d
    return returnBool ? true : next();
  } catch (e) {
    console.log(e)
    return returnBool ? false : generateResponse(e, e.error?.details[0]?.message, res, STATUS_CODES.UNPROCESSABLE_ENTITY);
  }
};
