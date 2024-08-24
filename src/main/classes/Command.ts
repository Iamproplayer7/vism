import { IS_MSO, PacketType, UserType } from "tsinsim";
import { Packet } from "./Packet.js";
import { Server } from "./Server.js";
import { PlayerGetter } from "./Player.js";

type CallbackFn = (...args: any[]) => void;

export const Command = {
    all: [] as { name: string, callback: CallbackFn }[],

    on(name: string, callback: CallbackFn) {
        this.all.push({ name, callback });
    },

    off(name: string) {
        this.all = this.all.filter((command) => command.name !== name);
    },

    fire(name: string, ...args: any[]) {
        this.all.filter((command) => command.name === name).forEach((command) => {
            command.callback(...args);
        });
    }
}

Packet.on(PacketType.ISP_MSO, (data: IS_MSO, server: Server) => {
    if(data.UserType !== UserType.MSO_PREFIX) return;
    const player = PlayerGetter.getByUCID(server, data.UCID); if(!player) return;
    const Message = data.Text.slice(data.TextStart, data.Text.length);if(Message.length <= 1) return;
    
    const MessageChunks = Message.split(' ');
    Command.fire(MessageChunks[0].slice(1, MessageChunks[0].length), player, ...MessageChunks.slice(1, MessageChunks.length));
});