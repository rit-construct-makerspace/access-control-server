import { GraphQLError } from "graphql";
import { ApolloContext } from "../context.js";
import { InventoryCartsRow } from "../db/tables.js";
import { Terminal } from "../integrations/atrium-integration/atrium.js";
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

      const cart = await getInventoryCartByID(args.cartID);
      const cartUser = cart ? await getUserByID(cart.userID) : null;

      if (!cartUser) {
        throw new Error("Cart user not found");
      }

      const item = await getItemById(args.itemID);
      if (!item) {
        throw new Error("Item not found");
      }
      const totalCost = args.quantity * (item?.pricePerUnit || 0);

      const transDescription = `Refund for ${args.quantity} of ${item?.name}`;
      throw new GraphQLError("Store charging not implemented yet");
      /*
      const transaction = new Transaction(
        new Date(),
        "Makerspace Store",
        `For user ${user.ritUsername}: '${transDescription}'`,
        [{ name: item?.name, cents: Math.floor(totalCost * -100) }], false);

      //Attempt Refund
      var atriumTransactionSuccess = await adjustAccountBalanceIfAvailableCents(cartUser.ritUsername, transaction, Terminal.Store);
      if (!atriumTransactionSuccess) {
        throw new Error("Refund failed due to Atrium transaction error");
      }
      */

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
      const cart = await getInventoryCartByID(args.cartID);
      const cartUser = cart ? await getUserByID(cart.userID) : null;
      const items = await getItemsInCart(args.cartID);
      const fullItems = await addItemsAmounts(items.map(item => ({ itemId: item.id, amount: item.cartcount })));

      if (!cartUser) {
        throw new Error("Cart user not found");
      }

      //Refund items
      var totalRefund = 0;
      var ledgerItems: { name: string, quantity: number, pricePerUnit: number }[] = [];

      for (var i = 0; i < fullItems.length; i++) {
        ledgerItems.push({ name: fullItems[i].name, quantity: fullItems[i].count, pricePerUnit: fullItems[i].pricePerUnit });
        totalRefund += fullItems[i].count * fullItems[i].pricePerUnit;
      }

      const transDescription = `Refund of items: ${ledgerItems.map(item => `${item.name} x${item.quantity}`).join(", ")}`;
      throw new GraphQLError("Storefront charging not implemented yet");
      /*
      const transaction = new Transaction(
          new Date(),
          "Makerspace Store",
          `For user ${user.ritUsername}: '${transDescription}'`,
          ledgerItems.map(item => { return { name: item.name, cents: Math.floor(item.quantity * item.pricePerUnit * 100) } }), false);
        var atriumTransactionSuccess = await adjustAccountBalanceIfAvailableCents(user.ritUsername, transaction, Terminal.Store);

      //Attempt Refund
      if (totalRefund < 0) {
        throw new Error("Total refund cannot be negative");
      }
      var atriumTransactionSuccess = await adjustAccountBalanceIfAvailableCents(cartUser.ritUsername, transaction, Terminal.Store);
      if (!atriumTransactionSuccess) {
        throw new Error("Refund failed due to Atrium transaction error");
      }

      if (atriumTransactionSuccess) {
        return await clearItemsFromCart(args.cartID).then(async () => {
          await deleteInventoryCart(args.cartID);
          return true;
        });
      }
      */
     return false;
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