const mongoose = require('mongoose');

module.exports = async() => {
    mongoose.set('strictQuery', true);
   await mongoose.connect('mongodb+srv://anasbaqai9:Habib_03_BaqaI@cluster0.ektbxie.mongodb.net/whats-gud'||process.env.MONGODB_URL)
        .then(() => console.log('Connected to DB'))
        .catch((error) => console.log("db error: ", error));
}
