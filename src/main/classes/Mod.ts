import { IS_MAL } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Server } from "./Server.js";

export class Mod {
    // STATIC START
    static allowed: { server: Server, id: string }[] = [];

    static update(server: Server, all: boolean = false) {
        if(!server.InSimHandle) return;

        if(all) {
            Packet.send(server, new IS_MAL({ SkinID: [] }))
        }
        else {
            Packet.send(server, new IS_MAL({ SkinID: this.allowed.map(m => m.id) }))
        }
    }

    static add(server: Server, id: string) {
        if(this.exists(server, id)) {
            this.update(server);
            return;
        }

        this.allowed.push({ server, id });
        this.update(server);
    }

    static remove(server: Server, id: string) {
        const mod = this.exists(server, id)
        if(!mod) return;

        const indexOf = this.allowed.indexOf(mod);
        if(indexOf !== -1) {
            this.allowed.splice(indexOf, 1);
            this.update(server);
        }
    }

    static allowAll(server: Server) {
        this.update(server, true);
    }

    static exists(server: Server, id: string) {
        return this.allowed.find((m) => m.server === server && m.id === id) ?? false;
    }

    static getAll(server: Server) {
        return this.allowed.filter((m) => m.server === server);
    }
    // STATIC END

    constructor() { 
        throw new Error('VISM.Mod is a static class. new VISM.Mod cannot be constructed.');
    }
}