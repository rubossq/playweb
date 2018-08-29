let fs = require('fs');

//MAIN SITE
const MAIN_TEMPLATE = "/views/layouts/main_template.mustache";

const INDEX_PAGE = "/views/pages/index.mustache";
const CONTACTS_PAGE = "/views/pages/contacts.mustache";
const PUBLISHING_PAGE = "/views/pages/publishing.mustache";
const TECHNOLOGIES_PAGE = "/views/pages/technologies.mustache";
const GAME_PAGE = "/views/pages/game.mustache";
const PRIVACY_PAGE = "/views/pages/privacy.mustache";
const TERMS_PAGE = "/views/pages/terms.mustache";
const GAMES_PAGE = "/views/pages/games.mustache";

const NAV_PARTIAL = "/views/partials/nav.mustache";
const FOOTER_PARTIAL = "/views/partials/footer.mustache";

//ADMIN PANEL

const ADMIN_TEMPLATE = "/views/layouts/admin_template.mustache";

const ADMIN_LOGIN_PAGE = "/views/pages/admin/login.mustache";
const ADMIN_INDEX_PAGE = "/views/pages/admin/index.mustache";
const ADMIN_GAME_FORM_PAGE = "/views/pages/admin/game_form.mustache";

const ADMIN_HEADER_PARTIAL = "/views/partials/admin/header.mustache";


class ViewManager{
    static readView(path, cb){
        fs.readFile(path, "utf8", cb);
    }

    //MAIN VIEWS

    static get MAIN_TEMPLATE(){
        return MAIN_TEMPLATE;
    }

    static get NAV_PARTIAL(){
        return NAV_PARTIAL;
    }

    static get FOOTER_PARTIAL(){
        return FOOTER_PARTIAL;
    }

    static get INDEX_PAGE(){
        return INDEX_PAGE;
    }

    static get CONTACTS_PAGE(){
        return CONTACTS_PAGE;
    }

    static get PUBLISHING_PAGE(){
        return PUBLISHING_PAGE;
    }

    static get TECHNOLOGIES_PAGE(){
        return TECHNOLOGIES_PAGE;
    }

    static get GAMES_PAGE(){
        return GAMES_PAGE;
    }

    static get TERMS_PAGE(){
        return TERMS_PAGE;
    }

    static get PRIVACY_PAGE(){
        return PRIVACY_PAGE;
    }

    static get GAME_PAGE(){
        return GAME_PAGE;
    }

    //ADMIN VIEWS


    static get ADMIN_TEMPLATE(){
        return ADMIN_TEMPLATE;
    }

    static get ADMIN_HEADER_PARTIAL(){
        return ADMIN_HEADER_PARTIAL;
    }

    static get ADMIN_LOGIN_PAGE(){
        return ADMIN_LOGIN_PAGE;
    }

    static get ADMIN_INDEX_PAGE(){
        return ADMIN_INDEX_PAGE;
    }

    static get ADMIN_GAME_FORM_PAGE(){
        return ADMIN_GAME_FORM_PAGE;
    }
}

module.exports = ViewManager;