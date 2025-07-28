export default interface ZoneHours {
    day: Date;
    makerspaceID: number;
    open: Date | null;
    close: Date | null;
    closed: boolean;
}

export interface ZoneDefaultHours {
    dayOfWeek: number;
    makerspaceID: number;
    open: Date | null;
    close: Date | null;
    closed: boolean;
}