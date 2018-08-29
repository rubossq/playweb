let http = require('http');
let url = require('url');
let Pattern = require('url-pattern');

let Path = require('path');
let fs = require('fs');
let sessions = require("client-sessions");
let rimraf = require('rimraf');

let _ = require('underscore');
let rootPath = require('app-root-path');
let Mustache = require('mustache');
let ViewManager = require('./libs/ViewManager');
let Constant = require('./libs/Constant');

let DBController = require('./libs/DBController');
let GameManager = require('./libs/GameManager');


let dir = Path.join(__dirname, 'public');
let async = require("async");

let mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript',
    json: 'application/json'
};

let layouts = [Path.join(rootPath.toString(), ViewManager.MAIN_TEMPLATE), Path.join(rootPath.toString(), ViewManager.ADMIN_TEMPLATE)];
let partials = [Path.join(rootPath.toString(), ViewManager.NAV_PARTIAL), Path.join(rootPath.toString(), ViewManager.FOOTER_PARTIAL),
    Path.join(rootPath.toString(), ViewManager.ADMIN_HEADER_PARTIAL)];
let pages = [Path.join(rootPath.toString(), ViewManager.INDEX_PAGE), Path.join(rootPath.toString(), ViewManager.CONTACTS_PAGE),
    Path.join(rootPath.toString(), ViewManager.PUBLISHING_PAGE), Path.join(rootPath.toString(), ViewManager.TECHNOLOGIES_PAGE),
    Path.join(rootPath.toString(), ViewManager.GAMES_PAGE), Path.join(rootPath.toString(), ViewManager.GAME_PAGE),
    Path.join(rootPath.toString(), ViewManager.PRIVACY_PAGE), Path.join(rootPath.toString(), ViewManager.TERMS_PAGE),
    Path.join(rootPath.toString(), ViewManager.ADMIN_INDEX_PAGE), Path.join(rootPath.toString(), ViewManager.ADMIN_LOGIN_PAGE),
    Path.join(rootPath.toString(), ViewManager.ADMIN_GAME_FORM_PAGE)];

let indexRoute = require('./routes/index');
let contactsRoute = require('./routes/contacts');
let publishingRoute = require('./routes/publishing');
let technologiesRoute = require('./routes/technologies');
let gamesRoute = require('./routes/games');
let gameRoute = require('./routes/game');
let privacyRoute = require('./routes/privacy');
let termsRoute = require('./routes/terms');
let adminRoute = require('./routes/admin');

cacheViews();
cleanTmp();

let session = sessions({
    cookieName: 'session',
    secret: 'secretgenerated',
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5
});


DBController.open(Constant.MONGO_URL, Constant.GAME_DB, Constant.DB_POOL_SIZE, function(err) {
    if (err) {
        throw err;
    } else {
        GameManager.init();
        let server = http.createServer(function (req, res) {
            res.redirect = redirect(res);

            session(req, res, function () {
                let urlObj = url.parse(req.url, true);
                let path = urlObj.pathname;
                req.path = path;

                //serve static files
                if (~path.indexOf('.')) {
                    let ext = path.split('.').pop();
                    let staticExtensions = _.keys(mime);

                    if (_.contains(staticExtensions, ext)) {
                        let file = Path.join(dir, path);
                        let stream = fs.createReadStream(file);
                        stream.on('open', function () {
                            res.setHeader('Content-Type', mime[ext]);
                            stream.pipe(res);
                        });
                        stream.on('error', function () {
                            let err = new Error("Page not found");
                            err.code = 404;
                            errorHandler(req, res, err);
                        });
                    }
                } else {
                    console.log(req.method + " " + path);

                    //routes
                    let index = new Pattern('/');
                    let contacts = new Pattern('/contacts');
                    let publishing = new Pattern('/publishing');
                    let technologies = new Pattern('/technologies');
                    let games = new Pattern('/games');
                    let game = new Pattern('/games/:alias');
                    let privacy = new Pattern('/privacy');
                    let terms = new Pattern('/terms');
                    let admin = new Pattern('/ap(/(:page(/*)))');

                    let pages = [
                        {pattern: index, route: indexRoute},
                        {pattern: contacts, route: contactsRoute},
                        {pattern: publishing, route: publishingRoute},
                        {pattern: technologies, route: technologiesRoute},
                        {pattern: games, route: gamesRoute},
                        {pattern: game, route: gameRoute},
                        {pattern: privacy, route: privacyRoute},
                        {pattern: terms, route: termsRoute},
                        {pattern: admin, route: adminRoute},
                    ];

                    let err = new Error("Page not found");
                    err.code = 404;

                    for (let i = 0; i < pages.length; i++) {

                        let params = pages[i].pattern.match(path);
                        if (params) {
                            req.params = params;
                            err = null;
                            pages[i].route(req, res, function (err) {
                                errorHandler(req, res, err);
                            });
                            break;
                        }
                    }

                    errorHandler(req, res, err);
                }
            });
        });

        server.listen(8080);

        server.on('close', function() {
            console.log('crash');
            DBController.closeAll();
        });
    }
});




function cacheViews() {

    async.map(layouts.concat(partials, pages), function (view, cb) {
        cacheView(view, cb);
    }, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("cached ok");
        }
    });

}

function redirect(res){
    return function(location){
        res.writeHead(302, {
            'Location': location
        });
        res.end();
    }
}

function cacheView(path, cb) {

    ViewManager.readView(path, function (err, data) {
        if (err) {
            cb(err);
        } else {
            Mustache.parse(data);
            cb();
        }
    });
}

function cleanTmp(){
    rimraf(Constant.TMP, function () {
        console.log('clean ok');
    });
}

function errorHandler(req, res, err) {
    if (err) {
        console.log(err);
        try {
            res.writeHead(err.code, {'Content-Type': 'text/html'});
            res.end(err.message);
        } catch (e) {
            res.end(err.message);
        }

    }
}