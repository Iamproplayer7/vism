import { IS_ACR, IS_AIC, IS_AII, IS_AXI, IS_AXM, IS_AXO, IS_BFN, IS_BTC, IS_BTN, IS_BTT, IS_CCH, IS_CIM, IS_CNL, IS_CON, IS_CPP, IS_CPR, IS_CRS, IS_CSC, IS_FIN, IS_FLG, IS_HCP, IS_HLV, IS_III, IS_IPB, IS_ISM, IS_JRR, IS_LAP, IS_MAL, IS_MCI, IS_MOD, IS_MSL, IS_MSO, IS_MST, IS_MSX, IS_MTC, IS_NCI, IS_NCN, IS_NLP, IS_NPL, IS_OBH, IS_OCO, IS_PEN, IS_PFL, IS_PIT, IS_PLA, IS_PLC, IS_PLH, IS_PLL, IS_PLP, IS_PSF, IS_REO, IS_RES, IS_RIP, IS_RST, IS_SCC, IS_SCH, IS_SFP, IS_SLC, IS_SMALL, IS_SPX, IS_SSH, IS_STA, IS_TINY, IS_TOC, IS_TTC, IS_UCO, IS_VER, IS_VTN, PacketType, Sendable } from "tsinsim/packets";
import { Server } from "./Server.js";
import { Player } from "./Player.js";
import { Vehicle } from "./Vehicle.js";

type PacketMap = {
    [PacketType.ISP_NONE]: {};
    [PacketType.ISP_ISI]: IS_NCI;
    [PacketType.ISP_VER]: IS_VER;
    [PacketType.ISP_TINY]: IS_TINY;
    [PacketType.ISP_SMALL]: IS_SMALL;
    [PacketType.ISP_STA]: IS_STA;
    [PacketType.ISP_SCH]: IS_SCH;
    [PacketType.ISP_SFP]: IS_SFP;
    [PacketType.ISP_SCC]: IS_SCC;
    [PacketType.ISP_CPP]: IS_CPP;
    [PacketType.ISP_ISM]: IS_ISM;
    [PacketType.ISP_MSO]: IS_MSO;
    [PacketType.ISP_III]: IS_III;
    [PacketType.ISP_MST]: IS_MST;
    [PacketType.ISP_MTC]: IS_MTC;
    [PacketType.ISP_MOD]: IS_MOD;
    [PacketType.ISP_VTN]: IS_VTN;
    [PacketType.ISP_RST]: IS_RST;
    [PacketType.ISP_NCN]: IS_NCN;
    [PacketType.ISP_CNL]: IS_CNL;
    [PacketType.ISP_CPR]: IS_CPR;
    [PacketType.ISP_NPL]: IS_NPL;
    [PacketType.ISP_PLP]: IS_PLP;
    [PacketType.ISP_PLL]: IS_PLL;
    [PacketType.ISP_LAP]: IS_LAP;
    [PacketType.ISP_SPX]: IS_SPX;
    [PacketType.ISP_PIT]: IS_PIT;
    [PacketType.ISP_PSF]: IS_PSF;
    [PacketType.ISP_PLA]: IS_PLA;
    [PacketType.ISP_CCH]: IS_CCH;
    [PacketType.ISP_PEN]: IS_PEN;
    [PacketType.ISP_TOC]: IS_TOC;
    [PacketType.ISP_FLG]: IS_FLG;
    [PacketType.ISP_PFL]: IS_PFL;
    [PacketType.ISP_FIN]: IS_FIN;
    [PacketType.ISP_RES]: IS_RES;
    [PacketType.ISP_REO]: IS_REO;
    [PacketType.ISP_NLP]: IS_NLP;
    [PacketType.ISP_MCI]: IS_MCI;
    [PacketType.ISP_MSX]: IS_MSX;
    [PacketType.ISP_MSL]: IS_MSL;
    [PacketType.ISP_CRS]: IS_CRS;
    [PacketType.ISP_BFN]: IS_BFN;
    [PacketType.ISP_AXI]: IS_AXI;
    [PacketType.ISP_AXO]: IS_AXO;
    [PacketType.ISP_BTN]: IS_BTN;
    [PacketType.ISP_BTC]: IS_BTC;
    [PacketType.ISP_BTT]: IS_BTT;
    [PacketType.ISP_RIP]: IS_RIP;
    [PacketType.ISP_SSH]: IS_SSH;
    [PacketType.ISP_CON]: IS_CON;
    [PacketType.ISP_OBH]: IS_OBH;
    [PacketType.ISP_HLV]: IS_HLV;
    [PacketType.ISP_PLC]: IS_PLC;
    [PacketType.ISP_AXM]: IS_AXM;
    [PacketType.ISP_ACR]: IS_ACR;
    [PacketType.ISP_HCP]: IS_HCP;
    [PacketType.ISP_NCI]: IS_NCI;
    [PacketType.ISP_JRR]: IS_JRR;
    [PacketType.ISP_UCO]: IS_UCO;
    [PacketType.ISP_OCO]: IS_OCO;
    [PacketType.ISP_TTC]: IS_TTC;
    [PacketType.ISP_SLC]: IS_SLC;
    [PacketType.ISP_CSC]: IS_CSC;
    [PacketType.ISP_CIM]: IS_CIM;
    [PacketType.ISP_MAL]: IS_MAL;
    [PacketType.ISP_PLH]: IS_PLH;
    [PacketType.ISP_IPB]: IS_IPB;
    [PacketType.ISP_AIC]: IS_AIC;
    [PacketType.ISP_AII]: IS_AII;
};

type WithServer<T> = [ data: T, server: Server ];

type CallbackFnR<T extends keyof PacketMap> = (...args: WithServer<PacketMap[T]>) => void;
type Packet<T extends keyof PacketMap> = { id: number, name: T, callback: CallbackFnR<T>, bind?: Entity };
type Entity = Player | Server | Vehicle | null;    

export const Packet = {
    all: [] as Packet<keyof PacketMap>[],
    number: 0,

    on<T extends keyof PacketMap>(name: T, callback: CallbackFnR<T>) {
        /*if(Array.isArray(name)) {
            for(const n of name) {
                const packetId = Packet.number++;
                this.all.push({ id: packetId, name: n, callback: callback as any, bind: null })
                idsOfHandlers.push(packetId);
            }
        }*/
        
        const packetId = Packet.number++;

        const cb = callback as CallbackFnR<T>;
        this.all.push({ id: packetId, name: name, callback: cb as CallbackFnR<keyof PacketMap>, bind: null })

        return {
            id: packetId,
            bind(entity: Entity) {
                const packet = Packet.all.find((p) => p.id === packetId);
                if(packet) {
                    packet.bind = entity;
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

    offByBind(entity: Entity) {
        for(const packet of this.all.filter((packet) => packet.bind === entity)) {
            this.offById(packet.id);
        }
    },

    send(server: Server, packet: Sendable) {
        server.InSimHandle.sendPacket(packet);
    }
}