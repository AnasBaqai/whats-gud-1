const socketIO = require('socket.io');
const { updateUser } = require('./models/userModel');

let io;

exports.io = (server) => {
    io = socketIO(server);
    io.on('connection', async (socket) => {
        const userObj = await updateUser({ _id: socket?.handshake?.headers?.user_id }, { online: true });

        // broadcast to all users except the one who is connected
        socket.emit('user-connected', userObj);

        socket.on('disconnect', async () => {
            const userObj = await updateUser({ _id: socket?.handshake?.headers?.user_id }, { online: false });
            socket.emit('user-disconnected', userObj);
        });
    });
};

// add user to room
// exports.addUserToGroupIO = (groupId, userId) => {
//     io.emit(`add-user-to-group-${groupId}`, userId);
// }

// // remove user from room
// exports.removeUserFromGroupIO = (groupId, userId) => {
//     io.emit(`remove-user-from-group-${groupId}`, userId);
// }

// // create one to one chat
// exports.createOneToOneChatIO = (receiverId, chatObj) => {
//     io.emit(`create-one-to-one-chat-${receiverId}`, chatObj);
// }

/*
PORT=5000
MONGODB_URL=mongodb+srv://anasbaqai9:Habib_03_BaqaI@cluster0.ektbxie.mongodb.net/whats-gud
JWT_SECRET=secret
JWT_EXPIRATION=30d
REFRESH_JWT_SECRET=secret
REFRESH_JWT_EXPIRATION=30d
COOKIE_KEY=COOKIE_SESSION_KEY
OTP_EXPIRATION=1_200_000  # 20 minutes
APP_NAME=whats-gud

EMAIL=EMAIL
PASSWORD=PASSWORD

FIREBASE_SERVER_KEY=FIREBASE_SERVER_KEY


GOOGLE_CLIENT_ID=769229310692-77odpc268iatm0r0tbr0e7fvau2lekvh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

FACEBOOK_APP_SECRET=6567bf77a2e7af3ad2374c3c2b21759a
FACEBOOK_APP_ID=1368545200524074

SALT_ROUNDS=10

GMAIL_USER=anasbaqai9@gmail.com
GMAIL_PASS=snhq uavi zrht ofkg

REGION_AWS=us-west-1
ACCESS_KEY_ID=AKIAUUTDU4LIELUXBI2B
SECRET_ACCESS_KEY=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
BUCKET_NAME=whats-gud-1
*/