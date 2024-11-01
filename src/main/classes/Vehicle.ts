import { JRRAction, PacketType, PlayerHCapFlags } from "tsinsim";
import { IS_JRR, IS_MCI, IS_MST, IS_NPL, IS_OBH, IS_PIT, IS_PLH, IS_PLL, IS_PLP, IS_PSF, ObjectInfo, PlayerHCap } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Event } from "./Event.js";
import { EventType } from "../enums/event.js";
import { Player, PlayerGetter } from "./Player.js";
import { Server } from "./Server.js";
import Function from "../utilities/Function.js";

const CARS = ['UF1', 'XFG', 'XRG', 'LX4', 'LX6', 'RB4', 'FXO', 'XRT', 'RAC', 'FZ5', 'UFR', 'XFR', 'FXR', 'XRR', 'FZR', 'MRT', 'FBM', 'FOX', 'FO8', 'BF1'];

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
    isMod: boolean;

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
    setPosition(position: { X: number, Y: number, Z: number }, repair: boolean, heading: number): void;
    setMass(mass: number): void;
    getHeading(): number;
    getDirection(): number;
    removeFromTrack(): void;
}


class VehicleInternal implements Vehicle  {
    valid: boolean;
    isMod: boolean;

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
        this.isMod = !CARS.includes(data.CName);
    
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
        
            Event.fire(EventType.VEHICLE_DESTROYED, this, this.Player);
            this.valid = false;
            this.Player.setVehicle(false);

            Packet.offByBind(this);
            VehicleGetter.all = VehicleGetter.all.filter((vehicle) => vehicle !== this);
        }).bind(this);

        // vehicle info update
        Packet.on(PacketType.ISP_MCI, (data: IS_MCI, server: Server) => {
            if(server !== this.Server) return;

            for(const CompCar of data.Info) {
                if(CompCar.PLID !== this.PLID) continue;

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

        // vehicle mass update
        Packet.on(PacketType.ISP_PLH, (data: IS_PLH, server: Server) => {
            if(server !== this.Server) return;

            for(const PlayerHCAP of data.HCaps) {
                if(PlayerHCAP.PLID !== this.PLID) continue;
                this.HMass = PlayerHCAP.H_Mass;
            }
        }).bind(this);

        // vehicle mass update
        Packet.on(PacketType.ISP_OBH, (data: IS_OBH, server: Server) => {
            if(server !== this.Server) return;
            if(data.PLID !== this.PLID) return;

            Event.fire(EventType.VEHICLE_HIT_OBJECT, this, data.Index, data.C.Speed);
        }).bind(this);

        // vehicle pit stop start
        Packet.on(PacketType.ISP_PIT, (data: IS_PIT, server: Server) => {
            if(server !== this.Server) return;
            if(data.PLID !== this.PLID) return;

            Event.fire(EventType.VEHICLE_PIT_STOP_START, this);
        }).bind(this);

        // vehicle pit stop end
        Packet.on(PacketType.ISP_PSF, (data: IS_PSF, server: Server) => {
            if(server !== this.Server) return;
            if(data.PLID !== this.PLID) return;

            Event.fire(EventType.VEHICLE_PIT_STOP_END, this);
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

    setPosition(position: { X: number, Y: number, Z: number }, repair: boolean = false, heading: number = 0) {
        // degrees to 256 & reverse
        heading = heading * 256 / 360;
        heading = Math.floor(heading > 128 ? heading-128 : heading+128);
  
        const packet = new IS_JRR({ PLID: this.getPLID(), JRRAction: repair ? 4 : 5, StartPos: new ObjectInfo({ X: Math.floor(position.X*16), Y: Math.floor(position.Y*16), ZByte: Math.floor(position.Z*4), Heading: heading, Flags: 128 }) })
        this.getServer().InSimHandle.sendPacket(packet);
    }

    setMass(mass: number) {
        this.getServer().InSimHandle.sendPacket(new IS_PLH({
            HCaps: [ new PlayerHCap( {
                PLID: this.PLID,
                Flags: PlayerHCapFlags.MASS,
                H_Mass: mass
            }) ]
        }));
    }

    removeFromTrack() {
        this.getServer().InSimHandle.sendPacket(new IS_MST( {
            Msg: '/spec ' + this.getPlayer().getUsername(),
        }));
    }
}

// creating the vehicle
Packet.on(PacketType.ISP_NPL, (data: IS_NPL, server: Server) => {
    const player = PlayerGetter.getByUCID(server, data.UCID); 
    if(!player) return;

    if(data.NumP == 0) {
        return Event.fire(EventType.VEHICLE_JOIN_REQUEST, player, data);
    } 
    
    const vehicle = new VehicleInternal(data, player);
    player.setVehicle(vehicle);
    VehicleGetter.all.push(vehicle);
    Event.fire(EventType.VEHICLE_CREATED, vehicle, player);
});