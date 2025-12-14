import { JRRAction, PacketType, PlayerHCapFlags, Vector3 } from "tsinsim";
import { IS_AII, IS_JRR, IS_MCI, IS_MST, IS_NPL, IS_OBH, IS_PIT, IS_PLH, IS_PLL, IS_PLP, IS_PSF, ObjectInfo, OSMain, PlayerHCap } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Event } from "./Event.js";
import { EventType } from "../enums/event.js";
import { Player, PlayerGetter } from "./Player.js";
import { Server } from "./Server.js";

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
    isAI: boolean;

    getServer(): Server; 
    getPlayer(): Player,
    getPLID(): number; 
    getPName(): string;
    getName(): string;
    getSName(): string;
    getMass(): number;
    getRes(): number;
    getFuel(): number;
    getPlate(): string;
    getSpeed(): number;
    getPosition(): Vector3;
    setPosition(position: Vector3, repair: boolean, heading: number): void;
    setMass(mass: number): void;
    getHeading(): number;
    getDirection(): number;
    getAIData(): { 
        received: boolean;
        OSData: OSMain;
        Heading: number;
        Direction: number;
        Engine: boolean;
        Gear: number;
        RPM: number;
        Speed: number;
    }

    removeFromTrack(): void;
}


class VehicleInternal implements Vehicle  {
    valid: boolean;
    isMod: boolean;
    isAI: boolean;

    private Server: Server;
    private Player: Player;
    private PLID: number;
    private PName: string;
    private CName: string;
    private SName: string;
    private HMass: number;
    private HTres: number;
    private Fuel: number;
    private Plate: string;
    private Speed: number;
    private Pos: Vector3;
    private Heading: number;
    private Direction: number;
    private AIData: {
        received: boolean,
        OSData: OSMain,
        Heading: number,
        Direction: number,
        Engine: boolean,
        Gear: number,
        RPM: number,
        Speed: number
    }

    constructor(data: IS_NPL, player: Player) {
        this.valid = true;
        this.isMod = !CARS.includes(data.CName);
        this.isAI = (data.PType & 2) !== 0;

        this.Server = player.getServer();
        this.Player = player;
        this.PLID = data.PLID;
        this.PName = data.PName;
        this.CName = data.CName;
        this.SName = data.SName;
        this.HMass = data.H_Mass;
        this.HTres = data.H_TRes;
        this.Fuel = data.Fuel;
        this.Plate = data.Plate;

        this.Speed = 0;
        this.Pos = new Vector3;
        this.Heading = 0;
        this.Direction = 0;

        this.AIData = {
            received: false,
            OSData: new OSMain,
            Heading: 0,
            Direction: 0,
            Engine: false,
            Gear: 0,
            RPM: 0,
            Speed: 0
        };
        
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
                this.Pos = new Vector3(CompCar.X, CompCar.Y, CompCar.Z).div(65536);

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

        // AI info packet
        Packet.on(PacketType.ISP_AII, (data: IS_AII, server: Server) => {
            if(server !== this.Server) return;
            if(data.PLID !== this.PLID) return;

            // position
            data.OSData.Pos = new Vector3(data.OSData.Pos).div(65536);

            // direction
            //var direction_deg = Math.atan2(-data.OSData.Vel.X, data.OSData.Vel.Y) * 180 / Math.PI;
            //direction_deg = direction_deg > 0 ? direction_deg : 360+direction_deg;

            // heading
            var heading = data.OSData.Heading * 180 / Math.PI;
            heading = heading > 0 ? heading : 360+heading;

            const horg = data.OSData.Heading;
            data.OSData.Heading = heading;


            this.AIData = {
                received: true,
                OSData: data.OSData,
                Heading: horg,
                Direction: Math.atan2(-data.OSData.Vel.x, data.OSData.Vel.y),
                Engine: (data.Flags & 1) !== 0,
                Gear: data.Gear-1,
                RPM: data.RPM,
                Speed: data.OSData.Vel.length()*3.6
            }
        }).bind(this);
    }

    getServer()    { return this.Server;    };
    getPlayer()    { return this.Player;    };
    getPLID()      { return this.PLID;      };
    getPName()     { return this.PName;     };
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

    getAIData() { return this.AIData; };

    setPosition(position: Vector3, repair: boolean = false, heading: number = 0) {
        // degrees reverse & 0-256
        heading += 180; // reverse
        heading = heading % 360;
        heading = Math.floor(heading * 256 / 360); // 0-256 range
  
        const packet = new IS_JRR({ 
            PLID: this.getPLID(), 
            JRRAction: repair ? 4 : 5, 
            StartPos: new ObjectInfo({ 
                X: Math.floor(position.x*16), 
                Y: Math.floor(position.y*16), 
                ZByte: Math.floor(position.z*4), 
                Heading: heading, 
                Flags: 128 
            }) 
        });
        
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
            Msg: '/spec ' + (this.isAI ? this.PName : this.getPlayer().getUsername()),
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
    if(vehicle.isAI) {
        player.addAIVehicle(vehicle);
    }
    else {
        player.setVehicle(vehicle);
    }
    
    VehicleGetter.all.push(vehicle);
    Event.fire(EventType.VEHICLE_CREATED, vehicle, player);
});