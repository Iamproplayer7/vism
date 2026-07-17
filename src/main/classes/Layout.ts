import { IS_AXM, ObjectInfo, PacketType } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Server } from "./Server.js";
import { PMOAction, PMOFlags } from "tsinsim";
import { Event, EventType } from "./Event.js";
import { PlayerGetter } from "./Player.js";

const MAX_LAYOUT = 3600;
type CALLBACK = ((status: boolean, layout: ObjectInfo) => void) | null;

const isSameObjectInfo = (a: ObjectInfo | Partial<ObjectInfo>, b: ObjectInfo) => {
    return a.X === b.X && a.Y === b.Y && a.ZByte === b.ZByte && a.Flags === b.Flags && a.Index === b.Index && a.Heading === b.Heading;
}

export class Layout {
    // STATIC START
    static all: ObjectInfo[] = [];
    static waitForAdd: (Partial<ObjectInfo> & { callback: (status: boolean, layout: ObjectInfo) => void })[] = [];
    static waitForRemove: (Partial<ObjectInfo> & { callback: (status: boolean, layout: ObjectInfo) => void })[] = [];

    static add(server: Server, layout: ObjectInfo | ObjectInfo[], callback: CALLBACK = null) {
        if(callback) {
            if(Array.isArray(layout)) {
                for(const layout_ of layout) {
                    this.waitForAdd.push({ ...layout_, callback });
                }
            }
            else {
                this.waitForAdd.push({ ...layout, callback });
            }
        }

        if(Array.isArray(layout)) {
            if(layout.length > 60) {
                for(var i = 0; i < Math.ceil(layout.length / 60); i++) {
                    Packet.send(server, new IS_AXM({ PMOAction: PMOAction.PMO_ADD_OBJECTS, Info: layout.slice(i*60, i*60+60) }));
                }
            }
            else {
                Packet.send(server, new IS_AXM({ PMOAction: PMOAction.PMO_ADD_OBJECTS, Info: layout }));
            }
        }
        else {
            Packet.send(server, new IS_AXM({ PMOAction: PMOAction.PMO_ADD_OBJECTS, Info: [layout] }));
        }
    }

    static remove(server: Server, layout: ObjectInfo | ObjectInfo[], callback: CALLBACK = null) {
        if(callback) {
            if(Array.isArray(layout)) {
                for(const layout_ of layout) {
                    this.waitForRemove.push({ ...layout_, callback });
                }
            }
            else {
                this.waitForRemove.push({ ...layout, callback });
            }
        }

        if(Array.isArray(layout)) {
            if(layout.length > 60) {
                for(var i = 0; i < Math.ceil(layout.length / 60); i++) {
                    Packet.send(server, new IS_AXM({ PMOAction: PMOAction.PMO_DEL_OBJECTS, Info: layout.slice(i*60, i*60+60) }));
                }
            }
            else {
                Packet.send(server, new IS_AXM({ PMOAction: PMOAction.PMO_DEL_OBJECTS, Info: layout }));
            }
        }
        else {
            Packet.send(server, new IS_AXM({ PMOAction: PMOAction.PMO_DEL_OBJECTS, Info: [layout] }));
        }
    }

    static removeAll(server: Server) {
        Packet.send(server, new IS_AXM({ PMOAction: PMOAction.PMO_CLEAR_ALL }));
    }
    // STATIC END

    constructor() { 
        throw new Error('VISM.Layout is a static class. new VISM.Layout cannot be constructed.');
    }
}

Packet.on(PacketType.ISP_AXM, (data, server) => {
    const player = PlayerGetter.getByUCID(server, data.UCID);
    if(!player) return;

    if(data.PMOAction === PMOAction.PMO_ADD_OBJECTS) {
        Event.fire(EventType.PLAYER_LAYOUT_ADD, player, data.Info)
    }

    if(data.PMOAction === PMOAction.PMO_DEL_OBJECTS) {
        Event.fire(EventType.PLAYER_LAYOUT_REMOVE, player, data.Info)
    }
});

Packet.on(PacketType.ISP_AXM, (data, server) => {
    if(data.PMOAction === PMOAction.PMO_TINY_AXM) {
        for(const layout of data.Info) {
            Layout.all.push(layout);
        }
        
        if(data.PMOFlags === PMOFlags.PMO_FILE_END) { 
            console.log(`[Layout] ${Layout.all.length} layouts loaded`);
        }
    }

    if(data.PMOAction === PMOAction.PMO_ADD_OBJECTS) {
        var added = 0;
        for(const layoutToAdd of data.Info) {
            const layoutExists = Layout.all.some((l) => isSameObjectInfo(l, layoutToAdd));
            const couldLayoutBeAdded = !layoutExists && Layout.all.length < MAX_LAYOUT;

            for(const layoutForWait of Layout.waitForAdd) {
                const { callback, ...layoutForWaitWithoutCallback } = layoutForWait;
                if(isSameObjectInfo(layoutForWaitWithoutCallback, layoutToAdd)) {
                    callback(couldLayoutBeAdded, layoutToAdd);
                }
            }

            if(couldLayoutBeAdded) {
                Layout.all.push(layoutToAdd);
                added++;
            }
        }
    }

    if(data.PMOAction === PMOAction.PMO_DEL_OBJECTS) {
        for(const layoutToRemove of data.Info) {
            const layoutExists = Layout.all.some((l) => isSameObjectInfo(l, layoutToRemove));

            for(const layoutForWait of Layout.waitForRemove) {
                const { callback, ...layoutForWaitWithoutCallback } = layoutForWait;
                if(isSameObjectInfo(layoutForWaitWithoutCallback, layoutToRemove)) {
                    callback(layoutExists, layoutToRemove);
                }
            }

            if(layoutExists) {
                const indexOf = Layout.all.indexOf(layoutToRemove);
                if(indexOf !== -1) {
                    Layout.all.splice(indexOf, 1);
                }
            }
        }
    }

    if(data.PMOAction === PMOAction.PMO_CLEAR_ALL) {
        console.log(`[Layout] All layouts cleared`);
        Layout.all = [];
    }
});