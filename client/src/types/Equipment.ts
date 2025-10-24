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
  readerID?: number;
  notes: string;
  archived: boolean;
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
  archived: boolean;
  notes: string;
  room: {
    name: string;
    id: number;
    makerspace: any;
  };
}
