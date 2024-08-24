import { JRRAction, PacketType } from "tsinsim";
import { IS_JRR, IS_MCI, IS_NPL, IS_PLL, IS_PLP, ObjectInfo } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Event } from "./Event.js";
import { EventType } from "../enums/event.js";
import { Player, PlayerGetter } from "./Player.js";
import { Server } from "./Server.js";

export const VehicleGetter = {
    all: [] as Vehicle[],

    getByPLID(server: Server, PLID: number) {
        return this.all.find((vehicle) => vehicle.getServer() === server && vehicle.getPLID() === PLID);
    },

    respondToJoinRequest(player: Player, Status: boolean, StartPos: ObjectInfo = new ObjectInfo) {
        const packet = new IS_JRR;
        packet.UCID = player.getUCID();
        packet.JRRAction = Status ? JRRAction.JRR_SPAWN : JRRAction.JRR_REJECT;
        packet.StartPos = StartPos;

        Packet.send(player.getServer(), packet);
    }
}

export interface Vehicle {
    valid: boolean; 
    getServer(): Server; 
    getPlayer(): Player,
    getPLID(): number; 
    getName(): string;
    getSName(): string;
    getMass(): number;
    getRes(): number;
    getFuel(): number;
    getPlate(): string;
    getSpeed(): number;
    getPosition(): { X: number, Y: number, Z: number };
    getHeading(): number;
    getDirection(): number;
}


class VehicleInternal implements Vehicle  {
    valid: boolean;

    private Server: Server;
    private Player: Player;
    private PLID: number;
    private CName: string;
    private SName: string;
    private HMass: number;
    private HTres: number;
    private Fuel: number;
    private Plate: string;
    private Speed: number;
    private Pos: { X: number, Y: number, Z: number };
    private Heading: number;
    private Direction: number;

    constructor(data: IS_NPL, player: Player) {
        this.valid = true;
        
        this.Server = player.getServer();
        this.Player = player;
        this.PLID = data.PLID;
        this.CName = data.CName;
        this.SName = data.SName;
        this.HMass = data.H_Mass;
        this.HTres = data.H_TRes;
        this.Fuel = data.Fuel;
        this.Plate = data.Plate;

        this.Speed = 0;
        this.Pos = { X: 0, Y: 0, Z: 0 };
        this.Heading = 0;
        this.Direction = 0;
        
        // player leaves track
        Packet.on([PacketType.ISP_PLL, PacketType.ISP_PLP], (data: IS_PLL | IS_PLP, server: Server) => {
            if(server !== this.Server || data.PLID !== this.PLID) return;
        
            Event.fire(EventType.VEHICLE_DESTROYED, this);
            this.valid = false;

            Packet.offByBind(this);
            VehicleGetter.all = VehicleGetter.all.filter((vehicle) => vehicle !== this);
        }).bind(this);

        // vehicle info update
        Packet.on(PacketType.ISP_MCI, (data: IS_MCI, server: Server) => {
            if(server !== this.Server) return;

            for(const CompCar of data.Info) {
                if(CompCar.PLID !== this.PLID) return;

                this.Speed = CompCar.Speed / 32768 * 360;
                this.Pos = {
                    X: CompCar.X / 65536,
                    Y: CompCar.Y / 65536,
                    Z: CompCar.Z / 65536,
                };
                this.Heading = CompCar.Heading / 32768 * 180;
                this.Direction = CompCar.Direction / 182.0444444;

                Event.fire(EventType.VEHICLE_UPDATE, this);
            }
        }).bind(this);
    }

    getServer()    { return this.Server;    };
    getPlayer()    { return this.Player;    };
    getPLID()      { return this.PLID;      };
    getName()      { return this.CName;     };
    getSName()     { return this.SName;     };
    getMass()      { return this.HMass;     };
    getRes()       { return this.HTres;     };
    getFuel()      { return this.Fuel;      };
    getPlate()     { return this.Plate;     };
    getSpeed()     { return this.Speed;     };
    getPosition()  { return this.Pos;       }
    getHeading()   { return this.Heading;   };
    getDirection() { return this.Direction; };
}

// creating the vehicle
Packet.on(PacketType.ISP_NPL, (data: IS_NPL, server: Server) => {
    const player = PlayerGetter.getByUCID(server, data.UCID); 
    if(!player) return;

    if(data.NumP == 0) {
        return Event.fire(EventType.VEHICLE_JOIN_REQUEST, player, data);
    } 
    
    const vehicle = new VehicleInternal(data, player);
    VehicleGetter.all.push(vehicle);
    Event.fire(EventType.VEHICLE_CREATED, vehicle, player);
});