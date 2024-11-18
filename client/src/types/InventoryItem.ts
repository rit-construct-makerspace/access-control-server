export default interface InventoryItem {
  id: number;
  image: string;
  name: string;
  labels: string[];
  unit: string;
  pluralUnit: string;
  count: number;
  pricePerUnit: number;
  threshold: number;
  staffOnly: boolean;
  storefrontVisible: boolean;
  notes: string;
  tags: InventoryTag[];
  tagID1: number | null;
  tagID2: number | null;
  tagID3: number | null;
}

export interface InventoryLedger {
  id: number;
  timestamp: Date;
  initiator: {
    id: number;
    firstName: string;
    lastName: string;
  };
  category: string;
  totalCost: number;
  purchaser: {
    id: number;
    firstName: string;
    lastName: string;
  };
  notes: string;
  items: {
    quantity: number;
    name: string
  }[];
}

export interface InventoryTag {
  id: number;
  label: string;
  color: string;
}