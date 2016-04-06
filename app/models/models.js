'use strict';

// Import modules
var mongoose = require('mongoose');

// Create Schemas
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

var articleSchema = new Schema({
	title: String,
	author: String,
	tag: String,
	content: String,
	createTime: {
		type: Date,
		default: Date.now
	}
});

// Create Models
var User = mongoose.model('User', userSchema);
var Article = mongoose.model('Article', articleSchema);

// Exports models
exports.User = User;
exports.Article = Article;