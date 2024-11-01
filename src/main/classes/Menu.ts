import { ButtonStyle } from "tsinsim";
import { EventType } from "../enums/event.js";
import { Button, ButtonType } from "./Button.js";
import { Event } from "./Event.js";
import { Player } from "./Player.js";
import { Interval } from "../utilities/Interval.js";
import Function from "../utilities/Function.js";

const BUTTONS_IN_PAGE = 10;

export class Menu {
    // STATIC START
    static all: Menu[] = [];

    static getActive(player: Player) {
        return Menu.all.find((menu) => menu.valid && menu.Player === player)
    }
    // STATIC END

    valid: boolean;
    Player: Player;
    Group: string;
    Title: string;
    OriginalWidth: number;
    Width: number;

    Page: number;
    Buttons: MenuButton[];

    ParentMenu: Menu | false;
    OnExitCallback: (() => void) | false;

    IntervalName: string;

    constructor(player: Player, Group: string, Title: string = '', Width: number = 30) { 
        // check if player have active menu
        const activeMenu = Menu.getActive(player);
        if(activeMenu) {
            activeMenu.delete();
        }

        this.valid = true;
        this.Player = player;
        this.Group = Group;
        this.Title = Title;

        this.OriginalWidth = Width;
        this.Width = Width;

        this.ParentMenu = false;
        this.OnExitCallback = false;

        this.IntervalName = '';

        this.Page = 0;
        this.Buttons = [];
        this.draw();

        Menu.all.push(this);
    }

    draw() {
        if(!this.valid) return;

        const ButtonsToDraw = this.Buttons.slice(this.Page*BUTTONS_IN_PAGE, this.Page*BUTTONS_IN_PAGE+BUTTONS_IN_PAGE);

        // draw offsets
        var width = this.Width;
        var height = 8;

        // calculate height from buttons
        for(const button of ButtonsToDraw) {
            height += button.Height;
        }

        // add pagination height
        if(this.Buttons.length > BUTTONS_IN_PAGE) {
            height += 6;
        }

        // body offsets
        const position = { top: (200-height)/2, left: (200-width)/2 };

        // header
        Button.create(ButtonType.SIMPLE, this.Player, 'BG', this.Group, width, height, position.top, position.left, '', ButtonStyle.ISB_DARK);
        Button.create(ButtonType.SIMPLE, this.Player, 'TITLE', this.Group, width, 6, position.top, position.left, this.Title, ButtonStyle.ISB_DARK); 
    
        if(this.ParentMenu) {
            Button.create(ButtonType.CLICK, this.Player, 'BACK', this.Group, 5, 4, position.top+1, position.left+1, '^2Back', ButtonStyle.ISB_DARK, { Callback: () => {
                this.delete();

                if(this.ParentMenu) {
                    Menu.all.push(this.ParentMenu);
                    this.ParentMenu.valid = true;
                    this.ParentMenu.draw();
                }
            } }); 
        }

        Button.create(ButtonType.CLICK, this.Player, 'EXIT', this.Group, 5, 4, position.top+1, position.left+width-6, '^1X', ButtonStyle.ISB_DARK, { Callback: () => {
            this.delete();

            if(this.OnExitCallback) {
                this.OnExitCallback();
            }
        } }); 

        position.top += 6;

        // draw buttons
        for(const button of ButtonsToDraw) {
            position.top += button.draw(width-4, position.top, position.left);
        }

        // pages
        if(this.Page > 0) {
            Button.create(ButtonType.CLICK, this.Player, 'BACK PAGE', this.Group, 5, 4, position.top+2, position.left+2, '^2<<', ButtonStyle.ISB_LIGHT, { Callback: () => {
                this.Page--;
                this.redraw();
            } })
        }

        if(this.Buttons.length > BUTTONS_IN_PAGE) {
            console.log(this.Buttons.length,BUTTONS_IN_PAGE, Math.ceil((this.Buttons.length/BUTTONS_IN_PAGE)))
            
            
            Button.create(ButtonType.INPUT, this.Player, 'PAGE', this.Group, this.Width-14, 4, position.top+2, position.left+7, '^7Page ^2' + (this.Page+1) + ' ^7of ' + Math.ceil((this.Buttons.length/BUTTONS_IN_PAGE)), ButtonStyle.ISB_LIGHT, { Callback: (text: string) => {
                const page = Function.int(text);
                if(page < 1 || page > Math.ceil((this.Buttons.length/BUTTONS_IN_PAGE))) return;

                this.Page = page-1;
                this.redraw();
            } })
        }


        if(this.Buttons.length > (this.Page+1)*BUTTONS_IN_PAGE) {
            Button.create(ButtonType.CLICK, this.Player, 'NEXT PAGE', this.Group, 5, 4, position.top+2, position.left+width-7, '^2>>', ButtonStyle.ISB_LIGHT, { Callback: () => {
                this.Page++;
                this.redraw();
            } })
        }
    }

