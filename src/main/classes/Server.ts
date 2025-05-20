import { InSim, InSimFlags } from "tsinsim";
import { IS_ISI, IS_MST, IS_MTC } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Event } from "./Event.js";
import { EventType } from "../enums/event.js";

export type Server = {
    InSimHandle: InSim,

    isLocal: boolean,
    connect: (Host: string, Port: number) => void,
    disconnect: () => void,
    message: (text: string, sound?: number) => void,
    command: (text: string) => void
}

export const Server = {
    all: [] as Server[],

    create(InSimOptions: Partial<IS_ISI>) {
        const InSimHandle = new InSim(InSimOptions);
        
        const ServerObject: Server = {
            InSimHandle: InSimHandle,
            isLocal: InSimOptions.Flags ? (InSimOptions.Flags & InSimFlags.ISF_LOCAL) !== 0 : false,

            connect(Host, Port) {
                console.log('[InSim] Connecting to ' + Host + ':' + Port);
                this.InSimHandle.connect({ Host, Port });
            },

            disconnect() {
                console.log('[InSim] Disconnecting...');
                this.InSimHandle.disconnect();
            },
        
            message(text, sound) {
                this.InSimHandle.sendPacket(new IS_MTC({ UCID: 255, Text: text, Sound: sound ?? 0 }));
            },
        
            command(text: string) {
                this.InSimHandle.sendPacket(new IS_MST({ Msg: text }));
            }
        }

        // handle InSim events
        InSimHandle.onGlobal((name, data) => {
            for(const packet of Packet.all.filter((packet) => packet.name === name)) {
                packet.callback(data, ServerObject);
            }
        });

        InSimHandle.on('connected', () => {
            console.log('[InSim] Connected');
            Event.fire(EventType.SERVER_CONNECTED, ServerObject);
        });

        InSimHandle.on('disconnect', () => {
            console.log('[InSim] Disconnected');
            Event.fire(EventType.SERVER_DISCONNECTED, ServerObject);
        });

        this.all.push(ServerObject);

        return ServerObject;
    }
}