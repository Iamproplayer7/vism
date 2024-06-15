import { PacketType, Sendable } from "tsinsim/packets";
import { Server } from "./Server.js";

// STATIC CLASS
export class Packet {
    constructor() { 
        throw new Error('VISM.Packet is a static class. new VISM.Packet cannot be constructed.');
    }

    // STATIC START
    static all: { name: PacketType, callback: (data: any, server: Server) => void }[] = [];
    static on(name: PacketType | PacketType[], callback: (data: any, server: Server) => void) {
        if(typeof name == 'number') {
            this.all.push({ name, callback });
        }
        else {
            for(const n of name) {
                this.all.push({ name: n, callback });
            }
        }
    }

    static send(Server: Server, packet: Sendable) {
        if(!Server.InSimHandle) return;
        Server.InSimHandle.sendPacket(packet);
    }
    // STATIC END
}