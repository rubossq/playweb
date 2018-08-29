let _ = require('underscore');
let async = require('async');

let MongoClient = require('mongodb').MongoClient;

let dbs = [];
let iteratee = 0;
let iterateeMax = 0;
let opened = false;

class DBController{
    static open(url, dbName, size, callback){
        if(!opened){
            async.map(_.range(0, size+1), function(n, cb){
                MongoClient.connect(url, { useNewUrlParser: true }, function(err, connection) {
                    if(err){
                        cb(err);
                    }else{
                        dbs.push(new DB(_.uniqueId('mdb'), connection.db(dbName), connection));
                        cb(null);
                    }
                });
            }, function(err){
                if(err){
                    callback(err);
                }else{
                    opened = true;
                    iterateeMax = size;
                    callback(null);
                }
            });
        }else{
            callback(null);
        }
    }

    static closeAll(){
        for(let i=0; i<dbs.length; i++){
            dbs[i].conn.close();
            dbs[i].db = null;
            dbs[i].conn = null;
        }

        dbs = [];

        iterateeMax = 0;
    }

    static get(){
        if(iteratee >= iterateeMax){
            iteratee = 0;
        }
        return dbs[iteratee++];
    }

    static close(db){
        let index = _.findIndex(dbs, {id: db.id});
        if(index){
            dbs[index].conn.close();
            dbs[index].db = null;
            dbs[index].conn = null;
            dbs.splice(index, 1);
        }

        iterateeMax--;
    }

    static getPoolSize(){
        return iterateeMax;
    }
}

class DB{
    constructor(id, db, conn){
        this.id = id;
        this.db = db;
        this.conn = conn;
    }
}

module.exports = DBController;