class Popup{
    private _doc;
    private browser;
    private localStorage;
    private cssSelector: CssSelector;
    private element: CustomElement;
    private youtubeStoreKey = 'YOUTUBE_STORE_RAI_01182024';
    private youtubeLinks: YoutubeVideo[] = [];

    constructor(){   
        this._doc = document;
        this.browser = chrome;
        this.localStorage = this.browser.storage.local;
        this.cssSelector = this.getCssSelector();
        this.element = this.getElement();

        //this.setEventListener(this.element.addMovieBtnEl, 'click', this.addMovieBtnClick.bind(this));

        this.getStorage(this.youtubeStoreKey);

        console.log('Popup object created!');     
    }

    private getStorage(key:string){
        this.localStorage
            .get([key])
            .then((result)=>{
                this.youtubeLinks = result[ this.youtubeStoreKey ] ? [ ...result[ this.youtubeStoreKey ] ] : [];
                this.injectList();
            });           
    }

    private getCssSelector(): CssSelector{
        return {
            youtubeLinksList: "#youtube-links-list",
            list: ".list",
            link: ".link",
            a: "a"
        };
    }

    private getElement(): CustomElement{   
        return {
            youtubeLinksListEl: this._doc.querySelector(`${this.cssSelector.youtubeLinksList}`),
            listEl: this._doc.querySelector(`${this.cssSelector.youtubeLinksList} > ${this.cssSelector.list}`),
            linkEl: this._doc.querySelectorAll(`${this.cssSelector.youtubeLinksList} > ${this.cssSelector.list} > ${this.cssSelector.link}`),
            aEl: this._doc.querySelectorAll(`${this.cssSelector.youtubeLinksList} > ${this.cssSelector.list} > ${this.cssSelector.link} > ${this.cssSelector.a}`)
        };
    }

    private setEventListener(element: HTMLElement | null, event: string, customMethod: any){
        console.log(`Setting event listener - ${event} -  on element - ${element}...`);

        element?.addEventListener(event, (e)=>{
            e.stopPropagation();
            customMethod();
        });

        console.log('Event listener set!');
    }

    private injectList(): void{
        let links = '';
        let i = 1;
        for(let link of this.youtubeLinks){
            const bg = (i % 2 == 1) ? " bg-link" : '';

            links += `<li class="link${bg}"><a href="${ link.url }">${ link.name }</a></li>`;

            i++;
        }

        const list = `<ul class="list">${ links }</ul>`;

        this.element.youtubeLinksListEl?.insertAdjacentHTML("beforeend", list);

        this.element = this.getElement();

        this.element.aEl.forEach(a => {
            this.setEventListener(a, 'click', this.sendNavigateRequest.bind(this, a))
        })
    }

    private sendNavigateRequest(element: HTMLElement): void {
        const params = this.getParams();

        console.info('tusam', element);

        this.browser.tabs.query(params, (tabs)=>{
            const currentTab = tabs[0].id;
            const url = element.getAttribute('href') || '';
            const request = this.formatRequest(Action.NAVIGATE, url);

            currentTab && this.browser.tabs.sendMessage(currentTab, request);
        });
    }

    private getParams(){
        return {
            active: true,
            currentWindow: true
        }
    }

    private formatRequest(action: Action, request: object | string){
        return{
            action,
            request
        }
    }
}

const popup = new Popup();

enum Action {
    NAVIGATE = "NAVIGATE"
}

interface CssSelector{
    youtubeLinksList: string;
    list: string;
    link: string;
    a: string;
}

interface CustomElement{
    youtubeLinksListEl: HTMLElement | null;
    listEl: HTMLInputElement | null;
    linkEl: NodeListOf<Element>;
    aEl: NodeListOf<HTMLElement>;
}

interface YoutubeVideo{
    name: string,
    url: string
}