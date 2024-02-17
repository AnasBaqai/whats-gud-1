const { deleteFields } = require("../utils/constants");
const mongoosePaginate = require("mongoose-paginate-v2");
const { Schema, model, default: mongoose } = require("mongoose");

const chatSchema = new Schema(
  {
    groupName: {
      type: String,
      index: true,
      required: function () {
        return this.chatType === "group";
      },
    },
    isChatSupport: {
      type: Boolean,
      default: false,
    },
    isTicketClosed: {
      type: Boolean,
      default: false,
    },
    groupImageUrl: {
      type: String,
    },
    chatType: {
      type: String,
      enum: ["one-to-one", "group"],
      default: "one-to-one"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.chatType === "group";
      },
    },
    messages: [
      {
        body: {
          type: String,
          //   required: true,
          index: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        mediaUrls: [
          { type: String, }
        ],
        mediaType: {
          type: String,
        },
        sentBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: function () {
            return this.chatType === "one-to-one";
          },
        },
        receivedBy: [
          {
            userId: {
              type: Schema.Types.ObjectId,
              ref: "User",
            },
            status: {
              type: String,
              enum: ["sent", "delivered", "seen"],
              default: "sent",
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
            ...deleteFields,
          },
        ],
        ...deleteFields,
      },
    ],
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type : String,
          default: 'active',
        },
        isMuted : {
          type: Boolean,
          default: false,
        },
        isBlocked:{
          type: Boolean,
          default: false,
        }
      },
    ],
    ...deleteFields,
  },
  {
    timestamps: true,
  }
);
// chatSchema.path("participants").validate(function (value) {
//   return value.length >= 2;
// }, "At least 2 group participants are required.");

chatSchema.plugin(mongoosePaginate);
exports.ChatModel = model("Chat", chatSchema);


