export default interface ZoneHours {
    day: Date;
    makerspaceID: number;
    open: string | null;
    close: string | null;
    closed: boolean;
}

export interface ZoneDefaultHours {
    dayOfWeek: number;
    makerspaceID: number;
    open: string | null;
    close: string | null;
    closed: boolean;
}