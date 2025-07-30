/** InventoryItemMapper.ts
 * Map inventory item entires to attributes
 */

import { InventoryItem } from "../../schemas/storeFrontSchema.js";

export function inventoryItemsToDomain(raw: any): InventoryItem[] {
  return raw.map((i: any) => {
    return singleInventoryItemToDomain(i);
  });
}

export function singleInventoryItemToDomain(raw: any): InventoryItem | null {
  if (!raw) return null;

  return {
    id: raw.id,
    image: raw.image,
    name: raw.name,
    unit: raw.unit,
    pluralUnit: raw.pluralUnit,
    count: raw.count,
    pricePerUnit: raw.pricePerUnit,
    threshold: raw.threshold,
    staffOnly: raw.staffOnly,
    storefrontVisible: raw.storefrontVisible,
    notes: raw.notes,
    tagID1: raw.tagID1,
    tagID2: raw.tagID2,
    tagID3: raw.tagID3,
    description: raw.description,
    makerspaceID: raw.makerspaceID,
  };
}
