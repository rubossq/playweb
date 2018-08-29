let Mustache = require('mustache');
let rootPath = require('app-root-path');
let ViewManager = require('../libs/ViewManager');
let GameManager = require('../libs/GameManager');

let async = require('async');

module.exports = function(req, res, next){

    async.parallel({
        template: function(cb){
            ViewManager.readView(rootPath + ViewManager.MAIN_TEMPLATE, cb);
        },
        content: function(cb){
            ViewManager.readView(rootPath + ViewManager.INDEX_PAGE, cb);
        },
        nav: function(cb){
            ViewManager.readView(rootPath + ViewManager.NAV_PARTIAL, cb);
        },
        footer: function(cb){
            ViewManager.readView(rootPath + ViewManager.FOOTER_PARTIAL, cb);
        }
    }, function(err, results){
        if(err){
            next(err);
        }else{

            GameManager.list(0, 5, function(err, games){
                if(err){
                    next(err);
                }else{
                    let rendered = Mustache.render(results.template, {title: "Playgendary", games: games}, {
                        content: results.content,
                        nav: results.nav,
                        footer: results.footer
                    });

                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(rendered);
                }
            }, true, {active: true});

        }

    });


};