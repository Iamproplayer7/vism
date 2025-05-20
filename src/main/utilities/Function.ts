import { Vector2 } from "tsinsim";

const Function = { 
    wait: (ms: number) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                return resolve(true);
            }, ms);
        })
    },
    round: (int: number, places: number = 0) => { 
        return Math.round(int * Math.pow(10, places)) / Math.pow(10, places);
    },
    random: (min: number, max: number) => {
        min = min*10;
        max = max*10;

        return Math.floor(Math.floor(Math.random() * (max - min) + min) / 10);
    },
    date: (format: string, time: number | false = false) => {
        const DATE = time ? new Date(time * 1000) : new Date();

        const list = {
            Y: DATE.getFullYear(),
            m: DATE.getMonth() + 1,
            d: DATE.getDate(),
            H: DATE.getHours(),
            i: DATE.getMinutes(),
            s: DATE.getSeconds()
        };

        // add 0 for numbers at start
        Object.keys(list).forEach((key) => {
            const keyy = key as keyof typeof list;
            format = format.replace(keyy, (list[keyy].toString().length < 2 ? '0' : '') + list[keyy].toString());
        })

        return format;
    },
    time: () => {
        const time = new Date().getTime();
        return Function.round(time / 1000, 0);
    },
    distance2d: (vector1: { X: number, Y: number }, vector2: { X: number, Y: number }) => {
        const r = Math.sqrt(
            Math.pow(vector1.X - vector2.X, 2) +
                Math.pow(vector1.Y - vector2.Y, 2)
        ) / 1000;
    
        return (r < 0 ? 0 : r);
    },
    distance3d: (vector1: { X: number, Y: number, Z: number }, vector2: { X: number, Y: number, Z: number }) => {
        const r = Math.sqrt(
            Math.pow(vector1.X - vector2.X, 2) +
                Math.pow(vector1.Y - vector2.Y, 2) + 
                    Math.pow(vector1.Z - vector2.Z, 2)
        ) / 1000;
    
        return (r < 0 ? 0 : r);
    },
    money: (int: number) => {
        return Function.round(Math.floor(int), 0).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    },
    int: (int: number | string) => {
        if(typeof int === 'string') {
            int = parseInt(int);
        }

        if(isNaN(int)) {
            int = 0;
        }
        
        var isMinus = int < 0;
        var d = int.toString().match(/\d+/)?.toString();
        int = d ? parseInt(d) : 0;

        return (isMinus ? -int : int);
    },
    getWeek: () => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    },
    removeColors: (text: string) => {
        for(let i = 0; i <= 9; i++) {
            text = text.replaceAll('^' + i, '');
        }
    
        return text;
    },

    Atan2Positive(v1: Vector2, v2: Vector2) {
        var xx = v2.subX(v1.x).x;
        var yy = v2.subY(v1.y).y;
    
        const theta = Math.atan2(xx, yy) * 180 / Math.PI;
        return theta < 0 ? 360 + theta : theta;
    },
    
    getHeadingByCoord(v1: Vector2, v2: Vector2, heading: number) {
        const atan = this.Atan2Positive(v1, v2);
        
        var heading = atan+heading;
        if(heading >= 360) { 
            heading -= 360;
        }
    
        return heading;
    },
    
    getScreenCoordFromWorldCoord(v1: Vector2, v2: Vector2, heading: number) {
        var headingInDegrees = this.getHeadingByCoord(v1, v2, heading);
    
        headingInDegrees -= 180;    
        headingInDegrees /= 180;
    
        if(headingInDegrees > 0) {
           headingInDegrees = 1-headingInDegrees;
        }
        else if(headingInDegrees < 0) {
            headingInDegrees = -1-headingInDegrees;
        }
    
        // left
        var top = 0;
        var left = 0;
        if(-headingInDegrees < 0) {
            if(-headingInDegrees < -0.5) {
                top =  Math.abs(200*-headingInDegrees);
                left = 0+Math.abs(100*-headingInDegrees);
            }
            else {
                top =  Math.abs(200*-headingInDegrees);
                left = 100-Math.abs(100*-headingInDegrees);
            }
        }
        else { // right
            if(-headingInDegrees > 0.5) {
                top =  Math.abs(200*-headingInDegrees);
                left = 200-Math.abs(100*-headingInDegrees);
            }
            else {
                top =  Math.abs(200*-headingInDegrees);
                left = 100+Math.abs(100*-headingInDegrees);
            }
           
        }
        
        return { top: top < 0 ? 0 : top > 200 ? 200 : top, left: left < 0 ? 0 : left > 200 ? 200 : left };
    }
}

export default Function;