/** room.ts
 * Object Model for Rooms
 */
export interface Room {
  id: number;
  name: string;
  makerspaceID: number | null;
  archived: boolean;
}
