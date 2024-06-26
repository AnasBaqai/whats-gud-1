exports.ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
});

exports.TICKET_STATUS = Object.freeze({
  UNUSED: "unused",
  USED: "used",
});

exports.deleteFields = {
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
};
exports.STATUS_CODES = Object.freeze({
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
});

exports.EVENT_STATUS = Object.freeze({
  SUBMITTED: "submitted",
  REVIEWING: "reviewing",
  CHANGES: "changes",
  APPROVED: "approved",
  DECLINED: "declined",
});
