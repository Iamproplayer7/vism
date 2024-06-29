import { InSim } from "tsinsim";
import { IS_ISI } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Event } from "./Event.js";
import { EventType } from "../enums/event.js";

export class Server {
    // STATIC START
    static all: Server[] = [];
    // STATIC END

    InSimHandle: InSim | null;

    constructor(InSimOptions: Partial<IS_ISI>) {
        this.InSimHandle = new InSim(InSimOptions);

        // handle InSim events
        this.InSimHandle.onGlobal((name, data) => {
            for(const packet of Packet.all) {
                if(packet.name == name) {
                    packet.callback(data, this);
                }
            }
        });

        this.InSimHandle.on('connected', () => {
            console.log('[InSim] Connected');
            Event.fire(EventType.SERVER_CONNECTED, this);
        });

        this.InSimHandle.on('disconnect', () => {
            console.log('[InSim] Disconnected');
            Event.fire(EventType.SERVER_DISCONNECTED, this);
        });
    }

    connect(Host: string, Port: number) {
        if(!(this.InSimHandle instanceof InSim)) return;

        console.log('[InSim] Connecting to ' + Host + ':' + Port);
        this.InSimHandle.connect({ Host, Port });
    }
}