    redraw() {
        if(!this.valid) return;

        Button.deleteGroup(this.Player, this.Group);
        this.draw();
    }

    setParent(menu: Menu): Menu {
        if(!this.valid) return this;

        this.ParentMenu = menu;
        this.draw();

        return this;
    }

    setTitle(Title: string): Menu {
        if(!this.valid) return this;

        this.Title = Title;
        this.draw();

        return this;
    }
 
    addButton(Type: MenuButtonType, Text: string = '', Callback: ((button: MenuButton, flags: string) => void) | ((button: MenuButton, text: string) => void) | false = false, Cache: any[] = []): MenuButton {
        const menuButton = new MenuButton(this, Type, Text, Callback, Cache);
        this.Buttons.push(menuButton);
        this.draw();

        return menuButton;
    }

    createButtonSpace() {
        return this.addButton(MenuButtonType.BUTTON_SPACE);
    }

    onExit(Callback: () => void) {
        if(!this.valid) return;

        this.OnExitCallback = Callback;
    }
 
    setInterval(callback: () => void, ms: number) {
        this.clearInterval();

        this.IntervalName = 'menu-' + this.Group + '-interval';
        Interval.set(this.IntervalName, callback, ms, false).bind(this);
        
    }

    clearInterval() {
        Interval.clearByBind(this);
    }

    deleteAllButtonsButKeepThose(...keepButtons: MenuButton[]): Menu {
        for(const button of this.Buttons) {
            if(!keepButtons.includes(button)) {
                button.delete();
            }
        }

        return this;
    }

    delete() {
        if(!this.valid) return;

        this.clearInterval()

        this.valid = false;
        Menu.all = Menu.all.filter((menu) => menu !== this);

        
        Button.deleteGroup(this.Player, this.Group);

        return true;
    }
}

export enum MenuButtonType {
    BUTTON_SPACE,
    BUTTON_TEXT,
    BUTTON_CLICK,
    BUTTON_INPUT
}

export enum MenuButtonTextLocation {
    CENTER,
    SIDE_LEFT,
    SIDE_RIGHT
}

const MenuButtonHeight = {
    [MenuButtonType.BUTTON_SPACE]: 3,
    [MenuButtonType.BUTTON_TEXT]: 5,
    [MenuButtonType.BUTTON_CLICK]: 6,
    [MenuButtonType.BUTTON_INPUT]: 6
}

export class MenuButton {
    static id: number = 0;

    id: number;
    valid: boolean;
    Menu: Menu;
    Type: MenuButtonType;

    Text: string;
    TextDefault: string;
    TextSide: MenuButtonTextLocation;
    TextInput: string;
    Description: string[];

    Callback: ((button: MenuButton, text: string) => void) | false;
    Cache: any[];

    Height: number;
    Style: ButtonStyle;
    TypeIn: number;

