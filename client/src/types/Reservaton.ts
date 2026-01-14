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