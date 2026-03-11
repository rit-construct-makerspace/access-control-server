import { RoomRow } from "../../db/tables.js";
import * as RoomRepo from "../../repositories/Rooms/RoomRepository.js";

export class Room implements RoomRow {
  id: number;
  name: string;
  archived: boolean;
  makerspaceID: number | null;

  constructor(rawRow: RoomRow) {
    this.id = rawRow.id;
    this.name = rawRow.name;
    this.archived = rawRow.archived;
    this.makerspaceID = rawRow.makerspaceID;
  }

  async welcome(userID: number) {
    RoomRepo.swipeIntoRoom(this.id, userID);
  }

}
