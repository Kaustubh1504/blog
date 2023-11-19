const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    title:{type:String},
    desc:{type:String},
    img:{type:String},
    authorId:{type:String}

}, { timestamps: true }
);
module.exports =mongoose.model("Post",PostSchema);