import Room from "./Room";

export enum ToolItemCondition {
  NEW = "NEW",
  GOOD = "GOOD",
  DAMAGED = "DAMAGED",
  MISSING_PARTS = "MISSING PARTS",
}
export const TOOL_ITEM_CONDITION_ARRAY = [ToolItemCondition.NEW, ToolItemCondition.GOOD, ToolItemCondition.DAMAGED, ToolItemCondition.MISSING_PARTS];

export enum ToolItemStatus {
  AVAILABLE = "AVAILABLE",
  OUT = "OUT",
  INTERNAL_USE = "INTERNAL USE",
  MISSING = "MISSING",
  DO_NOT_USE = "DO NOT USE"
}
export const TOOL_ITEM_STATUS_ARRAY = [ToolItemStatus.AVAILABLE, ToolItemStatus.OUT, ToolItemStatus.INTERNAL_USE, ToolItemStatus.MISSING, ToolItemStatus.DO_NOT_USE]

export interface ToolItemType {
  id: number;
  name: string;
  defaultLocationRoom: Room;
  defaultLocationDescription: string;
  description: string;
  checkoutNote: string;
  checkinNote: string;
  allowCheckout: boolean;
  instances: ToolItemInstance[];
  imageUrl: string;
}

export interface ToolItemInstance {
  id: number;
  type: ToolItemType;
  uniqueIdentifier: string;
  locationRoom: Room;
  locationDescription: string;
  condition: string;
  status: string;
  notes: string;
  borrower: {
    id: number;
    firstName: string;
    lastName: string;
  };
  borrowedAt: Date;
}

export interface ToolItemTypeInput {
  name?: string;
  defaultLocationRoomID?: number;
  defaultLocationDescription?: string;
  description?: string;
  checkoutNote?: string;
  checkinNote?: string;
  allowCheckout?: boolean;
  imageUrl?: string;
}

export interface ToolItemInstanceInput {
  typeID?: number;
  uniqueIdentifier?: string;
  locationRoomID?: number;
  locationDescription?: string;
  condition?: string;
  status?: string;
  notes?: string;
}