'use strict';

/**
 * If already login, return back to previous page
 */
function login(req, res, next) {
	if(req.session.user) {
        console.log('Already login！');
        return res.redirect('back');
	}
	next();
}

/**
 * If client not login yet, redirect to login page
 */
function noLogin(req, res, next) {
	if(!req.session.user) {
		console.log('Must login firstly!');
		return res.redirect('/login');
	}
	next();
}

exports.login = login;
exports.noLogin = noLogin;
