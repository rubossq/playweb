let DBController = require('./DBController');
let async = require('async');
let GAME_ENTITY = "game";
let ObjectID = require('mongodb').ObjectID;
let Game = require('./Game');
let rootPath = require('app-root-path');
let Path = require('path');
let fs = require('fs');
let Constant = require('./Constant');

let rimraf = require('rimraf');

class GameManager {

    static init() {
        let db = DBController.get();
        db.db.collection(GAME_ENTITY).createIndex({alias: 1}, {unique: true});
    }

    static add(game, cb) {
        let temp = Object.assign({}, game);
        delete temp.id;
        DBController.get().db.collection(GAME_ENTITY).insertOne(temp, function (err, res) {
            if (err) {
                cb(err);
            } else {
                cb(null, res.insertedId);
            }
        });
    }

    static update(game, cb) {
        DBController.get().db.collection(GAME_ENTITY).findOneAndUpdate({
            _id: new ObjectID(game.id)
        }, {
            $set: game
        }, function (err, res) {
            if (err || !res.value) {
                err = new Error('Game not found');
                err.code = 404;
                cb(err);
            } else {
                cb(null, res.value._id);
            }
        });
    }

    static remove(game, cb) {
        DBController.get().db.collection(GAME_ENTITY).deleteOne({
            _id: new ObjectID(game.id)
        }, function (err, res) {
            if (err) {
                cb(err);
            } else {
                GameManager.removeImages(game, function(err){
                    cb(err, res.deletedCount);
                });
            }
        });
    }

    static list(offset, limit, cb, loadImages, findit) {
        findit = findit || {};
        DBController.get().db.collection(GAME_ENTITY).find(findit).skip(offset).limit(limit).sort({_id: -1}).toArray(function (err, res) {
            if (err) {
                cb(err);
            } else {
                async.map(res, function (g, cb) {
                    let game = new Game(g);
                    if (loadImages) {
                        GameManager.loadImages(game, cb);
                    } else {
                        cb(null, game);
                    }
                }, function (err, games) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, games);
                    }
                });
            }
        });
    }

    static info(game, cb) {
        DBController.get().db.collection(GAME_ENTITY).findOne({
            alias: game.alias
        }, function (err, res) {
            if (err || !res) {
                err = new Error('Game not found');
                err.code = 404;
                cb(err);
            } else {
                let game = new Game(res);
                GameManager.loadImages(game, cb);
            }
        });
    }

    static removeImages(game, cb){
        let path = Constant.GAMES_DIR + '/' + game.id;
        let realPath = Path.join(rootPath.toString(), path);
        rimraf(realPath, function (err) {
            cb(err);
        });
    }

    static loadImages(game, cb) {
        let path = Constant.GAMES_DIR + '/' + game.id;
        let pathRelative = Constant.RELATIVE_GAMES_DIR + '/' + game.id;
        let realPath = Path.join(rootPath.toString(), path);
        if (fs.existsSync(realPath)) {
            fs.readdir(realPath, (err, files) => {
                if (err) {
                    cb(err);
                } else {

                    files.forEach(function (fileName) {
                        if (~fileName.indexOf('logo')) {
                            game.setLogo(pathRelative + '/' + fileName);
                        } else if (~fileName.indexOf('icon')) {
                            game.setIcon(pathRelative + '/' + fileName);
                        } else if (~fileName.indexOf('preview')) {
                            game.setPreview(pathRelative + '/' + fileName);
                        } else if (~fileName.indexOf('banner_desktop')) {
                            game.setBanner('desktop', pathRelative + '/' + fileName);
                        } else if (~fileName.indexOf('header_desktop')) {
                            game.setHeader('desktop', pathRelative + '/' + fileName);
                        } else if (~fileName.indexOf('banner_mobile')) {
                            game.setBanner('mobile', pathRelative + '/' + fileName);
                        } else if (~fileName.indexOf('header_mobile')) {
                            game.setHeader('mobile', pathRelative + '/' + fileName);
                        } else if (~fileName.indexOf('screenshots')) {
                            game.addScreenshot(pathRelative + '/' + fileName);
                        }
                    });

                    cb(null, game);
                }
            });
        } else {
            cb(null, game);
        }
    }
}

module.exports = GameManager;