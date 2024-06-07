import { VISM, PacketType, IS_NCN, IS_MTC, InSimFlags, IS_NCI, EventType, LeaveReason } from './src/index.ts';
import { Event, Packet, Server } from './src/main/index.ts';

const server = new VISM.Server({
    Admin: 'test',                      
    Flags: InSimFlags.ALL_MULTIPLAYER,
    Interval: 100, 
    InSimVer: 9, 
    IName: 'VISM',
    Prefix: 33                        
});

server.connect('127.0.0.1', 29999);


Event.on(EventType.PLAYER_CONNECTING, (player) => {
    console.log(`${player.Name} is connecting...`);
});

Event.on(EventType.PLAYER_CONNECTED, (player) => {
    console.log(`${player.Name} + ' connected. [UserID: ${player.UserID}]`);
})

Event.on(EventType.PLAYER_DISCONNECTED, (player, reason) => {
    console.log(`${player.Name} + ' disconnected. [Reason: ${LeaveReason[reason]}]`);
})