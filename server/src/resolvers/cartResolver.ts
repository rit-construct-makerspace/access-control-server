import { ApolloContext } from "../context.js";
import { InventoryCartsRow } from "../db/tables.js";
import { getInventoryCartByID, getInventoryCarts, getInventoryCartsByMakerspace, getItemsInCart, subtractItemFromCart } from "../repositories/Store/InventoryCartsRepository.js";
import { getUserByID } from "../repositories/Users/UserRepository.js";
import { getZoneByID } from "../repositories/Zones/ZonesRespository.js";

export const CartResolver = {
  InventoryCart: {
    user: async (
      parent: InventoryCartsRow,
      _args: any,
      _context: ApolloContext) => {
      return await getUserByID(parent.userID)
    },
    makerspace: async (
      parent: InventoryCartsRow,
      _args: any,
      _context: ApolloContext) => {
      return await getZoneByID(parent.makerspaceID)
    },
    items: async (
      parent: InventoryCartsRow,
      _args: any,
      _context: ApolloContext) => {
      return await getItemsInCart(parent.id)
    }
  },

  Query: {
    cart: async (
      _parent: any,
      args: { id: number },
      _context: ApolloContext) => {
      return await getInventoryCartByID(args.id);
    },
    carts: async (
      _parent: any,
      args: {makerspaceID?: number},
      _context: ApolloContext) => {
      if (args.makerspaceID) {
        return await getInventoryCartsByMakerspace(args.makerspaceID);
      }
      return await getInventoryCarts();
    }
  },

  Mutation: {
    subtractItemFromCart: async (
      _parent: any,
      args: { cartID: number; itemID: number; quantity: number },
      _context: ApolloContext
    ) => {
      if (args.quantity <= 0) {
        throw new Error("Quantity must be greater than zero");
      }
      return await subtractItemFromCart(args.cartID, args.itemID, args.quantity);
    }
  }
}