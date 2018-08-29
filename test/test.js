let assert = require('chai').assert;
let sinon = require('sinon');

let DBController = require('../libs/DBController');
let Constant = require('../libs/Constant');


let firstDb;

let spyGetMethod = sinon.spy(DBController, "get");

describe('DBController', function(){
    let DB_NAME = 'testdb';
    let DB_POOL_SIZE = 5;

    describe('open', function(){
        it('should open connection pool with given size', function(done){
            DBController.open(Constant.MONGO_URL, DB_NAME, DB_POOL_SIZE, function(err) {
                assert.isNull(err, 'there was no error');
                firstDb = DBController.get();
                done();
            });
        });
    });

    describe('poolSize', function(){
        it('should return actual pool size', function(){
            assert.equal(DB_POOL_SIZE, DBController.getPoolSize());
        });
    });

    describe('get', function(){

        it('should make step in pool', function(){
            assert.notEqual(firstDb.id, DBController.get().id);
        });

        it('should iterate pool', function(){

            while(spyGetMethod.callCount < DB_POOL_SIZE){
                DBController.get();
            }
            assert.equal(firstDb.id, DBController.get().id);

        });
    });

    describe('close', function(){
        it('should decrease pool size', function(){
            DBController.close(firstDb);
            assert.isBelow(DBController.getPoolSize(), DB_POOL_SIZE);
        });
    });

    describe('getAfter', function(){
        it('should be one of pool', function(){
            assert.isObject(DBController.get());
        });

    });

    describe('closeAll', function(){
        it('should close all connections to db', function(){
            DBController.closeAll();
            assert.equal(DBController.getPoolSize(), 0);
        });
    });

    describe('after closing', function(){
        it('should be null', function(){
            assert.isNull(firstDb.db);
        });

        it('should be undefined', function(){
            assert.isUndefined(DBController.get());
        });
    });
});