export default interface Equipment {
  id: number;
  name: string;
  imageUrl?: string;
  sopUrl: string;
  trainingModules: any;
  numAvailable: number;
  numInUse: number;
  byReservationOnly: boolean;
  needsWelcome?: boolean;
  requiresInPerson: boolean;
  schedulable: boolean;
  readerID?: number;
  notes: string;
  archived: boolean;
  subName: string;
  signOffUrl: string;
}

export interface EquipmentWithRoom {
  id: number;
  name: string;
  imageUrl?: string;
  sopUrl: string;
  trainingModules: any;
  numAvailable: number;
  numInUse: number;
  byReservationOnly: boolean;
  schedulable: boolean;
  archived: boolean;
  notes: string;
  room: {
    name: string;
    id: number;
    makerspace: any;
  };
}
