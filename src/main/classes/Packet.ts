import { PacketType, Sendable } from "tsinsim/packets";
import { Server } from "./Server.js";

type Packet = { name: PacketType, callback: CallbackFn, bind?: any };
type CallbackFn = (data: any, server: Server) => void;

export const Packet = {
    all: [] as Packet[],

    on(name: PacketType | PacketType[], callback: CallbackFn) {
        var created: number[] = [];

        if(Array.isArray(name)) {
            for(const n of name) {
                created.push(this.all.push({ name: n, callback, bind: null })-1);
            }
        }
        else {
            created.push(this.all.push({ name: name, callback, bind: null })-1);
        }
        
        const self = this;
        return {
            bind(entity: any) {
                self.all.forEach((v, i) => {
                    if(created.includes(i)) {
                        v.bind = entity;
                    }
                })
            }
        }
    },

    off(name: PacketType) {
        this.all = this.all.filter((packet) => packet.name !== name);
    },

    offByBind(entity: any) {
        this.all.filter((packet) => packet.bind === entity).forEach((packet) => {
            this.off(packet.name);
        });
    },

    send(server: Server, packet: Sendable) {
        server.InSimHandle.sendPacket(packet);
    }
}