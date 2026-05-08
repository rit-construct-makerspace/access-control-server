import { ApolloContext } from "../context.js";
import * as InventoryRepo from "../database/repositories/Store/InventoryRepository.js";
import { InventoryItemInput } from "../schemas/storeFrontSchema.js";
import { deleteInventoryItem } from "../database/repositories/Store/InventoryRepository.js";
import { createLedger, deleteLedger, getLedgers } from "../database/repositories/Store/InventoryLedgerRepository.js";
import { GraphQLError } from "graphql";
import { getUserByID, getUserByIDOrUndefined } from "../database/repositories/Users/UserRepository.js";
import { notifyInventoryItemBelowThreshold } from "../integrations/slack/slack.js";
import { InventoryItemRow, InventoryLedgerRow } from "../database/knex/tables.js";
import { getMakerspaceByID } from "../database/repositories/Makerspaces/MakerspaceRespository.js";

const StorefrontResolvers = {
  InventoryItem: {
    //Map field tags to array of InventoryTags from tagID1, tagID2, tagID3 columns
    tags: async (parent: InventoryItemRow) => {
      return await InventoryRepo.getItemTags(parent.id);
    },
    //Map field makerspace to corresponding makerspace row, if any
    makerspace: async (parent: InventoryItemRow) => {
      return parent.makerspaceID ? await getMakerspaceByID(parent.makerspaceID) : undefined;
    }
  },

  InventoryLedger: {
    //Map initiator field to User
    initiator: (parent: InventoryLedgerRow) => {
      return parent.initiator ? getUserByID(parent.initiator) : undefined;
    },

    //Map purchaser field to Use
    purchaser: (parent: InventoryLedgerRow) => {
      return getUserByIDOrUndefined(parent.purchaser);
    }
  },

  Query: {
    /**
     * Fetch all InventoryItems
     * @argument storefrontVisible If defined, fetch records of matching storefrontVisible value
     * @argument makerspaceID If defined, fetch records of matching makerspaceID value
     * @returns array of InventoryItems
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    InventoryItems: async (
      _: any,
      args: { storefrontVisible?: boolean, makerspaceID?: number },
      { isStaff }: ApolloContext) => {
      if (args.storefrontVisible === null || args.storefrontVisible === undefined) {
        return isStaff(async () => {
          return await InventoryRepo.getItems(args.makerspaceID);
        })
      }
      else if (args.storefrontVisible == false) {
        return isStaff(async () => {
          return await InventoryRepo.getItemsWhereStorefront(false, args.makerspaceID);
        })
      }
      else {
        return await InventoryRepo.getItemsWhereStorefront(true, args.makerspaceID);
      }
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
      { isStaff }: ApolloContext) => {
      const item = await InventoryRepo.getItemById(Number(args.id));
      if (!item?.storefrontVisible) return isStaff(() => {
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
      args: { startDate: string, stopDate: string, searchText: string, limit: number },
      { isStaff }: ApolloContext) => {
      return isStaff(() => {
        const startDate = args.startDate ?? "2020-01-01";
        const stopDate = args.stopDate ?? "2200-01-01";
        const searchText = args.searchText ?? "";
        const limit = args.limit ?? 100;
        return getLedgers(startDate, stopDate, searchText, limit);
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
      { isStaff }: ApolloContext) => {
      return isStaff(async () => {
        return await InventoryRepo.getTags();
      })
    },

    inventoryItemsByTag: async (
      _parnet: any,
      args: {
        tagID: number
      },
      { isStaff }: ApolloContext
    ) => isStaff((_user) => (
      InventoryRepo.getItemsByTagID(args.tagID)
    )),
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
      { isAdmin }: ApolloContext) =>
      isAdmin(async (user) => {
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
      { isStaff, isManager }: ApolloContext) => {
      const orig = await InventoryRepo.getItemById(Number(args.itemId))
      //If item is STAFF ONLY, only allow edits by staff
      if (!(orig)?.staffOnly) {
        return isStaff(async (user) => {
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
      return isManager(async (user) => {
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
      { isStaff, isManager }: ApolloContext) => {
      const orig = await InventoryRepo.getItemById(Number(args.itemId));
      if (!(orig)?.staffOnly) {
        return isStaff(async (user) => {
          if (!orig) throw new GraphQLError("Item at" + args.itemId + " does not exist");
          const result = await InventoryRepo.addItemAmount(Number(args.itemId), args.count);
          await createLedger(user.id, "Modify", orig.pricePerUnit * args.count, undefined, "", [{ name: orig.name, quantity: Number(args.count) }]);
          return result;
        })
      }
      return isManager(async (user) => {
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
      { isStaff, isManager }: ApolloContext) => {
      const orig = await InventoryRepo.getItemById(Number(args.itemID));
      if (!(orig)?.staffOnly) {
        return isStaff(async (user) => {
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
      return isManager(async (user) => {
        if (!orig) throw new GraphQLError("Item at" + args.itemID + " does not exist");
        const result = await InventoryRepo.addItemAmount(Number(args.itemID), args.count);
        await createLedger(user.id, "Modify", orig.pricePerUnit * args.count, undefined, "", [{ name: orig.name, quantity: Number(args.count) * -1 }]);
        return result;
      })
    },

    setItemAmount: async (
      _parent: any,
      args: {
        itemID: number,
        count: number
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => {
      const orig = await InventoryRepo.getItemById(args.itemID);
      if (orig === null) { return null; }

      if (args.count < 0) { args.count = 0; }

      const result = await InventoryRepo.setItemAmount(args.itemID, args.count)
      if (result === null) { return null; }
      const diff = result.count - orig.count;
      if (diff < 0) {
        if (result.count < result.threshold && orig.count >= result.threshold) {
          await notifyInventoryItemBelowThreshold(result.name, result.count);
        }
        await createLedger(user.id, "Modify", result.pricePerUnit * Math.abs(diff), undefined, "", [{ name: result.name, quantity: diff }]);
      } else if (diff > 0) {
        await createLedger(user.id, "Modify", result.pricePerUnit * Math.abs(diff), undefined, "", [{ name: result.name, quantity: diff }]);
      }

      return result;
    }),

    /**
     * Mark an InventoryItem as archived
     * @argument itemId ID of InventoryItem to modify
     * @returns updated InventoryItem
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    archiveInventoryItem: async (
      _: any,
      args: { itemID: string },
      { isManager, isStaff }: ApolloContext) => {
      if (!(await InventoryRepo.getItemById(Number(args.itemID)))?.staffOnly) {
        return isManager(async () => {
          return await InventoryRepo.archiveItem(Number(args.itemID));
        })
      }
      return isStaff(async () => {
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
      { isStaff, isManager }: ApolloContext) => {
      const orig = await InventoryRepo.getItemById(Number(args.id));
      if (!(orig)?.staffOnly) {
        return isStaff(async (user) => {
          if (!orig) throw new GraphQLError("Item at" + args.itemID + " does not exist");
          const result = await InventoryRepo.deleteInventoryItem(Number(args.id));
          await createLedger(user.id, "Delete", -orig.pricePerUnit * Number(orig.count), undefined, "", [{ name: orig.name, quantity: Number(orig.count) * -1 }]);
          return result;
        })
      }
      return isManager(async () => {
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
      args: { items: { id: number, count: number }[], notes: string | null },
      { ifAuthenticated }: ApolloContext) => {
      return ifAuthenticated(async (user) => {
        if (process.env.VITE_DISABLE_STOREFRONT_CART === "true") {
          throw new GraphQLError("Functionality is disabled.");
        }

        const allItems = await InventoryRepo.getItemsByID(args.items.map(item => item.id));
        for (let i = 0; i < args.items.length; i++) {
          const item = allItems.find((item) => item.id == args.items[i].id);
          if (!item) {
            throw new GraphQLError("Item with ID " + args.items[i].id + " does not exist");
          }
          if (item.staffOnly && user.manager.length <= 0) {
            //Fail if user is trying to checkout a staff item
            throw new GraphQLError("Unauthorized to checkout staff-only item");
          }
          if (item.count < args.items[i].count) {
            throw new GraphQLError("Insufficient stock for item " + item.name);
          }
        }

        let totalCost = 0;
        const ledgerItems: { name: string, quantity: number, pricePerUnit: number }[] = []

        for (let i = 0; i < args.items.length; i++) {
          //Deduct count from each respective item. Fail if item does not exist
          const item = await InventoryRepo.addItemAmount(args.items[i].id, args.items[i].count * -1)
          if (!item) {
            throw new GraphQLError("Item does not exist")
          }
          ledgerItems.push({ name: item.name, quantity: args.items[i].count, pricePerUnit: item.pricePerUnit });
          totalCost -= args.items[i].count * item.pricePerUnit
        }


        //Attempt Purchase
        if (totalCost > 0) {
          throw new GraphQLError("Total cost must be negative");
        }
        return false;
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
      { isManager, isStaff }: ApolloContext) => {
      if (!(await InventoryRepo.getItemById(Number(args.id)))?.staffOnly) {
        return isManager(async () => {
          await InventoryRepo.setStorefrontVisible(Number(args.id), args.storefrontVisible);
          return await InventoryRepo.getItemById(Number(args.id));
        })
      }
      return isStaff(async () => {
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
      { isManager }: ApolloContext) => {
      return isManager(async () => {
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
      { isManager }: ApolloContext) => {
      return isManager(() => deleteLedger(Number(args.id)));
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
      { isManager }: ApolloContext) => {
      return isManager(() => InventoryRepo.createTag(args.label, args.color));
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
      { isManager }: ApolloContext) => {
      return isManager(() => InventoryRepo.updateTag(args.id, args.label, args.color));
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
      { isManager }: ApolloContext) => {
      return isManager(() => InventoryRepo.deleteTag(args.id));
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
      { isManager }: ApolloContext) => {
      return isManager(() => InventoryRepo.addTagToItem(args.itemID, args.tagID));
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
      { isManager }: ApolloContext) => {
      return isManager(() => InventoryRepo.removeTagFromItem(args.itemID, args.tagID));
    },

    /**
     * Update the makerspaceID of an InventoryItem
     * @argument id ID of InventoryItem to modify
     * @argument makerspaceID new makerspaceID
     * @returns true
     * @throws GraphQLError if not admin or is on hold
     */
    updateMakerspaceForItem: async (
      _parent: any,
      args: { id: number, makerspaceID: number },
      { isAdmin }: ApolloContext) => {
      return isAdmin(() => InventoryRepo.updateMakerspaceForItem(args.id, args.makerspaceID));
    },
  }
};

export default StorefrontResolvers;
