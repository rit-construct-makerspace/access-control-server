export default interface MakerspaceHours {
    day: Date;
    makerspaceID: number;
    open: string | null;
    close: string | null;
    closed: boolean;
}

export interface MakerspaceDefaultHours {
    dayOfWeek: number;
    makerspaceID: number;
    open: string | null;
    close: string | null;
    closed: boolean;
}