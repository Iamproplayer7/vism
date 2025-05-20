import { ButtonClickFlags, ButtonFunction, ButtonStyle, IS_BFN, IS_BTC, IS_BTN, IS_BTT, PacketType } from "tsinsim";
import { Player, PlayerGetter } from "./Player.js";
import { Server } from "./Server.js";
import { Event } from "./Event.js";
import { EventType } from "../enums/event.js";
import { Packet } from "./Packet.js";

export enum ButtonType {
    SIMPLE,
    CLICK,
    INPUT
}

type SimpleButton = {
    Name: string, Group: string, Width: number, Height: number, Top: number, Left: number, Text: string, Style: ButtonStyle, Inst?: number
}

type ClickButton = {
    Name: string, Group: string, Width: number, Height: number, Top: number, Left: number, Text: string, Style: ButtonStyle, Callback: (flags: number) => void, Inst?: number
}

type InputButton = {
    Name: string, Group: string, Width: number, Height: number, Top: number, Left: number, Text: string, Text2?: string, TypeIn?: number, Style: ButtonStyle, Callback: (text: string) => void
}

type SimpleButtonAdd = {
    Inst?: number
}

type ClickButtonAdd = {
    Callback: (flags: number) => void, Inst?: number
}

type InputButtonAdd = {
    Text2?: string, TypeIn?: number, Callback: (text: string) => void
}

// STATIC CLASS
export class Button {
    // STATIC START
    static all: Button[] = [];

    static create(type: ButtonType, player: Player, Name: string, Group: string, Width: number, Height: number, Top: number, Left: number, Text: string, Style: number, data?: SimpleButtonAdd | ClickButtonAdd | InputButtonAdd): Button {
        const button = Button.getByUCIDNameGroup(player.getServer(), player.getUCID(), Name, Group);
        if(button) {
            return button.update({ Width, Height, Top, Left, Text, Style, ...data });
        }
        
        const newButton = new Button(type, player, { Name, Group, Width, Height, Top, Left, Text, Style, ...data } as SimpleButton | InputButton | ClickButton);
        Button.all.push(newButton);

        Event.fire(EventType.BUTTON_CREATED, newButton);
        return newButton;
    }

    static getByUCID(server: Server, UCID: number) {
        return Button.all.filter((button) => button.valid && server == button.Server && button.Player.getUCID() === UCID);
    }

    static getByPlayer(player: Player) {
        return Button.getByUCID(player.getServer(), player.getUCID());
    }

    static getByUCIDNameGroup(server: Server, UCID: number, Name: string, Group: string) {
        return Button.getByUCID(server, UCID).find((button) => button.valid && button.Name === Name && button.Group === Group);
    }

    static getByUCIDGroup(server: Server, UCID: number, Group: string) {
        return Button.getByUCID(server, UCID).find((button) => button.valid && button.Group === Group);
    }

    static getByPlayerNameGroup(player: Player, Name: string, Group: string) {
        return Button.getByPlayer(player).find((button) => button.valid && button.Name === Name && button.Group === Group);
    }

    static getByPlayerGroup(player: Player, Group: string) {
        return Button.getByPlayer(player).filter((button) => button.valid && button.Group === Group);
    }

    static getByUCIDClickID(server: Server, UCID: number, ClickID: number) {
        return Button.getByUCID(server, UCID).find((button) => button.valid && button.ClickID === ClickID);
    }

    static update(player: Player, Name: string, Group: string, data: Partial<SimpleButton> | Partial<InputButton> | Partial<InputButton>) {
        const button = Button.getByPlayerNameGroup(player, Name, Group);
        if(button) {
            button.update(data);
        }
    }

    static delete(player: Player, Name: string, Group: string) {
        const button = Button.getByPlayerNameGroup(player, Name, Group);
        if(button) {
            button.delete();
        }
    }

    static deleteGroup(player: Player, Group: string) {
        const buttons = Button.getByPlayerGroup(player, Group);
        for(const button of buttons) {
            button.delete();
        }
    }
    // STATIC END

    // DEFAULT VALUES
    valid: boolean = false;
    readonly Server: Server;
    readonly Type: number;
    readonly Player: Player;
    ClickID: number;

    Name: string = '';
    Group: string = '';
    Width: number = 0;
    Height: number = 0;
    Top: number = 0;
    Left: number = 0;
    Text: string = '';
    Text2: string = '';
    TypeIn: number = 0;
    Style: number = 0;

    
    Callback: (arg1: string) => void = (arg1: string) => { };
    Inst: number = 0;

