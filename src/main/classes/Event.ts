import { ButtonClickFlags, CarContOBJ, IS_NPL, LeaveReason, ObjectIndex, ObjectInfo } from "tsinsim";
import { Button } from "./Button.js";
import { Interface, Player } from "./Player.js";
import { Server } from "./Server.js";
import { Vehicle } from "./Vehicle.js";

export enum EventType {
    SERVER_CONNECTED,
    SERVER_DISCONNECTED,

    PLAYER_CONNECTING,
    PLAYER_CONNECTED,
    PLAYER_DISCONNECTED,
    PLAYER_INTERFACE_UPDATE,
    PLAYER_NAME_UPDATE,

    VEHICLE_CREATED,
    VEHICLE_DESTROYED,
    VEHICLE_JOIN_REQUEST,
    VEHICLE_UPDATE,
    VEHICLE_HIT_OBJECT,
    VEHICLE_PIT_STOP_START,
    VEHICLE_PIT_STOP_END,

    BUTTON_CREATED,
    BUTTON_REMOVED,
    BUTTON_UPDATE,
    BUTTON_CLICK,
    BUTTON_INPUT,
    BUTTON_CLEAR,

    PLAYER_LAYOUT_ADD,
    PLAYER_LAYOUT_REMOVE
}

type EventMap = {
    [EventType.SERVER_CONNECTED]: [ server: Server ];
    [EventType.SERVER_DISCONNECTED]: [ server: Server ];

    [EventType.PLAYER_CONNECTING]: [ player: Player ];

    [EventType.PLAYER_CONNECTED]: [ player: Player ];
    [EventType.PLAYER_DISCONNECTED]: [ player: Player, reason: LeaveReason ];
    [EventType.PLAYER_INTERFACE_UPDATE]: [ player: Player, interface_: Interface ];
    [EventType.PLAYER_NAME_UPDATE]: [ player: Player, { old: string, new: string } ];

    [EventType.VEHICLE_CREATED]: [ vehicle: Vehicle, player: Player ];
    [EventType.VEHICLE_DESTROYED]: [ vehicle: Vehicle, player: Player ];
    [EventType.VEHICLE_JOIN_REQUEST]: [ player: Player, data: IS_NPL ];
    [EventType.VEHICLE_UPDATE]: [ vehicle: Vehicle ];
    [EventType.VEHICLE_HIT_OBJECT]: [ vehicle: Vehicle, index: ObjectIndex, speed: CarContOBJ['Speed'] ];
    [EventType.VEHICLE_PIT_STOP_START]: [ vehicle: Vehicle ];
    [EventType.VEHICLE_PIT_STOP_END]: [ vehicle: Vehicle ];

    [EventType.BUTTON_CREATED]: [ button: Button ];
    [EventType.BUTTON_REMOVED]: [ button: Button ];
    [EventType.BUTTON_UPDATE]: [ button: Button ];
    [EventType.BUTTON_CLICK]: [ button: Button, player: Player, flags: 0 | ButtonClickFlags ];
    [EventType.BUTTON_INPUT]: [ button: Button, player: Player, text: string ];
    [EventType.BUTTON_CLEAR]: [ player: Player ];

    [EventType.PLAYER_LAYOUT_ADD]: [ player: Player, data: ObjectInfo[] ];
    [EventType.PLAYER_LAYOUT_REMOVE]: [ player: Player, data: ObjectInfo[] ];
};


type EventArgs<T> =
    T extends keyof EventMap
        ? EventMap[T]
        : unknown[];

type Name = string | number | number[] | string[];
type CallbackFn<T = any> = (...args: EventArgs<T>) => void;
type EventEntry<T = any> = {
    name: EventType | Name;
    callback: CallbackFn<T>;
};

export const Event = {
    all: [] as EventEntry[],

    on<T extends EventType | Name>(name: T, callback: CallbackFn<T>) {
        if (Array.isArray(name)) {
            for (const n of name) {
                this.all.push({ name: n, callback });
            }
        } else {
            this.all.push({ name, callback });
        }
    },

    fire<T extends EventType | Name>(name: T, ...args: EventArgs<T> & any[]) {
        this.all.filter((entry) => entry.name === name).forEach((entry) => {
            entry.callback(...args);
        });
    }
};