    constructor(Menu: Menu, Type: MenuButtonType, Text: string, Callback: ((button: MenuButton, flags: string) => void) | ((button: MenuButton, text: string) => void) | false, Cache: any[]) {
        MenuButton.id++;
        this.id = MenuButton.id;
       
        this.valid = true;
        this.Menu = Menu;
        this.Type = Type;
        
        this.Text = Text;
        this.TextDefault = Text;
        this.TextSide = MenuButtonTextLocation.CENTER;
        this.TextInput = '';
        this.Description = [];

        this.Callback = Callback;
        this.Cache = Cache;

        this.Height = 0;
        this.Style = ButtonStyle.ISB_LIGHT;
        this.TypeIn = 95;

        // set default height
        this.recalculateHeight();

        return this;
    }

    recalculateHeight() {
        this.Height = MenuButtonHeight[this.Type];

        if(this.Description.length > 0) {
            this.Height += 4+this.Description.length*3;
        }
    }

    draw(Width: number, Top: number, Left: number): number {
        if(!this.valid || !this.Menu.valid) return 0;
        this.recalculateHeight();

        if(this.Description.length > 0) {
            var buttonHeight = 8+this.Description.length*3;
            Button.create(ButtonType.SIMPLE, this.Menu.Player, 'BUTTON BG ' + this.id, this.Menu.Group, Width, buttonHeight, Top+1, Left+2, '', this.Style);
            Button.create(ButtonType.SIMPLE, this.Menu.Player, 'BUTTON LINE ' + this.id, this.Menu.Group, Width, 1, Top+1+5, Left+2, '', this.Style == ButtonStyle.ISB_DARK ? ButtonStyle.ISB_LIGHT : ButtonStyle.ISB_DARK);
            
            for(const description of this.Description) {
                Button.create(ButtonType.SIMPLE, this.Menu.Player, 'BUTTON DESCRIPTION ' + this.id + ' ' + this.Description.indexOf(description), this.Menu.Group, Width, 3, Top+1+5+2+(this.Description.indexOf(description)*3), Left+2, description, 0);
            }
        }

        if(this.Type === MenuButtonType.BUTTON_SPACE) {
            Button.create(ButtonType.SIMPLE, this.Menu.Player, 'BUTTON ' + this.Type + ' ' + this.id, this.Menu.Group, Width, 3, Top, Left+2, '', ButtonStyle.ISB_NONE);
        }

        if(this.Type === MenuButtonType.BUTTON_TEXT) {
            Button.create(ButtonType.SIMPLE, this.Menu.Player, 'BUTTON ' + this.Type + ' ' + this.id, this.Menu.Group, Width, 4, Top+1, Left+2, this.TextSide === MenuButtonTextLocation.CENTER ? this.Text : '   ' + this.Text + '   ', (this.Description.length > 0 ? 0 : this.Style) + (this.TextSide === MenuButtonTextLocation.SIDE_LEFT ? ButtonStyle.ISB_LEFT : (this.TextSide === MenuButtonTextLocation.SIDE_RIGHT ? ButtonStyle.ISB_RIGHT : 0)));
        }

        if(this.Type === MenuButtonType.BUTTON_CLICK) {
            Button.create(ButtonType.CLICK, this.Menu.Player, 'BUTTON ' + this.Type + ' ' + this.id, this.Menu.Group, Width, 5, Top+1, Left+2, this.TextSide === MenuButtonTextLocation.CENTER ? this.Text : '   ' + this.Text + '   ', (this.Description.length > 0 ? 0 : this.Style) + (this.TextSide === MenuButtonTextLocation.SIDE_LEFT ? ButtonStyle.ISB_LEFT : (this.TextSide === MenuButtonTextLocation.SIDE_RIGHT ? ButtonStyle.ISB_RIGHT : 0)), { Callback: (flags: string) => {
                if(this.Callback) {
                    this.Callback(this, flags);
                }
            } });
        }

        if(this.Type === MenuButtonType.BUTTON_INPUT) {
            Button.create(ButtonType.INPUT, this.Menu.Player, 'BUTTON ' + this.Type + ' ' + this.id, this.Menu.Group, Width, 5, Top+1, Left+2, this.TextSide === MenuButtonTextLocation.CENTER ? this.Text : '   ' + this.Text + '   ', (this.Description.length > 0 ? 0 : this.Style) + (this.TextSide === MenuButtonTextLocation.SIDE_LEFT ? ButtonStyle.ISB_LEFT : (this.TextSide === MenuButtonTextLocation.SIDE_RIGHT ? ButtonStyle.ISB_RIGHT : 0)), { TypeIn: this.TypeIn, Text2: this.TextInput, Callback: (text: string) => {
                if(this.Callback) {
                    this.Callback(this, text);
                }
            } });
        }

        return this.Height;
    }

