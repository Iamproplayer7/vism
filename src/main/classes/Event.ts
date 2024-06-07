import { Server } from "./Server.js";

type Name = string | number | number[] | string[];

// STATIC CLASS
export class Event {
    constructor(public x: number, public y: number) { 
        throw new Error('VISM.Event is a static class. new VISM.Event cannot be constructed.');
    }

    // STATIC START
    static all: { name: Name, callback: (...args: any[]) => void }[] = [];
    static on(name: Name, callback: (...args: any[]) => void) {
        if(typeof name == 'object') {
            for(const n of name) {
                this.all.push({ name: n, callback });
            }
        }
        else {
            this.all.push({ name, callback });
        }
    }

    static fire(name: Name, ...args: any[]){
        const events = this.all.filter((event) => event.name === name);
        for(const event of events) {
            event.callback(...args);
        }
    }
    // STATIC END
}