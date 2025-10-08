/** room.ts
 * Object Model for Rooms
 */
export interface Room {
  id: number;
  name: string;
  archived: boolean;
  makerspaceID: number | null;
}
