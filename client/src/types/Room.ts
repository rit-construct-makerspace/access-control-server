import { TrainingModule } from "../common/TrainingModuleUtils";
import Equipment from "./Equipment";

export default interface Room {
  id: number;
  name: string;
  archived: boolean;
  equipment: Equipment[];
  trainingModules: TrainingModule[];
}

export default interface Makerspace {
  id: number;
  name: string;
}

export default interface MakerspaceHour {
  id: number;
  makerspaceID: number;
  type: string;
  dayOfTheWeek: number;
  time: string;
}

/**
 * Attempt to depreciate in favor of Room
 */
export interface FullRoom {
  id: number;
  name: string;
  equipment: Equipment[];
}
