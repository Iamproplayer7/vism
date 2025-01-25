import { PacketType, Sendable } from "tsinsim/packets";
import { Server } from "./Server.js";

type Packet = { id: number, name: PacketType, callback: CallbackFn, bind?: any };
type CallbackFn = (data: any, server: Server) => void;

export const Packet = {
    all: [] as Packet[],
    number: 0,

    on(name: PacketType | PacketType[], callback: CallbackFn) {
        var idsOfHandlers: number[] = [];

        if(Array.isArray(name)) {
            for(const n of name) {
                const packetId = Packet.number++;
                this.all.push({ id: packetId, name: n, callback, bind: null })
                idsOfHandlers.push(packetId);
            }
        }
        else {
            const packetId = Packet.number++;
            this.all.push({ id: packetId, name: name, callback, bind: null })
            idsOfHandlers.push(packetId);
        }

        return {
            id: idsOfHandlers.length == 1 ? idsOfHandlers[0] : idsOfHandlers,
            bind(entity: any) {
                for(const id of idsOfHandlers) {
                    const packet = Packet.all.find((p) => p.id === id);
                    if(packet) {
                        packet.bind = entity;
                    }
                }
            }
        }
    },

    offByName(name: PacketType) {
        this.all = this.all.filter((packet) => packet.name !== name);
    },

    offById(id: number) {
        this.all = this.all.filter((packet) => packet.id !== id);
    },

    offByBind(entity: any) {
        for(const packet of this.all.filter((packet) => packet.bind === entity)) {
            this.offById(packet.id);
        }
    },

    send(server: Server, packet: Sendable) {
        server.InSimHandle.sendPacket(packet);
    }
}