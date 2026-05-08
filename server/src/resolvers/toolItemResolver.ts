/**
 * toolItemResolver.ts
 * GraphQL Endpoint Implementations for ToolItemInstances and ToolItemTypes
 */

import { ApolloContext } from "../context.js";
import { ToolItemInstancesRow, ToolItemTypesRow } from "../knex/tables.js";
import { borrowItem, createToolItemInstance, deleteToolItemInstance, getToolItemInstanceByID, getToolItemInstances, getToolItemInstancesByBorrower, getToolItemInstancesByType, returnItem, updateToolItemInstance } from "../repositories/Store/ToolItemInstancesRepository.js";
import { createToolItemType, deleteToolItemType, getToolItemTypeByID, getToolItemTypes, getToolItemTypesWhereAllowCheckout, updateToolItemType } from "../repositories/Store/ToolItemTypesRepository.js";
import { getUserByID, getUsersFullName } from "../repositories/Users/UserRepository.js";
import { ToolItemInstanceInput, ToolItemTypeInput } from "../schemas/toolItemsSchema.js";
import { getRoomByID } from "../repositories/Rooms/RoomRepository.js";
import { createUnassocaitedAuditLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { GraphQLError } from "graphql";
import { notifyToolItemMarked } from "../integrations/slack/slack.js";

const ToolItemResolver = {
  ToolItemType: {
    //Map instances field to array of assocaited ToolItemInstances
    instances: async (
      parent: ToolItemTypesRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getToolItemInstancesByType(parent.id);
      }
      ),

    //Map defaultLocationRoom field to Room
    defaultLocationRoom: async (
      parent: ToolItemTypesRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getRoomByID(parent.defaultLocationRoomID);
      }
      ),
  },

  ToolItemInstance: {
    //Map type field to ToolItemType
    type: async (
      parent: ToolItemInstancesRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getToolItemTypeByID(parent.typeID);
      }
      ),

    //Map borrower field to User
    borrower: async (
      parent: ToolItemInstancesRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        if (!parent.borrowerUserID) return null;
        return getUserByID(parent.borrowerUserID);
      }
      ),

    //Map locationRoom field to Room
    locationRoom: async (
      parent: ToolItemInstancesRow,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getRoomByID(parent.locationRoomID);
      }
      ),
  },

  Query: {
    /**
     * Fetch all ToolItemTypes
     * @returns array of ToolItemTypes
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    toolItemTypes: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getToolItemTypes();
      }
      ),

    /**
     * Fetch all ToolItemTypes where allowCheckout is true
     * @returns array of ToolItemTypes
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    toolItemTypesAllowCheckout: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getToolItemTypesWhereAllowCheckout();
      }
      ),

    /**
     * Fetch ToolItemType by ID
     * @argument id ID of ToolItemType
     * @returns ToolItemType
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    toolItemType: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getToolItemTypeByID(args.id);
      }
      ),

    /**
     * Fetch all ToolItemInstances
     * @returns array of ToolItemInstances
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    toolItemInstances: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getToolItemInstances();
      }
      ),

    /**
     * Fetch all ToolItemInstances by assocciated ToolItemType
     * @argument id ID of associated ToolItemType
     * @returns array of ToolItemInstances
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    toolItemInstancesByType: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getToolItemInstancesByType(args.id);
      }
      ),

    /**
     * Fetch ToolItemInstance by ID
     * @argument id ID of ToolItemInstance
     * @returns ToolItemType
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    toolItemInstance: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getToolItemInstanceByID(args.id);
      }
      ),

    /**
     * Fetch all ToolItemInstances by brrowing User
     * @argument id ID of borrower User
     * @returns array of ToolItemInstances
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    toolItemInstancesByBorrower: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async () => {
        return getToolItemInstancesByBorrower(args.id);
      }
      ),
  },

  Mutation: {
    /**
     * Create a ToolItemType
     * @argument toolItemType new ToolItemType input
     * @returns new ToolItemType
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    createToolItemType: async (
      _parent: any,
      args: { toolItemType: ToolItemTypeInput },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user) => {
        await createUnassocaitedAuditLog(`{user} created tool item type '${args.toolItemType.name}'`, 'admin', { id: user.id, label: getUsersFullName(user) });
        return await createToolItemType(args.toolItemType.name, args.toolItemType.defaultLocationRoomID,
          args.toolItemType.defaultLocationDescription, args.toolItemType.description, args.toolItemType.checkoutNote,
          args.toolItemType.checkinNote, args.toolItemType.allowCheckout);
      }
      ),

    /**
     * Modify a ToolItemType
     * @argument id ID of ToolItemType to modify
     * @argument toolItemType new ToolItemType input
     * @returns updated ToolItemType
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    updateToolItemType: async (
      _parent: any,
      args: { id: number, toolItemType: ToolItemTypeInput },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user) => {
        const orig = await getToolItemTypeByID(args.id);
        if (!orig) throw new GraphQLError("Type does not exist");
        await createUnassocaitedAuditLog(`{user} updated tool item type '${orig.name}'`, 'admin', { id: user.id, label: getUsersFullName(user) });
        return updateToolItemType(
          args.id,
          args.toolItemType.name,
          args.toolItemType.defaultLocationRoomID,
          args.toolItemType.defaultLocationDescription,
          args.toolItemType.description,
          args.toolItemType.checkoutNote,
          args.toolItemType.checkinNote,
          args.toolItemType.allowCheckout,
          args.toolItemType.imageUrl
        );
      }
      ),

    /**
     * Create a ToolItemInstance
     * @argument toolItemInstance new ToolItemInstance input
     * @returns new ToolItemInstance
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    createToolItemInstance: async (
      _parent: any,
      args: { toolItemInstance: ToolItemInstanceInput },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user) => {
        await createUnassocaitedAuditLog(`{user} created tool item instance '${args.toolItemInstance.uniqueIdentifier}'`, 'admin', { id: user.id, label: getUsersFullName(user) });
        return createToolItemInstance(Number(args.toolItemInstance.typeID), args.toolItemInstance.uniqueIdentifier,
          Number(args.toolItemInstance.locationRoomID), args.toolItemInstance.locationDescription, args.toolItemInstance.condition,
          args.toolItemInstance.status, args.toolItemInstance.notes);
      }
      ),

    /**
     * Modify a ToolItemInstance
     * @argument id ID of ToolItemInstance to modify
     * @argument toolItemInstance new ToolItemInstance input
     * @returns updated ToolItemInstance
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    updateToolItemInstance: async (
      _parent: any,
      args: { id: number, toolItemInstance: ToolItemInstanceInput },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user) => {
        const orig = await getToolItemInstanceByID(args.id);
        if (!orig) throw new GraphQLError("Instance does not exist");
        const makerspace = await getRoomByID(orig.locationRoomID);

        if (!(args.toolItemInstance.status == orig.status)
          && (args.toolItemInstance.status == "MISSING"
            || args.toolItemInstance.status == "DO NOT USE")
        ) {
          await notifyToolItemMarked(args.toolItemInstance.uniqueIdentifier, makerspace?.id ?? 0, orig.id, orig.typeID, args.toolItemInstance.status);
        }
        else if (!(args.toolItemInstance.condition == orig.condition)
          && (args.toolItemInstance.condition == "DAMAGED"
            || args.toolItemInstance.condition == "MISSING PARTS")
        ) {
          await notifyToolItemMarked(args.toolItemInstance.uniqueIdentifier, makerspace?.id ?? 0, orig.id, orig.typeID, args.toolItemInstance.condition);
        }
        await createUnassocaitedAuditLog(`{user} updated tool item instance '${orig.uniqueIdentifier}'`, 'admin', { id: user.id, label: getUsersFullName(user) });
        return updateToolItemInstance(args.id, args.toolItemInstance.typeID, args.toolItemInstance.uniqueIdentifier,
          args.toolItemInstance.locationRoomID, args.toolItemInstance.locationDescription, args.toolItemInstance.condition,
          args.toolItemInstance.status, args.toolItemInstance.notes);
      }
      ),

    /**
     * Mark a ToolItemInstance as Borrowed
     * @argument userID ID of User to be set as the Borrower
     * @argument instanceID ID of ToolItemInstance to modify
     * @returns updated ToolItemInstance
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    borrowInstance: async (
      _parent: any,
      args: { userID: number, instanceID: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user) => {
        const reciever = await getUserByID(args.userID);
        if (!reciever) throw new GraphQLError("Recieving User does not exist");
        const orig = await getToolItemInstanceByID(args.instanceID);
        if (!orig) throw new GraphQLError("Type does not exist");
        await createUnassocaitedAuditLog(`{user} loaned tool item '${orig.uniqueIdentifier}' to {user}`, 'admin', { id: user.id, label: getUsersFullName(user) }, { id: reciever.id, label: getUsersFullName(reciever) });
        return borrowItem(args.userID, args.instanceID);
      }
      ),

    /**
     * Mark a ToolItemInstance as not borrowed
     * @argument instanceID ID of ToolItemInstance to modify
     * @returns updated ToolItemInstance
     * @throws GraphQLError if not MENTOR or STAFF or is on hold, or if there is no valid Borrower or ToolItemType
     */
    returnInstance: async (
      _parent: any,
      args: { instanceID: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user) => {
        const orig = await getToolItemInstanceByID(args.instanceID);
        if (!orig) throw new GraphQLError("Type does not exist");
        const reciever = orig.borrowerUserID ? await getUserByID(orig.borrowerUserID) : undefined;
        if (!reciever) throw new GraphQLError("Returning User does not exist");
        await createUnassocaitedAuditLog(`{user} returned tool item '${orig.uniqueIdentifier}' from {user}`, 'admin', { id: user.id, label: getUsersFullName(user) }, { id: reciever.id, label: getUsersFullName(reciever) });
        return returnItem(args.instanceID)
      }
      ),

    /**
     * Delete a ToolItemType
     * @argument id ID of ToolItemType to delete
     * @returns true
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    deleteToolItemType: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user) => {
        const orig = await getToolItemTypeByID(args.id);
        if (!orig) throw new GraphQLError("Type does not exist");
        await createUnassocaitedAuditLog(`{user} deleted tool item type '${orig.name}'`, 'admin', { id: user.id, label: getUsersFullName(user) });
        return deleteToolItemType(args.id);
      }
      ),

    /**
     * Delete a ToolItemInstance
     * @argument id ID of ToolItemInstance to delete
     * @returns true
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    deleteToolItemInstance: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user) => {
        const orig = await getToolItemInstanceByID(args.id);
        if (!orig) throw new GraphQLError("Instance does not exist");
        await createUnassocaitedAuditLog(`{user} deleted tool item instance '${orig.uniqueIdentifier}'`, 'admin', { id: user.id, label: getUsersFullName(user) });
        return deleteToolItemInstance(args.id);
      }
      ),
  }
};

export default ToolItemResolver;