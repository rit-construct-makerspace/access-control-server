import { ApolloContext } from "../context.js";
import { InventoryCartsRow } from "../db/tables.js";
import { adjustAccountBalanceIfAvailableCents } from "../integrations/currency/currency.js";
import { clearItemsFromCart, deleteInventoryCart, getInventoryCartByID, getInventoryCarts, getInventoryCartsByMakerspace, getItemsInCart, subtractItemFromCart } from "../repositories/Store/InventoryCartsRepository.js";
import { addItemAmount, addItemsAmounts, getItemById } from "../repositories/Store/InventoryRepository.js";
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
      args: { makerspaceID?: number },
      _context: ApolloContext) => {
      console.log("args", args);
      if (args.makerspaceID) {
        return await getInventoryCartsByMakerspace(args.makerspaceID);
      }
      console.log("No makerspaceID provided");
      return await getInventoryCarts();
    }
  },

  Mutation: {
    subtractItemFromCart: async (
      _parent: any,
      args: { cartID: number; itemID: number; quantity: number, restock?: boolean },
      context: ApolloContext
    ) => context.isTrainer(async (user) => {
      if (args.quantity <= 0) {
        throw new Error("Quantity must be greater than zero");
      }

      const item = await getItemById(args.itemID);
      const totalCost = args.quantity * (item?.pricePerUnit || 0);

      const transDescription = `Refund for ${args.quantity} of ${item?.name}`;

      //Attempt Refund
      var atriumTransactionSuccess = await adjustAccountBalanceIfAvailableCents(user.ritUsername, Math.floor(totalCost) * 100, "SHED Store", transDescription);
      if (!atriumTransactionSuccess) {
        throw new Error("Refund failed due to Atrium transaction error");
      }

      //Restock
      if (args.restock) {
        await addItemsAmounts([{ itemId: args.itemID, amount: args.quantity }]);
      }

      return await subtractItemFromCart(args.cartID, args.itemID, args.quantity);
    }),
    cancelCart: async (
      _parent: any,
      args: { cartID: number },
      context: ApolloContext
    ) => context.isTrainer(async (user) => {
      //Restock items
      const items = await getItemsInCart(args.cartID);
      const fullItems = await addItemsAmounts(items.map(item => ({ itemId: item.id, amount: item.cartcount })));

      //Refund items
      var totalRefund = 0;
      var ledgerItems: { name: string, quantity: number }[] = []

      for (var i = 0; i < fullItems.length; i++) {
        ledgerItems.push({ name: fullItems[i].name, quantity: fullItems[i].count });
        totalRefund += fullItems[i].count * fullItems[i].pricePerUnit;
      }

      const transDescription = `Refund of items: ${ledgerItems.map(item => `${item.name} x${item.quantity}`).join(", ")}`;

      //Attempt Refund
      if (totalRefund < 0) {
        throw new Error("Total refund cannot be negative");
      }
      var atriumTransactionSuccess = await adjustAccountBalanceIfAvailableCents(user.ritUsername, Math.floor(totalRefund * 100), "SHED Store", transDescription);
      if (!atriumTransactionSuccess) {
        throw new Error("Refund failed due to Atrium transaction error");
      }

      if (atriumTransactionSuccess) {
        return await clearItemsFromCart(args.cartID).then(async () => {
          await deleteInventoryCart(args.cartID);
          return true;
        });
      }
    }),
    completeCart: async (
      _parent: any,
      args: { cartID: number },
      context: ApolloContext
    ) => context.isTrainer(async (user) => {
      return await clearItemsFromCart(args.cartID).then(async () => {
        await deleteInventoryCart(args.cartID);
        return true;
      });
      
    })
  }
}