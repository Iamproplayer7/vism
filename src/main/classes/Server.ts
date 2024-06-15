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

/*
import { InSim as InSim_, InSimFlags } from 'tsinsim';

const INSIM_VERSION = 9;
const INTERVAL = 100;

export const InSim = new InSim_({
    Admin: 'test',                      
    Flags: InSimFlags.ALL_MULTIPLAYER,
    Interval: INTERVAL, 
    InSimVer: INSIM_VERSION, 
    IName: 'VISM',
    Prefix: 33                        
});

InSim.connect({ 
    Host: '188.122.74.155', 
    Port: 51617 
});
*/