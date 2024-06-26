import { JRRAction, PacketType } from "tsinsim";
import { IS_JRR, IS_MCI, IS_NPL, IS_PLL, IS_PLP } from "tsinsim/packets";
import { Packet } from "./Packet.js";
import { Event } from "./Event.js";
import { EventType } from "../enums/event.js";
import { Player } from "./Player.js";
import { Server } from "./Server.js";


export class Vehicle {
    // STATIC START
    static all: Vehicle[] = [];
    static getByPLID(PLID: number) {
        return Vehicle.all.find((v) => v.PLID === PLID) ?? false;
    }

    static getByServer(server: Server) {
        return Vehicle.all.filter((v) => v.Server === server);
    }

    static respondToJoinRequest(player: Player, Status: boolean) {
        const packet = new IS_JRR;
        packet.UCID = player.getUCID();
        packet.JRRAction = Status ? JRRAction.JRR_SPAWN : JRRAction.JRR_REJECT;
        Packet.send(player.Server, packet);
    }
    // STATIC END

    // DEFAULT VALUES
    valid: boolean = false;
    readonly Server: Server | null;
    readonly Player: Player;
    readonly PLID: number;
    readonly CName: string;
    readonly SName: string;
    readonly HMass: number;
    readonly HTres: number;
    readonly Fuel: number;
    Plate: string;

    Speed: number = 0;
    Pos: { X: number, Y: number, Z: number } = { X: 0, Y: 0, Z: 0 };
    Heading: number = 0;
    Direction: number = 0;

    constructor(data: IS_NPL, player: Player) {
        // base
        this.valid = true;
        this.Server = player.Server;
        this.Player = player;
        this.PLID = data.PLID;
        this.CName = data.CName;
        this.SName = data.SName;
        this.HMass = data.H_Mass;
        this.HTres = data.H_TRes;
        this.Fuel = data.Fuel;
        this.Plate = data.Plate;
    }

    // getters
    public getPLID() {
        return this.PLID;
    }

    public getName() {
        return this.CName;
    }

    public getSkinName() {
        return this.SName;
    }

    public getMass() {
        return this.HMass;
    }

    public getRes() {
        return this.HTres;
    }

    public getFuel() {
        return this.Fuel;
    }

    public getSpeed() {
        return this.Speed;
    }

    public getPosition() {
        return this.Pos;
    }

    public getHeading() {
        return this.Heading;
    }

    public getDirection() {
        return this.Direction;
    }
}

Packet.on(PacketType.ISP_NPL, (data: IS_NPL) => {
    const player = Player.getByUCID(data.UCID);
    if(!player) return;

    if(data.NumP == 0) {
        Event.fire(EventType.VEHICLE_JOIN_REQUEST, player, data);
        return;
    } 

    Vehicle.all.push(new Vehicle(data, player));
    Event.fire(EventType.VEHICLE_CREATED, Vehicle.getByPLID(data.PLID), player);
});

Packet.on([PacketType.ISP_PLL, PacketType.ISP_PLP], (data: IS_PLL | IS_PLP) => {
    const vehicle = Vehicle.getByPLID(data.PLID);
    if(!vehicle) return;

    const player = vehicle.Player;
    const indexOf = Vehicle.all.indexOf(vehicle);
    if(indexOf !== -1) {
        vehicle.valid = false;
        Vehicle.all.splice(indexOf, 1);
        Event.fire(EventType.VEHICLE_DESTROYED, vehicle, player);
    }
});

Packet.on(PacketType.ISP_MCI, (data: IS_MCI) => {
    for(const CompCar of data.Info) {
        const vehicle = Vehicle.getByPLID(CompCar.PLID);
        if(vehicle) {
            vehicle.Speed = CompCar.Speed / 32768 * 360;
            vehicle.Pos = {
                X: CompCar.X / 65536,
                Y: CompCar.Y / 65536,
                Z: CompCar.Z / 65536,
            };
            vehicle.Heading = CompCar.Heading / 32768 * 180;
            vehicle.Direction = CompCar.Direction / 182.0444444;

            Event.fire(EventType.VEHICLE_UPDATE, vehicle);
        }
    }
});