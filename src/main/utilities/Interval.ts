export class Interval {
    // STATIC START
    static all: { 
        [key: string]: { 
            id: NodeJS.Timeout, 
            performance: { 
                last: number,
                avg: { 
                    time: number,
                    times: number,
                    avg: number
                },
                max: number,
                min: number
            }
        }
    } = { };

    static set(name: string, callback: () => void, ms: number) {
        console.log(Interval)
        if(Interval.all[name]) return console.log(`[Interval] Interval named ${name} already exists!`);

        const interval = setInterval(() => {
            const startTime = process.hrtime();
            callback();
            const endTime = process.hrtime(startTime);
            const time = parseFloat((endTime[0] + (endTime[1] / 1e9)).toString())*1000;

            if(time > 50) {
                console.warn(`[Interval: ${name}] was too long ${Math.floor(time)} ms`)
            }

            const interval = Interval.all[name];
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
        }, ms);

        this.all[name] = { id: interval, performance: { last: 0, avg: { time: 0, times: 0, avg: 0 }, max: 0, min: 0 } };
    }

    static clear(name: string) {
        if(!Interval.all[name]) return;

        clearInterval(Interval.all[name].id);
        delete Interval.all[name];
    }
    // STATIC END

    constructor() { 
        throw new Error('VISM.Interval is a static class. new VISM.Interval cannot be constructed.');
    }
}
