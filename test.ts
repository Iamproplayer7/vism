import { VISM, InSimFlags, EventType, LeaveReason, IS_NPL } from './src/index.ts';
import { Event, Mod, Vehicle } from './src/main/index.ts';

const server = new VISM.Server({
    Admin: 'test',                      
    Flags: InSimFlags.ALL_MULTIPLAYER,
    Interval: 100, 
    InSimVer: 9, 
    IName: 'VISM',
    Prefix: 33                        
});

server.connect('', 0);

Event.on(EventType.SERVER_CONNECTED, (server) => {
    Mod.add(server, '5587CD');
    console.log(Mod.getAll(server));
    Mod.remove(server, '5587CD');
    console.log(Mod.getAll(server));
});

Event.on(EventType.PLAYER_CONNECTING, (player) => {
    console.log(`${player.getName()} is connecting...`);
});

Event.on(EventType.PLAYER_CONNECTED, (player) => {
    console.log(`${player.getName()} connected. [UserID: ${player.getUserID()}]`);
})

Event.on(EventType.PLAYER_DISCONNECTED, (player, reason) => {
    console.log(`${player.getName()} disconnected. [Reason: ${LeaveReason[reason]}]`);
})

Event.on(EventType.VEHICLE_JOIN_REQUEST, (player, data: IS_NPL) => {
    console.log(`${player.getName()} requests a vehicle (PLID: ${data.PLID}, Name: ${data.CName}).`);
    Vehicle.respondToJoinRequest(player, true);
})

Event.on(EventType.VEHICLE_CREATED, (vehicle, player) => {
    console.log(`${player.getName()} created a new vehicle (PLID: ${vehicle.getPLID()}, Name: ${vehicle.getName()}).`);
})

Event.on(EventType.VEHICLE_DESTROYED, (vehicle, player) => {
    console.log(`${player.getName()} destroyed a vehicle (PLID: ${vehicle.getPLID()}, Name: ${vehicle.getName()}).`);
})

Event.on(EventType.VEHICLE_UPDATE, (vehicle) => {
    console.log('speed', vehicle.getSpeed());
})