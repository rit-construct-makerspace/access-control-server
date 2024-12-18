import { ApolloContext, ifAllowed } from "../context.js";
import * as InventoryRepo from "../repositories/Store/InventoryRepository.js";
import { InventoryItem, InventoryItemInput } from "../schemas/storeFrontSchema.js";
import { Privilege } from "../schemas/usersSchema.js";
import { deleteInventoryItem } from "../repositories/Store/InventoryRepository.js";
import { createLedger, deleteLedger, getLedgers } from "../repositories/Store/InventoryLedgerRepository.js";
import { GraphQLError } from "graphql";
import { getUserByID, getUserByIDOrUndefined } from "../repositories/Users/UserRepository.js";
import { notifyInventoryItemBelowThreshold } from "../slack/slack.js";
import { InventoryItemRow } from "../db/tables.js";

const StorefrontResolvers = {
  InventoryItem: {
    //Map field tags to array of InventoryTags from tagID1, tagID2, tagID3 columns
    tags: async (parent: InventoryItemRow) => {
      var tags = [];
      if (parent.id == 104) console.log(parent)
      if (parent.tagID1) tags.push(await InventoryRepo.getTagByID(parent.tagID1));
      if (parent.tagID2) tags.push(await InventoryRepo.getTagByID(parent.tagID2));
      if (parent.tagID3) tags.push(await InventoryRepo.getTagByID(parent.tagID3));
      return tags;
    },
  },

  InventoryLedger: {
    //Map initiator field to User
    initiator: (parent: any) => {
      return getUserByID(parent.initiator);
    },
    
    //Map purchaser field to Use
    purchaser: (parent: any) => {
      return getUserByIDOrUndefined(parent.purchaser);
    }
  },

  Query: {
    /**
     * Fetch all InventoryItems
     * @argument storefrontVisible If defined, fetch records of matching storefrontVisible value
     * @returns array of InventoryItems
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    InventoryItems: async (
      _: any,
      args: { storefrontVisible?: boolean },
      { ifAllowed }: ApolloContext) => {
      if (args.storefrontVisible == null || args.storefrontVisible == undefined)
        return await InventoryRepo.getItems();
      if (args.storefrontVisible)
        ifAllowed([Privilege.MENTOR, Privilege.STAFF], async () => {
          return await InventoryRepo.getItemsWhereStorefront(true);
        })
      return await InventoryRepo.getItemsWhereStorefront(false);
    },

    /**
     * Fetch InventoryItem by ID
     * @argument id ID of InventoryItem
     * @returns InventoryItem
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    InventoryItem: async (
      _: any,
      args: { id: string },
      { ifAllowed }: ApolloContext) => {
      const item = await InventoryRepo.getItemById(Number(args.id));
      if (!item?.storefrontVisible) return ifAllowed([Privilege.MENTOR, Privilege.STAFF], () => {
        return item;
      })
      else {
        return item;
      }
    },

    /**
     * Fetch all Ledgers by defined filters
     * @argument startDate earliest date to filter by
     * @argument stopDate latest date to filter by
     * @argument searchText string to inclusively search content, author, and items json by
     * @returns array of Ledgers
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    Ledgers: async (
      _: any,
      args: { startDate: string, stopDate: string, searchText: string },
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.STAFF, Privilege.MENTOR], () => {
        const startDate = args.startDate ?? "2020-01-01";
        const stopDate = args.stopDate ?? "2200-01-01";
        const searchText = args.searchText ?? "";
        return getLedgers(startDate, stopDate, searchText);
      });
    },

    /**
     * Fetch all InventoryTags
     * @returns array of InventoryTags
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    inventoryTags: async (
      _: any,
      _args: any,
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.STAFF, Privilege.MENTOR], async () => {
        return await InventoryRepo.getTags();
      })
    },
  },

  Mutation: {
    /**
     * Create a new InventoryItem
     * @argument item InventoryItemInput
     * @returns new InventoryItem
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    createInventoryItem: async (
      _: any,
      args: { item: InventoryItemInput },
      { ifAllowed }: ApolloContext) =>
      ifAllowed([Privilege.MENTOR, Privilege.STAFF], async (user) => {
        const result = await InventoryRepo.addItem(args.item);
        await createLedger(user.id, "Create", Number(args.item.pricePerUnit) * Number(args.item.count), undefined, "", [{ name: args.item.name, quantity: Number(args.item.count) }]);
        return result;
      }),

    /**
     * Modify a InventoryItem
     * @argument itemId ID of InventoryItem to modify
     * @argument item InventoryItemInput
     * @returns updated InventoryItem
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    updateInventoryItem: async (
      _: any,
      args: { itemId: string; item: InventoryItemInput },
      { ifAllowed }: ApolloContext) => {
      const orig = await InventoryRepo.getItemById(Number(args.itemId))
      //If item is STAFF ONLY, only allow edits by staff
      if (!(orig)?.staffOnly) {
        return ifAllowed([Privilege.STAFF, Privilege.MENTOR], async (user) => {
          if (!orig) throw new GraphQLError("Item at" + args.itemId + " does not exist");
          const result = await InventoryRepo.updateItemById(Number(args.itemId), args.item).then(async (item) => {
            if (item && (item.count < item.threshold) && (orig.count >= item.threshold)) {
              await notifyInventoryItemBelowThreshold(item.name, item.count)
            }
          });;
          const costChange = (Number(args.item.pricePerUnit) * Number(args.item.count)) - (Number(orig.pricePerUnit) * Number(orig.count));
          await createLedger(user.id, "Modify", costChange, undefined, "", [{ name: args.item.name, quantity: Number(args.item.count) - Number(orig.count) }]);
          return result;
        })
      }
      return ifAllowed([Privilege.STAFF], async (user) => {
        const result = await InventoryRepo.updateItemById(Number(args.itemId), args.item).then(async (item) => {
          if (item && (item.count < item.threshold) && (orig.count >= item.threshold)) {
            await notifyInventoryItemBelowThreshold(item.name, item.count)
          }
        });
        const costChange = (Number(args.item.pricePerUnit) * Number(args.item.count)) - (Number(orig.pricePerUnit) * Number(orig.count));
        await createLedger(user.id, "Modify", costChange, undefined, "", [{ name: args.item.name, quantity: Number(args.item.count) - Number(orig.count) }]);
        return result;
      })
    },

    /**
     * Add to the amount of a InventoryItem
     * @argument itemId ID of InventoryItem to modify
     * @argument count amount to add by
     * @returns updated InventoryItem
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    addItemAmount: async (
      _: any,
      args: { itemId: string; count: number },
      { ifAllowed }: ApolloContext) => {
      const orig = await InventoryRepo.getItemById(Number(args.itemId));
      if (!(orig)?.staffOnly) {
        return ifAllowed([Privilege.MENTOR, Privilege.STAFF], async (user) => {
          if (!orig) throw new GraphQLError("Item at" + args.itemId + " does not exist");
          const result = await InventoryRepo.addItemAmount(Number(args.itemId), args.count);
          await createLedger(user.id, "Modify", orig.pricePerUnit * args.count, undefined, "", [{ name: orig.name, quantity: Number(args.count) }]);
          return result;
        })
      }
      return ifAllowed([Privilege.STAFF], async (user) => {
        if (!orig) throw new GraphQLError("Item at" + args.itemId + " does not exist");
        const result = await InventoryRepo.addItemAmount(Number(args.itemId), args.count);
        await createLedger(user.id, "Modify", orig.pricePerUnit * args.count, undefined, "", [{ name: orig.name, quantity: Number(args.count) }]);
        return result;
      })
    },

    /**
     * Subtract from the amount of a InventoryItem
     * @argument itemId ID of InventoryItem to modify
     * @argument count amount to subtract by
     * @returns updated InventoryItem
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    removeItemAmount: async (
      _: any,
      args: { itemID: string; count: number },
      { ifAllowed }: ApolloContext) => {
      const orig = await InventoryRepo.getItemById(Number(args.itemID));
      if (!(orig)?.staffOnly) {
        return ifAllowed([Privilege.MENTOR, Privilege.STAFF], async (user) => {
          if (!orig) throw new GraphQLError("Item at" + args.itemID + " does not exist");
          const result = await InventoryRepo.addItemAmount(Number(args.itemID), args.count).then(async (item) => {
            if (item && (item.count < item.threshold) && (orig.count >= item.threshold)) {
              await notifyInventoryItemBelowThreshold(item.name, item.count)
            }
          });
          await createLedger(user.id, "Modify", orig.pricePerUnit * args.count, undefined, "", [{ name: orig.name, quantity: Number(args.count) * -1 }]);
          return result;
        })
      }
      return ifAllowed([Privilege.STAFF], async (user) => {
        if (!orig) throw new GraphQLError("Item at" + args.itemID + " does not exist");
        const result = await InventoryRepo.addItemAmount(Number(args.itemID), args.count);
        await createLedger(user.id, "Modify", orig.pricePerUnit * args.count, undefined, "", [{ name: orig.name, quantity: Number(args.count) * -1 }]);
        return result;
      })
    },

    /**
     * Mark an InventoryItem as archived
     * @argument itemId ID of InventoryItem to modify
     * @returns updated InventoryItem
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    archiveInventoryItem: async (
      _: any,
      args: { itemID: string },
      { ifAllowed }: ApolloContext) => {
      if (!(await InventoryRepo.getItemById(Number(args.itemID)))?.staffOnly) {
        return ifAllowed([Privilege.STAFF], async () => {
          return await InventoryRepo.archiveItem(Number(args.itemID));
        })
      }
      return ifAllowed([Privilege.MENTOR, Privilege.STAFF], async () => {
        return InventoryRepo.archiveItem(Number(args.itemID));
      })
    },

    /**
     * Delete an InventoryItem
     * @argument itemId ID of InventoryItem to modify
     * @returns true
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    deleteInventoryItem: async (
      _parent: any,
      args: any,
      { ifAllowed }: ApolloContext) => {
      const orig = await InventoryRepo.getItemById(Number(args.id));
      if (!(orig)?.staffOnly) {
        return ifAllowed([Privilege.MENTOR, Privilege.STAFF], async (user) => {
          if (!orig) throw new GraphQLError("Item at" + args.itemID + " does not exist");
          const result = await InventoryRepo.deleteInventoryItem(Number(args.id));
          await createLedger(user.id, "Delete", -orig.pricePerUnit * Number(orig.count), undefined, "", [{ name: orig.name, quantity: Number(orig.count) * -1 }]);
          return result;
        })
      }
      return ifAllowed([Privilege.STAFF], async () => {
        return await deleteInventoryItem(args.id);
      }
      )
    },

    /**
     * Remove the amounts listed for each item listed and create a checkout ledger
     * @argument items { id: number, count: number } each item and the count being reduced
     * @argument notes a note to add to the checkout ledger
     * @argument recievingUserID ID of user items are being checked out to
     * @returns true
     * @throws GraphQLError if not MENTOR or STAFF or is on hold, or if not STAFF and attempts to checkout staffOnly item
     */
    checkoutItems: async (
      _parent: any,
      args: { items: { id: number, count: number }[], notes: string | null, recievingUserID: number | null },
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.MENTOR, Privilege.STAFF], async (user) => {
        const allItems = await InventoryRepo.getItems();
        for (var i = 0; i < args.items.length; i++) {
          if (allItems.find((item) => item.id = args.items[i].id)?.staffOnly && user.privilege != Privilege.STAFF) {
            //Fail if user is trying to checkout a staff item
            throw new GraphQLError("Unauthorized")
          }
        }

        var totalCost = 0;
        var ledgerItems: { name: string, quantity: number }[] = []

        for (var i = 0; i < args.items.length; i++) {
          //Deduct count from each respective item. Fail if item does not exist
          const item = await InventoryRepo.addItemAmount(args.items[i].id, args.items[i].count * -1)
          if (!item) {
            throw new GraphQLError("Item does not exist")
          }
          ledgerItems.push({ name: item.name, quantity: args.items[i].count * -1 });
          totalCost -= args.items[i].count * item.pricePerUnit
        }

        await createLedger(user.id, (args.recievingUserID ? "Purchase" : "Internal Use"), totalCost, (args.recievingUserID ?? undefined), args.notes ?? "", ledgerItems);
        return true;
      });
    },

    /**
     * Alter an InventoryItem's storefrontVisible value
     * @argument itemId ID of InventoryItem to modify
     * @argument storefrontVisible new value
     * @returns updated InventoryItem
     * @throws GraphQLError if not MENTOR or STAFF or is on hold, or if not STAFF and Item is staffOnly
     */
    setStorefrontVisible: async (
      _parent: any,
      args: { id: string, storefrontVisible: boolean },
      { ifAllowed }: ApolloContext) => {
      if (!(await InventoryRepo.getItemById(Number(args.id)))?.staffOnly) {
        return ifAllowed([Privilege.STAFF], async () => {
          await InventoryRepo.setStorefrontVisible(Number(args.id), args.storefrontVisible);
          return await InventoryRepo.getItemById(Number(args.id));
        })
      }
      return ifAllowed([Privilege.MENTOR, Privilege.STAFF], async () => {
        await InventoryRepo.setStorefrontVisible(Number(args.id), args.storefrontVisible);
        return await InventoryRepo.getItemById(Number(args.id));
      }
      )
    },

    /**
     * Alter an InventoryItem's staffOnly value
     * @argument itemId ID of InventoryItem to modify
     * @argument staffOnly new value
     * @returns updated InventoryItem
     * @throws GraphQLError if not STAFF or is on hold
     */
    setStaffOnly: async (
      _parent: any,
      args: { id: string, staffOnly: boolean },
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.STAFF], async () => {
        await InventoryRepo.setStaffOnly(Number(args.id), args.staffOnly);
        return await InventoryRepo.getItemById(Number(args.id));
      });
    },

    /**
     * Delete an InventoryLedger
     * @argument id ID of InventoryItem to delete
     * @returns true
     * @throws GraphQLError if not STAFF or is on hold
     */
    deleteLedger: async (
      _parent: any,
      args: { id: string },
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.STAFF], () => deleteLedger(Number(args.id)));
    },

    /**
     * Create an InventoryTag
     * @argument label new label
     * @argument color new ReactJS color type
     * @returns new InventoryTag
     * @throws GraphQLError if not STAFF or is on hold
     */
    createTag: async (
      _parent: any,
      args: { label: string, color: string },
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.STAFF], () => InventoryRepo.createTag(args.label, args.color));
    },

    /**
     * Modify an InventoryTag
     * @argument id ID of InventoryTag to modify
     * @argument label new label
     * @argument color new ReactJS color type
     * @returns updated InventoryTag
     * @throws GraphQLError if not STAFF or is on hold
     */
    updateTag: async (
      _parent: any,
      args: { id: number, label: string, color: string },
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.STAFF], () => InventoryRepo.updateTag(args.id, args.label, args.color));
    },

    /**
     * Delete an InventoryTag
     * @argument id ID of InventoryTag to delete
     * @returns true
     * @throws GraphQLError if not STAFF or is on hold
     */
    deleteTag: async (
      _parent: any,
      args: { id: number },
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.STAFF], () => InventoryRepo.deleteTag(args.id));
    },

    /**
     * Add an InventoryTag to an InventoryITem if there is space
     * @argument itemID id of InventoryItem to modify
     * @argument tagID id of InventoryTag to add to the Item
     * @returns true
     * @throws GraphQLError if not STAFF or is on hold
     */
    addTagToItem: async (
      _parent: any,
      args: { itemID: number, tagID: number },
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.STAFF], () => InventoryRepo.addTagToItem(args.itemID, args.tagID));
    },

    /**
     * Remove an InventoryTag from an InventoryITem if there is space
     * @argument itemID id of InventoryItem to modify
     * @argument tagID id of InventoryTag to remove from the Item
     * @returns true
     * @throws GraphQLError if not STAFF or is on hold
     */
    removeTagFromItem: async (
      _parent: any,
      args: { itemID: number, tagID: number },
      { ifAllowed }: ApolloContext) => {
      return ifAllowed([Privilege.STAFF], () => InventoryRepo.removeTagFromItem(args.itemID, args.tagID));
    },
  }
};

export default StorefrontResolvers;
