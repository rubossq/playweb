const AP_LOGIN = 'admin';
const AP_PASSWORD = 'admin';
const MONGO_URL = "mongodb://localhost:27017/";
const GAME_DB = "playdb";

const DB_POOL_SIZE = 3;

const TMP = "public/tmp";
const TMP_RELATIVE = "tmp";
const GAMES_DIR = "public/games";
const RELATIVE_GAMES_DIR = "games";

class Constant{
    static get AP_LOGIN(){
        return AP_LOGIN;
    }

    static get AP_PASSWORD(){
        return AP_PASSWORD;
    }

    static get MONGO_URL(){
        return MONGO_URL;
    }

    static get DB_POOL_SIZE(){
        return DB_POOL_SIZE;
    }

    static get GAME_DB(){
        return GAME_DB;
    }

    static get TMP(){
        return TMP;
    }

    static get TMP_RELATIVE(){
        return TMP_RELATIVE;
    }

    static get GAMES_DIR(){
        return GAMES_DIR;
    }

    static get RELATIVE_GAMES_DIR(){
        return RELATIVE_GAMES_DIR;
    }
}

module.exports = Constant;