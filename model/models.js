/**
 * Created by dchuan on 2016/3/20.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    username: String,
    password: String,
    email: String,
    createTime: {
        type: Date,
        default: Date.now
    }
});

exports.User = mongoose.model('User', userSchema);

var noteSchema = new Schema({
    title: String,
    author: String,
    tag: String,
    content: String,
    createTime: {
        type: Date,
        default: Date.now
    }
});

exports.Note = mongoose.model('Note', noteSchema);