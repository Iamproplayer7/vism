import { performance } from 'perf_hooks';

export type Interval = { 
    name: string;
    id: NodeJS.Timeout;
    performance: { 
        ms: number;
        last: number;
        avg: { 
            time: number;
            times: number;
            avg: number;
        },
        max: number;
        min: number;
    },
    bind: any
}

export const Interval = {
    all: [] as Interval[],

    set(name: string, callback: () => void, ms: number, fireWhenCreated: boolean = true) {
        if(this.all.find((interval) => interval.name === name)) {
            console.log(`[Interval] Interval named ${name} already exists!`);
        }
    
        const IntervalCallback = () => {
            const startTime = performance.now();
            callback();
            const endTime = performance.now();
            const time = endTime-startTime

            if(time > 50) {
                console.warn(`[Interval: ${name}] was too long ${Math.floor(time)} ms`)
            }

            const interval = this.all.find((int) => int.name === name);
            if(interval) {
                interval.performance.last = time;

                // avg
                interval.performance.avg.time += time;
                interval.performance.avg.times++;
                interval.performance.avg.avg = interval.performance.avg.time/interval.performance.avg.times;

                // max
                if(time > interval.performance.max) {
                    interval.performance.max = time;
                }

                // min
                if(time < interval.performance.min || interval.performance.min === 0) {
                    interval.performance.min = time;
                }
            }
        }

        const NodeInterval = setInterval(IntervalCallback, ms);
        if(fireWhenCreated) {
            IntervalCallback();
        }
        
        this.all.push({ name: name, id: NodeInterval, performance: { ms: ms, last: 0, avg: { time: 0, times: 0, avg: 0 }, max: 0, min: 0 }, bind: null });
    
        const self = this;
        return {
            bind(entity: any) {
                self.all.forEach((v, i) => {
                    if(v.name === name) {
                        v.bind = entity;
                    }
                })
            }
        }
    },

    clear(name: string) {
        const interval = this.all.find((int) => int.name === name);
        if(!interval) return;

        clearInterval(interval.id);
        this.all = this.all.filter((int) => int !== interval);
    },

    clearByBind(entity: any) {
        this.all.filter((interval) => interval.bind === entity).forEach((interval) => {
            this.clear(interval.name);
        });
    }
}