import InventoryItem from "./InventoryItem";

export interface InventoryCart {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    ritUsername: string;
  };
  makerspace: {
    id: number;
    name: string;
  };
  items?: InventoryItem[];
  lastModified: string;
}

export interface CartItem {
  id: number;
  image: string;
  name: string;
  unit: string;
  pluralUnit: string;
  count: number;
  pricePerUnit: number;
  notes: string;
  cartcount: number;
}
