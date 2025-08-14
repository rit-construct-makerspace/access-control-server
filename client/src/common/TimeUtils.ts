interface Day {
    dayID: number;
    name: string;
    open: string | undefined;
    close: string | undefined;
}

export function dayToString(day: number) {
    day = Number(day);
    switch (day) {
        case 0:
            return "Sunday";
        case 1:
            return "Monday";
        case 2:
            return "Tuesday";
        case 3:
            return "Wednesday";
        case 4:
            return "Thursday";
        case 5:
            return "Friday";
        case 6:
            return "Saturday";
        default:
            return "undefined";
    }
}

export function makeDayArray(rawHours: [{ type: string, dayOfTheWeek: number, time: string }]) {
    const week = new Array<Day>(7);
    for (let i = 0; i < 7; i++) {
        week[i] = {
            dayID: i,
            name: dayToString(i),
            open: undefined,
            close: undefined
        }
    }
    rawHours.forEach((hour) => {
        if (hour.type === "OPEN") {
            week[Number(hour.dayOfTheWeek) - 1].open = hour.time;
        } else if (hour.type === "CLOSE") {
            week[Number(hour.dayOfTheWeek) - 1].close = hour.time;
        }
    })

    return week;
}

export function reformatTime(time: string) {
    const split = time.split(":");
    let hours = Number(split[0]);

    let suffix = " AM";
    //Hours in PM
    if (hours > 11) {
        suffix = " PM";
        hours = hours === 12 ? 12 : hours - 12
    }

    return "" + hours + ":" + split[1] + suffix;
}

function addHours(date: Date, hours: number) {
    const msToAdd = hours * 60 * 60 * 1000;
    const tempDate = new Date(date);
    tempDate.setTime(tempDate.getTime() + msToAdd);
    return tempDate;
}

export function currentStatus(opening: string, closing: string) {
    if (closing === "" || opening === "") {
        return "CLOSED";
    }
    const date = new Date();

    const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        timeZone: "America/New_York",
        hour12: false
    })

    const curTimeDate = new Date(Date.parse('01/01/2011 ' + formatter.format(date)));
    const closingDate = new Date(Date.parse('01/01/2011 ' + closing));
    const openingDate = new Date(Date.parse('01/01/2011 ' + opening));

    if (curTimeDate.getTime() < openingDate.getTime()) {
        return "CLOSED";
    } else if (curTimeDate.getTime() >= addHours(closingDate, -1).getTime() && curTimeDate.getTime() < closingDate.getTime()) {
        return "CLOSING SOON";
    } else if (curTimeDate.getTime() >= openingDate.getTime() && curTimeDate.getTime() < closingDate.getTime()) {
        return "OPEN";
    } else {
        return "CLOSED";
    }
}