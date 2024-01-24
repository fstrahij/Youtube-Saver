class Content{
    private _doc;
    private browser;
    private localStorage;
    private winLoc;
    private cssSelector: CssSelector;
    private element: CustomElement;
    private youtubeStoreKey = 'YOUTUBE_STORE_RAI_01182024';

    constructor(){
        this._doc = document;
        this.browser = chrome;
        this.winLoc = window?.location;
        this.localStorage = this.browser.storage.local;

        //this.localStorage.clear();
        
        const hostname = 'www.youtube.com';
        const pathname = '/watch';

        if(this.winLoc?.hostname && this.winLoc?.pathname && this.winLoc?.hostname === hostname && this.winLoc?.pathname === pathname){
            this.cssSelector = this.getCssSelector();
            this.element = this.getElement();
            this.appendBtn();
        }

        this.navigateRequestListener();

        console.log('Main object created!');
    }

    private getCssSelector(): CssSelector{
        return {
            player: "#player",
            btn: "#btn-injected-save-video"
        };
    }

    private getElement(): CustomElement{
        return {
            playerEl: this._doc.querySelector(`${this.cssSelector.player}`),
            btnEl: null
        };
    }

    private setEventListener(element: HTMLElement | null, event: string, customMethod?: any){
        console.log(`Setting event listener - ${event} -  on element - ${element}...`);

        element?.addEventListener(event, (e)=>{
            e.preventDefault();
            e.stopPropagation();
            customMethod();
        });
    }

    private appendBtn(){
        console.log("appending button...");

        let btn = document.createElement('button');
        btn.innerHTML = 'Save Video';
        btn.id = this.cssSelector.btn.slice(1, this.cssSelector.btn.length);
        btn.className = 'btn';

        this.setEventListener(btn, 'click', this.scrapData.bind(this));

        this.element.playerEl?.insertAdjacentElement("afterend", btn);

        this.element.btnEl = this._doc.querySelector(`${this.cssSelector.btn}`);
    }

    private scrapData(){
        const sec = this._doc.querySelector('.ytp-progress-bar')?.getAttribute('aria-valuenow');
        const charPos = this.winLoc.search.indexOf('&');
        const search = charPos < 0 ? this.winLoc.search : this.winLoc.search.slice(0, charPos + 1);
        const videoCleanUrl = this.winLoc.origin + this.winLoc.pathname + search;
        const url = `${videoCleanUrl}&t=${sec}`;
        const name = prompt('Enter youtube link name') || '';
        const value = this.getYoutubeVideo(name, url);   

        console.info('name and url', value);
        
        this.insertStorage(this.youtubeStoreKey, value);
    }

    private getYoutubeVideo(name:string, url: string) :YoutubeVideo{
        return {
            name: name || url,
            url
        }
    }

    private insertStorage(key:string, value:YoutubeVideo){
        this.localStorage
            .get([key])
            .then((result)=>{
                console.info('get store');

                const oldValue = result[key];
                  
                const newStore = oldValue ? [...oldValue, value] : [value];

                this.localStorage
                    .set({[key]: newStore})
                    .then(()=>{
                        console.log('set store');
                    });
            });           
    }

    private navigateRequestListener(){
        console.log('nav listener');
        this.browser.runtime.onMessage.addListener((msg, sender) =>{
            console.info('content', msg);
            if(msg.action === Action.NAVIGATE){  
                this.winLoc.href = msg.request;     
            }
        });
    }
}

const content = new Content();

enum Action{
    NAVIGATE = "NAVIGATE"
}

interface CssSelector{
    player: string;
    btn: string;
}

interface CustomElement{
    playerEl: HTMLElement | null;
    btnEl: HTMLElement | null;
}

interface YoutubeVideo{
    name: string,
    url: string
}