    setDefaultText(): MenuButton {
        return this.setText(this.TextDefault);
    }

    setText(Text: string): MenuButton {
        if(!this.valid || !this.Menu.valid) return this;
        if(this.Text === Text) return this;

        this.Text = Text;
        this.Menu.draw();

        return this;
    }

    setInputText(Text: string): MenuButton {
        if(!this.valid || !this.Menu.valid) return this;
        if(this.TextInput === Text) return this;

        this.TextInput = Text;
        this.Menu.draw();

        return this;
    }

    setTextSide(Side: MenuButtonTextLocation): MenuButton {
        if(!this.valid || !this.Menu.valid) return this;
        if(this.TextSide === Side) return this;

        this.TextSide = Side;
        this.Menu.draw();
        
        return this;
    }

    setStyle(Style: ButtonStyle): MenuButton {
        if(!this.valid || !this.Menu.valid) return this;
        if(this.Style === Style) return this;

        this.Style = Style;
        this.Menu.draw();

        return this;
    }

    setTypeIn(TypeIn: number): MenuButton {
        if(!this.valid || !this.Menu.valid) return this;
        if(this.TypeIn === TypeIn) return this;

        this.TypeIn = TypeIn;
        this.Menu.draw();

        return this;
    }

    setDescription(...args: string[]): MenuButton {
        if(!this.valid || !this.Menu.valid) return this;
        if(this.Description === args) return this;

        this.Description = args;
        this.recalculateHeight();
        this.Menu.draw();

        return this;
    }

    delete() {
        if(!this.valid || !this.Menu.valid) return;

        this.valid = false;
        Button.deleteGroup(this.Menu.Player, 'BUTTON ' + this.Type + this.id)
        this.Menu.Buttons = this.Menu.Buttons.filter((button) => button !== this);
        this.Menu.redraw();
    }
}

Event.on(EventType.BUTTON_CLEAR, (player: Player) => {
    const menu = Menu.getActive(player);
    if(menu && menu.valid) {
        menu.delete();
    }
});

/*
Event.on(EventType.PLAYER_CONNECTED, (player: Player) => {
    const Menu1 = new Menu(player, 'testas1', 'title1', 30);
    const Menu2 = new Menu(player, 'testas2', 'title2', 30);
    Menu2.onExit(() => {
        console.log('exited 2')
    })

    Menu1.onExit(() => {
        console.log('exited 1')
    })

    Menu2.ParentMenu = Menu1;
    
    //Menu2.addButton(MenuButtonType.BUTTON_SPACE);
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas').setStyle(ButtonStyle.ISB_DARK).setDescription('testas');
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas').setStyle(ButtonStyle.ISB_LIGHT).setDescription('testas');

    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas').setStyle(ButtonStyle.ISB_LIGHT).setDescription('testas');
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas').setStyle(ButtonStyle.ISB_LIGHT).setDescription('testas');
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')
    Menu2.addButton(MenuButtonType.BUTTON_TEXT, '^7testas')


    Menu2.addButton(MenuButtonType.BUTTON_CLICK, '^7testas', (button: MenuButton, flags: string) => {
        Menu2.setTitle('testas1')
    })

    Menu2.addButton(MenuButtonType.BUTTON_INPUT, '^7testas', (button: MenuButton, text: string) => {
        
    }).setInputText('asdtestas').setTextSide(MenuButtonTextLocation.CENTER)
    
})*/