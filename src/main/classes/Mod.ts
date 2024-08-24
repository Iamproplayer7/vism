import { IS_MAL } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Server } from "./Server.js";

export const Mod = {
    allowed: [] as { server: Server, id: string }[],

    exists(server: Server, id: string) {
        return this.allowed.find((m) => m.server === server && m.id === id);
    },

    allowAllMods(server: Server) {
        this.update(server, true);
    },

    update(server: Server, all = false) {
        Packet.send(server, new IS_MAL({ SkinID: all ? [] : this.allowed.map(m => m.id) }))
    },

    add(server: Server, id: string) {
        if(!this.exists(server, id)) {
            this.allowed.push({ server, id });
        }
        
        this.update(server);
    },

    remove(server: Server, id: string) {
        this.allowed = this.allowed.filter((mod) => mod.server !== server || mod.id !== id);
    }
}