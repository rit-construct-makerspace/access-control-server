import { CurrentUser } from "../common/CurrentUserProvider";
import Equipment from "./Equipment";

export interface Reservation {
  id: number,
  start: string,
  end: string,
  description: string | null,
  approved: boolean,
  equipment: Equipment,
  user: CurrentUser
}

export interface ReservationEvent {
  title: React.ReactNode,
  start: Date,
  end: Date,
  isDraggable: boolean,
  reservation: Reservation,
  resourceId?: number
}