let Mustache = require('mustache');
let rootPath = require('app-root-path');
let ViewManager = require('../libs/ViewManager');
let querystring = require('querystring');

let GameManager = require('../libs/GameManager');
let Game = require('../libs/Game');

let validate = require("validate.js");

let Constant = require('../libs/Constant');
let _ = require('underscore');

let Busboy = require('busboy');
let path = require('path');
let fs = require('fs');
let mkdirp = require('mkdirp');
let inspect = require('util').inspect;
let async = require('async');

let fsExtra = require('fs-extra');

module.exports = function (req, res, next) {


    let page = req.params.page || 'index';

    if (page === 'login') {
        loginPage(req, res, next);
    } else {
        if (req.session.signed) {
            if (page === 'index' || page === '') {
                indexPage(req, res, next);
            } else if (page === 'game_form') {
                gameFormPage(req, res, next);
            } else if (page === 'remove') {
                removePage(req, res, next);
            } else if (page === 'destroy') {
                destroy(req, res, next);
            } else if (page === 'logout') {
                logoutPage(req, res, next);
            } else if (page === 'test') {
                testPage(req, res, next);
            } else if (page === 'upload') {
                saveImage(req, res, next);
            } else {
                let err = new Error('Page not found');
                err.code = 404;
                next(err);
            }
        } else {
            res.redirect("/ap/login");
        }
    }

};

function loginPage(req, res, next) {

    if (req.method.toLowerCase() === 'get') {
        async.parallel({
            template: function (cb) {
                ViewManager.readView(rootPath + ViewManager.ADMIN_TEMPLATE, cb);
            },
            content: function (cb) {
                ViewManager.readView(rootPath + ViewManager.ADMIN_LOGIN_PAGE, cb);
            },
            header: function (cb) {
                ViewManager.readView(rootPath + ViewManager.ADMIN_HEADER_PARTIAL, cb);
            }
        }, function (err, results) {
            if (err) {
                next(err);
            } else {
                let rendered = Mustache.render(results.template, {}, {
                    content: results.content,
                    header: results.header
                });

                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(rendered);
            }

        });
    } else if (req.method.toLowerCase() === 'post') {

        let postData = '';
        req.on('data', function (chunk) {
            postData += chunk.toString();

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (postData.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            let body = querystring.parse(postData);
            if (body.login === Constant.AP_LOGIN && body.password === Constant.AP_PASSWORD) {
                req.session.signed = true;
                res.redirect('/ap');
            } else {
                req.session.signed = false;
                res.redirect('/ap/login');
            }
        });

    } else {
        let err = new Error('Page not found');
        err.code = 404;
        next(err);
    }
}

function indexPage(req, res, next) {

    async.parallel({
        template: function (cb) {
            ViewManager.readView(rootPath + ViewManager.ADMIN_TEMPLATE, cb);
        },
        content: function (cb) {
            ViewManager.readView(rootPath + ViewManager.ADMIN_INDEX_PAGE, cb);
        },
        header: function (cb) {
            ViewManager.readView(rootPath + ViewManager.ADMIN_HEADER_PARTIAL, cb);
        }
    }, function (err, results) {
        if (err) {
            next(err);
        } else {
            console.log('HERE');
            GameManager.list(0, 50, function (err, games) {
                if (err) {
                    next(err);
                } else {
                    let rendered = Mustache.render(results.template, {games: games}, {
                        content: results.content,
                        header: results.header
                    });

                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(rendered);
                }
            }, true);

        }

    });
}

function gameFormPage(req, res, next) {

    let alias = req.params._;

    if (req.method.toLowerCase() === 'get') {
        async.parallel({
            template: function (cb) {
                ViewManager.readView(rootPath + ViewManager.ADMIN_TEMPLATE, cb);
            },
            content: function (cb) {
                ViewManager.readView(rootPath + ViewManager.ADMIN_GAME_FORM_PAGE, cb);
            },
            header: function (cb) {
                ViewManager.readView(rootPath + ViewManager.ADMIN_HEADER_PARTIAL, cb);
            }
        }, function (err, results) {
            if (err) {
                next(err);
            } else {
                let gameObj = {};

                async.series([
                    function (callback) {
                        if (alias) {
                            GameManager.info({alias: alias}, callback);
                        } else {
                            callback(null, gameObj);
                        }
                    }
                ], function (err, games) {
                    let game_temp_id = 'game_' + _.now();
                    let rendered = Mustache.render(results.template, {game_temp_id: game_temp_id, game: games[0]}, {
                        content: results.content,
                        header: results.header
                    });

                    req.session.game_temp_id = game_temp_id;


                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(rendered);
                });


            }

        });
    } else if (req.method.toLowerCase() === 'post') {
        let postData = '';
        req.on('data', function (chunk) {
            postData += chunk.toString();

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (postData.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            let body = querystring.parse(postData);
            let constraints = {
                alias: {length: {minimum: 2, maximum: 16}},
                name: {length: {minimum: 2, maximum: 48}},
                google_play: {url: {}},
                app_store: {url: {}},
                youtube: {url: {}},
                short_desc: {length: {minimum: 15}},
                desc: {length: {minimum: 50}},
                publishing: {},
                active: {}
            };

            if (!validate(body, constraints)) {

                body.active = body.active === 'on';
                body.publishing = body.publishing === 'on';

                let game = new Game(body);

                let method = alias ? GameManager.update : GameManager.add;

                method(game, function (err, id) {
                    if (err) {
                        next(err);
                    } else {
                        let relativePath = path.join(Constant.TMP, req.session.game_temp_id);
                        let destPath = Constant.GAMES_DIR + '/' + id;

                        mkdirp(destPath, function (err) {
                            if (err) {
                                next(err);
                            } else {
                                let realSource = path.join(rootPath.toString(), relativePath);
                                let realDestination = path.join(rootPath.toString(), destPath);

                                console.log(realSource);
                                console.log(realDestination);

                                if (fs.existsSync(realSource) && fs.existsSync(realDestination)) {
                                    fsExtra.copy(realSource, realDestination, {overwrite: true}, err => {
                                        if (err) {
                                            next(err);
                                        } else {
                                            res.redirect("/ap/game_form/" + game.alias);
                                        }
                                    });
                                } else {
                                    res.redirect("/ap/game_form/" + game.alias);
                                }
                            }
                        });
                    }
                });
            } else {
                res.redirect(req.path);
            }
        });
    } else {
        let err = new Error('Page not found');
        err.code = 404;
        next(err);
    }
}

function removePage(req, res, next) {

    if (req.method.toLowerCase() === 'post') {

        let postData = '';
        req.on('data', function (chunk) {
            postData += chunk.toString();

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (postData.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            let body = querystring.parse(postData);

            GameManager.remove({id: body.id}, function (err) {
                if (err) {
                    next(err);
                } else {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ok: 'yes'}));
                }
            });

        });

    } else {
        let err = new Error('Page not found');
        err.code = 404;
        next(err);
    }
}

