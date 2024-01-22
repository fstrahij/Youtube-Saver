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

        this.getStorage(this.youtubeStoreKey);

        console.log('Popup object created!');     
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

    private setEventListener(element: HTMLElement | null, event: string, customMethod?: any, isPassEvent: boolean = false){
        console.log(`Setting event listener - ${event} -  on element - ${element}...`);

        element?.addEventListener(event, (e)=>{
            e.preventDefault();
            e.stopPropagation();
            isPassEvent ? customMethod(e) : customMethod();
        });

        console.log('Event listener set!');
    }

    private deleteEventListener(element: HTMLElement | null, event: string, customMethod?: any){
        console.log(`Removing event listener - ${event} -  on element - ${element}...`);

        element?.removeEventListener(event, (e)=>{
            e.preventDefault();
            e.stopPropagation();
            customMethod();
        });

        console.log('Event listener set!');
    }

    private getStorage(key:string){
        this.localStorage
            .get([key])
            .then((result)=>{
                this.youtubeLinks = result[ this.youtubeStoreKey ] ? [ ...result[ this.youtubeStoreKey ] ] : [];
                this.injectList();
            });           
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
            this.deleteEventListener(a, 'click', this.sendNavigateRequest.bind(this, a));
        });

        this.setEventListener(this.element.listEl, 'click', this.sendNavigateRequest.bind(this), true);
    }

    private sendNavigateRequest(event: PointerEvent): void {
        const params = this.getParams();
        const element = event.target as HTMLElement;

        const anchorChild = element.className === this.cssSelector.link ? element.children[0] : element;

        this.browser.tabs.query(params, (tabs)=>{
            const currentTab = tabs[0].id;
            const url = anchorChild.getAttribute('href') || '';
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
    linkEl: NodeListOf<HTMLElement>;
    aEl: NodeListOf<HTMLElement>;
}

interface YoutubeVideo{
    name: string,
    url: string
}