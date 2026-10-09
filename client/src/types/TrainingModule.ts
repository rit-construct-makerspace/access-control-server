
export interface TrainingModule {
    id: number;
    name: string;
    quiz: JSON;
    reservationPrompt: string;
    isLocked?: boolean;
}
export interface AccessProgress {
    equipment: {
        id: number;
        name: string;
    };
    passedModules: {
        id: number;
        name: string;
    }[];
    availableModules: {
        id: number;
        name: string;
    }[];
    accessCheckRequired: boolean;
    accessCheckDone: boolean;
}