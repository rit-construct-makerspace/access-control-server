import { MakerspaceRow } from "../../db/tables.js";
import { Room } from "../rooms/room.js";
import * as RoomRepo from "../../repositories/Rooms/RoomRepository.js";
import * as UserRepo from "../../repositories/Users/UserRepository.js";
import * as AuditLogRepo from "../../repositories/AuditLogs/AuditLogRepository.js";

export class Makerspace implements MakerspaceRow {
  id: number;
  name: string;
  subtitle: string | null;
  location: string | null;
  description: string;
  docsLink: string;
  imageUrl: string;
  archived: boolean;


  constructor(rawRow: MakerspaceRow) {
    this.id = rawRow.id;
    this.name = rawRow.name;
    this.subtitle = rawRow.subtitle;
    this.location = rawRow.location;
    this.description = rawRow.description;
    this.docsLink = rawRow.docsLink;
    this.imageUrl = rawRow.imageUrl;
    this.archived = rawRow.archived;
  }

  async getRooms(): Promise<Room[]> {
    return await RoomRepo.getRoomsByMakerspace(this.id);
  }

  async welcome(userID: number) {
    const user = await UserRepo.getUserByID(userID);
    AuditLogRepo.createAuditLog(
      `{user} signed into {makerspace}`,
      "welcome",
      this.id,
      { id: user.id, label: `${user.firstName, user.lastName}` },
      { id: this.id, label: this.name }
    );

    const rooms = await this.getRooms();
    rooms.forEach((room) => room.welcome(userID));
  }

}