/**
 * MakerspaceHoursRepository.ts
 * DB Operations for Makerspace Hours / Open Hours
 */

import { GraphQLError } from "graphql";
import { knex } from "../../db/index.js";
import { DefaultHoursRow, SpecialHoursRow } from "../../db/tables.js";

const full_formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
});

const day_formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long"
});

function dateToLocalizedNum(day: Date): number {
    switch (day_formatter.format(day)) {
        case "Sunday":
            return 0;
        case "Monday":
            return 1;
        case "Tuesday":
            return 2;
        case "Wednsday":
            return 3;
        case "Thursday":
            return 4;
        case "Friday":
            return 5;
        case "Saturday":
            return 6;
        default:
            return 0;
    }
}

/**
 * 
 * @param day A date object
 * @param makerspaceID The Makerspace to get the hours of
 * @returns A Special Hours Row of the hours
 */
export async function getMakerspaceHoursOnDay(day: Date, makerspaceID: number): Promise<SpecialHoursRow> {
    const special = await knex("SpecialHours").where({ makerspaceID: makerspaceID }).andWhereRaw(`CAST(day as DATE) = CAST('${full_formatter.format(day)}' as DATE)`).select("*");
    if (special.length > 0) {
        return special[0];
    }

    const defaultHours = await knex("DefaultHours").where({ dayOfWeek: dateToLocalizedNum(day), makerspaceID: makerspaceID }).select("*");

    if (defaultHours.length < 1) {
        throw new GraphQLError(`Hours not found on ${full_formatter.format(day)} for makerspace ${makerspaceID}`);
    }

    const result: SpecialHoursRow = {
        day: day,
        makerspaceID: makerspaceID,
        open: defaultHours[0].open,
        close: defaultHours[0].close,
        closed: defaultHours[0].closed,
    }

    return result;
}

export async function getMakerspaceHoursNextWeek(makerspaceID: number): Promise<SpecialHoursRow[]> {
    const temp: SpecialHoursRow = {
        day: new Date(),
        makerspaceID: 0,
        open: null,
        close: null,
        closed: false
    }
    var week: SpecialHoursRow[] = [temp, temp, temp, temp, temp, temp, temp];

    var target = new Date();
    for (let i = 0; i < 7; i++) {
        await getMakerspaceHoursOnDay(target, makerspaceID).then((result) => {
            week[result.day.getDay()] = { ...result, day: new Date(result.day) };
            target.setDate(target.getDate() + 1);
        });
    }

    return week;
}

export async function getMakerspaceSpecialHours(makerspaceID: number): Promise<SpecialHoursRow[]> {
    return await knex("SpecialHours").where({ makerspaceID: makerspaceID }).select("*").orderBy("day", "asc");
};

export async function getMakerspaceDefaultHours(makerspaceID: number): Promise<DefaultHoursRow[]> {
    return await knex("DefaultHours").where({ makerspaceID: makerspaceID }).select("*").orderBy("dayOfWeek", "asc");
}

export async function addSpecialHours(hours: SpecialHoursRow): Promise<boolean> {
    try {
        await knex("SpecialHours").insert(hours).onConflict(["day", "makerspaceID"]).merge();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }

}

export async function deleteSpecialHours(day: Date, makerspaceID: number): Promise<boolean> {
    try {
        await knex("SpecialHours").where({ day: day, makerspaceID: makerspaceID }).delete();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function updateDefaultHours(hours: DefaultHoursRow): Promise<boolean> {
    try {
        await knex("DefaultHours").insert(hours).onConflict(["dayOfWeek", "makerspaceID"]).merge();
        return true;
    } catch (e) {
        console.error(e);
        return false
    }
}