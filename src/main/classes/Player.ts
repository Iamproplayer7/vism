import { PacketType } from "tsinsim";
import { IS_CIM, IS_CNL, IS_CPR, IS_NCI, IS_NCN } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Event } from "./Event.js";
import { EventType } from "../enums/event.js";
import { Server } from "./Server.js";


export class Player {
    // STATIC START
    static all: Player[] = [];
    static getByUCID(UCID: number) {
        return Player.all.find((p) => p.UCID === UCID) ?? false;
    }

    static getByName(Name: string) {
        return Player.all.find((p) => p.Name.toLowerCase() === Name.toLowerCase()) ?? false;
    }

    static getByUsername(Username: string) {
        return Player.all.find((p) => p.Username.toLowerCase() === Username.toLowerCase()) ?? false;
    }
    // STATIC END

    // DEFAULT VALUES
    valid: boolean = false;
    readonly Server: Server;
    readonly UCID: number;
    readonly Admin: boolean;
    readonly Username: string;
    Name: string;
    UserID?: number;
    Language?: number;
    IpAdress?: string;
    Interface: { Mode: number, SubMode: number, SelType: number };
    
    constructor(data: IS_NCN, server: Server) {
        // base
        this.valid = true;
        this.Server = server;
        this.UCID = data.UCID;
        this.Username = data.UName;
        this.Admin = data.Admin == 1;
        this.Name = data.PName;

        // interface
        this.Interface = { Mode: 0, SubMode: 0, SelType: 0 };
    }

    // getters
    public getUCID() {
        return this.UCID;
    }

    public getUserID() {
        return this.UserID;
    }

    public getName() {
        return this.Name;
    }

    public getUsername() {
        return this.Username;
    }

    public isAdmin() {
        return this.Admin;
    }

    public getIpAdress() {
        return this.IpAdress;
    }

    public getInterface() {
        return this.Interface;
    }
}

Packet.on(PacketType.ISP_NCN, (data: IS_NCN, server: Server) => {
    if(data.UCID === 0) return;
    
    Player.all.push(new Player(data, server));
    Event.fire(EventType.PLAYER_CONNECTING, Player.getByUCID(data.UCID));
});

Packet.on(PacketType.ISP_NCI, (data: IS_NCI) => {
    const player = Player.getByUCID(data.UCID);
    if(!player) return;

    player.UserID = data.UserID;
    player.Language = data.Language;
    player.IpAdress = data.IpAddress;

    Event.fire(EventType.PLAYER_CONNECTED, player);
});

Packet.on(PacketType.ISP_CPR, (data: IS_CPR) => {
    const player = Player.getByUCID(data.UCID);
    if(!player) return;

    const Name = player.Name;
    player.Name = data.PName;
    Event.fire(EventType.PLAYER_NAME_UPDATE, player, { old: Name, new: data.PName });
});

Packet.on(PacketType.ISP_CIM, (data: IS_CIM) => {
    const player = Player.getByUCID(data.UCID);
    if(!player) return;

    player.Interface = { Mode: data.Mode, SubMode: data.SubMode, SelType: data.SelType };
    Event.fire(EventType.PLAYER_INTERFACE_UPDATE, player, player.Interface);
});

Packet.on(PacketType.ISP_CNL, (data: IS_CNL) => {
    const player = Player.getByUCID(data.UCID);
    if(!player) return;

    const indexOf = Player.all.indexOf(player);
    if(indexOf !== -1) {
        Event.fire(EventType.PLAYER_DISCONNECTED, Player.getByUCID(data.UCID), data.Reason);
        Player.all.splice(indexOf, 1);
    }
});