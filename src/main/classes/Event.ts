type Name = string | number | number[] | string[];
type CallbackFn = (...args: any[]) => void;

export const Event = {
    all: [] as { name: Name, callback: CallbackFn }[],

    on(name: Name, callback: CallbackFn): void {
        if(Array.isArray(name)) {
            for(const n of name) {
                this.all.push({ name: n, callback });
            }
        }
        else {
            this.all.push({ name, callback });
        }
    },

    fire(name: Name, ...args: any[]): void {
        this.all.filter((event) => event.name === name).forEach((event) => {
            event.callback(...args);
        });
    }
};