    constructor(type: ButtonType, player: Player, data: SimpleButton | ClickButton | InputButton) {
        // base
        this.valid = true;
        this.Type = type;
        this.Server = player.getServer();
        this.Player = player;
        this.ClickID = -1; 

        this.Text2 = '';

        Object.assign(this, { ...data });

        this.draw();
    }

    update(data: Partial<SimpleButton> | Partial<ClickButton> | Partial<InputButton>) {
        var updated = false;
        for(const k of Object.keys(data)) {
            const key = k as keyof typeof data;
            const value = data[key];
            
            if(['Width', 'Height', 'Top', 'Left', 'Text', 'Style', 'Text2', 'TypeIn'].includes(key)) {
                if(this[key] !== value) {
                    this[key] = value as never;
                    updated = true;
                }
            }
        }

        if(updated) { 
            this.draw(); 
            Event.fire(EventType.BUTTON_UPDATE, this);
        }

        return this;
    }

    draw() {
        if(!this.valid) return;

        // generate ClickID
       
        if(this.ClickID === -1) {
            for(var i = 0; i < 200; i++) {
                if(this.ClickID === -1 && !Button.getByUCIDClickID(this.Server, this.Player.getUCID(), i)) {
                    this.ClickID = i;
                }
            }

            if(this.ClickID === -1) {
                throw new Error('VISM.Button Buttons reached maximum amount of ClickIds.');
            }
        }
    
        
        const packet = new IS_BTN;
        packet.UCID = this.Server.isLocal ? 0 : this.Player.getUCID();
        packet.ReqI = this.ClickID + 1;
        packet.ClickID = this.ClickID;
        packet.Inst = this.Inst;
        packet.BStyle = this.Style + (this.Type == ButtonType.CLICK || this.Type == ButtonType.INPUT ? 8 : 0);
        packet.TypeIn = this.TypeIn ? this.TypeIn : (this.Type == ButtonType.INPUT ? 95 : 0);
        packet.W = this.Width;
        packet.H = this.Height;
        packet.T = this.Top;
        packet.L = this.Left;

        packet.Text = this.Text2 != '' ? "\0" + this.Text2 + "\0" + this.Text : this.Text;

        this.Server.InSimHandle?.sendPacket(packet);
    }

    delete() {
        Event.fire(EventType.BUTTON_REMOVED, this);

        this.valid = false;
        Button.all = Button.all.filter((button) => button !== this);

        this.Server.InSimHandle?.sendPacket(new IS_BFN({ SubT: ButtonFunction.BFN_DEL_BTN, UCID: this.Player.getUCID(), ClickID: this.ClickID }));
    }
}

// HANDLE PACKETS
    // IS_BTC: player click button
    // IS_BTT: player type in input
    // IS_BFN: player press SHIFT+I

Packet.on(PacketType.ISP_BTC, (data: IS_BTC, server: Server) => {
    const player = server.isLocal ? 
        PlayerGetter.all.find((p) => p.isLocal()) 
        : PlayerGetter.getByUCID(server, data.UCID);

    if(!player) return;

    const button = Button.getByUCIDClickID(server, player.getUCID(), data.ClickID);
    if(!button) return;

    Event.fire(EventType.BUTTON_CLICK, button, player, data.CFlags);

    if(button.Callback) {
        button.Callback(data.CFlags.toString());
    }
});

Packet.on(PacketType.ISP_BTT, (data: IS_BTT, server: Server) => {
    const player = server.isLocal ? 
        PlayerGetter.all.find((p) => p.isLocal()) 
        : PlayerGetter.getByUCID(server, data.UCID);

    if(!player) return;

    const button = Button.getByUCIDClickID(server, player.getUCID(), data.ClickID);
    if(!button) return;

    Event.fire(EventType.BUTTON_INPUT, button, player, data.Text);

    if(button.Callback) {
        button.Callback(data.Text);
    }
});

Packet.on(PacketType.ISP_BFN, (data: IS_BFN, server: Server) => {
    const player = server.isLocal ? 
        PlayerGetter.all.find((p) => p.isLocal()) 
        : PlayerGetter.getByUCID(server, data.UCID);

    if(!player) return;

    // delete buttons
    for(const button of Button.getByPlayer(player)) {
        button.delete();
    }

    // clear again
    server.InSimHandle?.sendPacket(new IS_BFN({ SubT: ButtonFunction.BFN_CLEAR, UCID: data.UCID }));

    Event.fire(EventType.BUTTON_CLEAR, player);
});