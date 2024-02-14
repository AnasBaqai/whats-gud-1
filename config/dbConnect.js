const mongoose = require('mongoose');

module.exports = async() => {
    mongoose.set('strictQuery', true);
   await mongoose.connect(process.env.MONGODB_URL)
        .then(() => console.log('Connected to DB'))
        .catch((error) => console.log("db error: ", error));
}




