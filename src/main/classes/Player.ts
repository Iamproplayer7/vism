import { CarFlags, PacketType } from "tsinsim";
import { IS_CIM, IS_CNL, IS_CPR, IS_MST, IS_MTC, IS_NCI, IS_NCN, IS_PLC } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Event } from "./Event.js";
import { EventType } from "../enums/event.js";
import { Server } from "./Server.js";
import { Interval } from "../utilities/Interval.js";
import { Vehicle } from "./Vehicle.js";

export const PlayerGetter = {
    all: [] as Player[],

    getByUCID(server: Server, UCID: number) {
        return this.all.find((player) => player.getServer() === server && player.getUCID() === UCID);
    },

    getByName(server: Server, Name: string) {
        return this.all.find((player) => player.getServer() === server && player.getName().toLowerCase() === Name.toLowerCase());
    },

    getByUsername(server: Server, Username: string) {
        return this.all.find((player) => player.getServer() === server && player.getUsername().toLowerCase() === Username.toLowerCase());
    },

    getByHalfUsername(server: Server, Username: string) {
        const players = this.all.filter((player) => player.getServer() === server && Username.length >= 3 && player.getUsername().toLowerCase().includes(Username));
        return players.length < 1 ? false : (players.length == 1 ? players[0] : players);
    },

    getByUserID(server: Server, UserID: number) {
        return this.all.find((player) => player.getServer() === server && player.getUserID() === UserID);
    }
}

type Interface = { Mode: number, SubMode: number, SelType: number };

export interface Player {
    valid: boolean; 
    getServer(): Server; 
    getUCID(): number; 
    getUserID(): number;
    getName(): string;
    isLocal(): boolean;
    getUsername(): string;
    isAdmin(): boolean;
    getLanguage(): number;
    getIpAdress(): string;

    getVehicle(): Vehicle | false;
    setVehicle(vehicle: Vehicle | false): void;

    getAIVehicles(): Vehicle[];
    addAIVehicle(vehicle: Vehicle): void;

    getInterface(): Interface;

    kick(text: string): void;
    message(text: string, sound?: number): void;

    // interval
    setInterval(name: string, callback: () => void, ms: number, fireWhenCreated?: boolean): void;
    clearInterval(name: string): void;
    getIntervals(): Interval[];
    getInterval(name: string): undefined | Interval;

    allowVehicles(vehiclesFlags: CarFlags[]): void,
}

class PlayerInternal implements Player  {
    valid: boolean;

    private Server: Server;
    private UCID: number;
    private Username: string;
    private Admin: boolean;
    private Name: string;

    private Local: boolean;

    private UserID: number = 0;
    private Language: number = 0;
    private IpAdress: string = '0.0.0.0';

    private Vehicle: Vehicle | false = false;
    private AIVehicles: Vehicle[] = [];
    private Interface: Interface = { Mode: 0, SubMode: 0, SelType: 0 };

    constructor(data: IS_NCN, server: Server) {
        this.valid = true;
        this.Server = server;
        this.UCID = data.UCID;
        this.Username = data.UName;
        this.Admin = data.Admin == 1;
        this.Name = data.PName;

        this.Local = data.Flags === 0;
        
        // additional player info
        Packet.on(PacketType.ISP_NCI, (data: IS_NCI, server: Server) => {
            if(server !== this.Server || data.UCID !== this.UCID) return;
        
            this.UserID = data.UserID;
            this.Language = data.Language;
            this.IpAdress = data.IpAddress;

            Event.fire(EventType.PLAYER_CONNECTED, this);
        }).bind(this);

        // player name change
        Packet.on(PacketType.ISP_CPR, (data: IS_CPR, server: Server) => {
            if(server !== this.Server || data.UCID !== this.UCID) return;
        
            const Name = this.Name;
            this.Name = data.PName;
            Event.fire(EventType.PLAYER_NAME_UPDATE, this, { old: Name, new: data.PName });
        }).bind(this);
        
        // player interface change
        Packet.on(PacketType.ISP_CIM, (data: IS_CIM, server: Server) => {
            if(server !== this.Server || data.UCID !== this.UCID) return;
        
            this.Interface = { Mode: data.Mode, SubMode: data.SubMode, SelType: data.SelType };
            Event.fire(EventType.PLAYER_INTERFACE_UPDATE, this, this.Interface);
        }).bind(this);
        
        // player disconnects
        Packet.on(PacketType.ISP_CNL, (data: IS_CNL, server: Server) => {
            if(server !== this.Server || data.UCID !== this.UCID) return;
        
            Event.fire(EventType.PLAYER_DISCONNECTED, this, data.Reason);
            this.valid = false;

            Packet.offByBind(this);
            PlayerGetter.all = PlayerGetter.all.filter((player) => player !== this);
        }).bind(this);
    }

    getServer()                  { return this.Server;    };
    getUCID()                    { return this.UCID;      };
    getUserID()                  { return this.UserID;    };
    getName()                    { return this.Name;      };
    isLocal()                    { return this.Local;     };
    getUsername()                { return this.Username;  };
    isAdmin()                    { return this.Admin;     };
    getLanguage()                { return this.Language;  };
    getIpAdress()                { return this.IpAdress;  };
    getVehicle()                 { return this.Vehicle;   };
    setVehicle(vehicle: Vehicle) { this.Vehicle = vehicle; }
    getAIVehicles()                 { return this.AIVehicles;   };
    getInterface()               { return this.Interface; };
       
    setInterval(name: string, callback: () => void, ms: number) {
        Interval.set(`player-${this.getUCID()}-${name}`, () => {
            callback();
        }, ms).bind(this);
    };

    clearInterval(name: string) {
        Interval.clear(`player-${this.getUCID()}-${name}`);
    }

    getIntervals() {
        return Interval.all.filter((interval) => interval.name.includes(`player-${this.getUCID()}`));
    }

    getInterval(name: string) {
        return Interval.all.find((interval) => interval.name.includes(`player-${this.getUCID()}-${name}`));
    }

    message(text: string, sound?: number) {
        this.Server.InSimHandle.sendPacket(new IS_MTC({ UCID: this.UCID, Text: text, Sound: sound ?? 0 }));
    }

    kick(text: string = '') {
        if(text == '') {
            return this.Server.InSimHandle.sendPacket(new IS_MST({ Msg: '/kick ' + this.Username }));
        }

        this.message(text);

        setTimeout(() => {
            if(!this.valid) return;
            this.Server.InSimHandle.sendPacket(new IS_MST({ Msg: '/kick ' + this.Username }));
        }, 100);
    }

    allowVehicles(vehiclesFlags: CarFlags[]) {
        var flags = 0;
        for(const vehFlag of vehiclesFlags) {
            flags += vehFlag;
        }

        this.Server.InSimHandle?.sendPacket(new IS_PLC({ UCID: 255, Cars: flags }))
    }

    addAIVehicle(vehicle: Vehicle) { 
        this.AIVehicles.push(vehicle);
    }
}

// creating the player
Packet.on(PacketType.ISP_NCN, (data: IS_NCN, server: Server) => {
    if(data.UCID === 0) return;
    
    const player = new PlayerInternal(data, server);
    PlayerGetter.all.push(player);
    Event.fire(EventType.PLAYER_CONNECTING, player);
});