function destroy(req, res, next) {

    if (req.method.toLowerCase() === 'post') {

        let postData = '';
        req.on('data', function (chunk) {
            postData += chunk.toString();

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (postData.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            let body = querystring.parse(postData);

            let dir = body.item.split('/')[0];

            if (~[Constant.TMP_RELATIVE, Constant.RELATIVE_GAMES_DIR].indexOf(dir)) {
                realPath = 'public/' + body.item;
                fs.unlink(realPath, function (err) {
                    if (err) {
                        next(err);
                    } else {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({ok: 'yes'}));
                    }
                });
            } else {
                let err = new Error('Permission denied');
                err.code = 403;
                next(err);
            }
        });

    } else {
        let err = new Error('Page not found');
        err.code = 404;
        next(err);
    }
}

function saveImage(req, res, next) {

    if (req.method.toLowerCase() === 'post') {

        let busboy = new Busboy({headers: req.headers});
        let fullPath = "", relativePath = "";
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            let ext = "jpg";//filename.split('.').pop();
            if (fieldname === 'screenshots') {
                fieldname += '_' + _.now();
            }
            console.log(fieldname);
            let way = path.join(rootPath.toString(), Constant.TMP, req.session.game_temp_id);
            relativePath = path.join(Constant.TMP_RELATIVE, req.session.game_temp_id) + '/' + fieldname + '.' + ext;
            mkdirp(way, function (err) {
                if (err) {
                    next(err);
                } else {
                    fullPath = way + '/' + fieldname + '.' + ext;
                    file.pipe(fs.createWriteStream(fullPath));
                }
            });
        });

        busboy.on('finish', function () {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ok: 'yes', relativePath: relativePath}));
        });

        return req.pipe(busboy);

    } else {
        let err = new Error('Page not found');
        err.code = 404;
        next(err);
    }
}

function testPage(req, res, next) {
    if (req.method === 'POST') {
        var busboy = new Busboy({headers: req.headers});
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
            file.on('data', function (data) {
                console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
            });
            file.on('end', function () {
                console.log('File [' + fieldname + '] Finished');
            });
        });
        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            console.log('Field [' + fieldname + ']: value: ' + inspect(val));
        });
        busboy.on('finish', function () {
            console.log('Done parsing form!');
            res.writeHead(303, {Connection: 'close', Location: '/'});
            res.end();
        });
        req.pipe(busboy);
    } else if (req.method === 'GET') {
        res.writeHead(200, {Connection: 'close'});
        res.end('<html><head></head><body>'+
               '<form method="POST" enctype="multipart/form-data">'+
                '<input type="text" name="textfield"><br />'+
                '<input type="file" name="filefield"><br />'+
                '<input type="submit">'+
              '</form>'+
            '</body></html>');
    }
}

function logoutPage(req, res, next) {

    req.session = {};
    res.redirect("/ap/login");

}