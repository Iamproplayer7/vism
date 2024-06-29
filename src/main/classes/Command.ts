import { IS_MSO, PacketType, UserType } from "tsinsim";
import { Packet } from "./Packet.js";
import { Player } from "./Player.js";

// STATIC CLASS
export class Command {
    constructor() { 
        throw new Error('VISM.Command is a static class. new VISM.Command cannot be constructed.');
    }

    // STATIC START
    static all: { name: string, callback: (...args: any[]) => void }[] = [];
    static on(name: string, callback: (...args: any[]) => void) {
        this.all.push({ name, callback });
    }

    static off(name: string) {
        const command = this.all.find((command) => command.name === name);
        if(command) {
            const indexOf = this.all.indexOf(command);
            if(indexOf !== -1) {
                this.all.splice(indexOf, 1);
            }
        }
    }

    static fire(name: string, ...args: any[]){
        const commands = this.all.filter((command) => command.name === name);
        for(const command of commands) {
            command.callback(...args);
        }
    }
    // STATIC END
}

Packet.on(PacketType.ISP_MSO, (data: IS_MSO) => {
    if(data.UserType !== UserType.MSO_PREFIX) return;
    const player = Player.getByUCID(data.UCID);
    if(!player) return;

    const Text = data.Text.slice(data.TextStart, data.Text.length);
    if(Text.length <= 1) return;

    const _ = Text.split(' ');
    Command.fire(_[0].slice(1, _[0].length), player, ..._.slice(1, _.length));
});