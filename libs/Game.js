class Game{

    constructor(obj){
        this.id = obj.id || obj._id;
        this.alias = obj.alias;
        this.name = obj.name;
        this.short_desc = obj.short_desc;
        this.slider_desc = obj.slider_desc;
        this.slider_comment = obj.slider_comment;
        this.list_desc = obj.list_desc;
        this.publisher_desc = obj.publisher_desc;
        this.desc = obj.desc;
        this.google_play = obj.google_play;
        this.app_store = obj.app_store;
        this.youtube = obj.youtube;
        this.publishing = !!obj.publishing;
        this.active = !!obj.active;
    }

    setLogo(path){
        this.logo = path;
    }

    setIcon(path){
        this.icon = path;
    }

    setPreview(path){
        this.preview = path;
    }

    setHeader(kind, path){
        if(!this.header){
            this.header = {desktop: '', mobile: ''};
        }
        this.header[kind] = path;
    }

    setBanner(kind, path){
        if(!this.banner){
            this.banner = {desktop: '', mobile: ''};
        }
        this.banner[kind] = path;
    }

    addScreenshot(path){
        if(!this.screenshots){
            this.screenshots = [];
        }

        this.screenshots.push(path);
    }
}

module.exports = Game;