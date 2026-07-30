import * as EquipmentRepo from "../../database/repositories/Equipment/EquipmentRepository.js";
import * as InstanceRepo from "../../database/repositories/Equipment/EquipmentInstancesRepository.js";
import * as RoomRepo from "../../database/repositories/Rooms/RoomRepository.js";
import * as ACRepo from "../../database/repositories/Devices/AccessControllerRepository.js";
import { ApolloContext } from "../../context.js";
import { EquipmentInstancesRow } from "../../database/knex/tables.js";
import { createInstance, deleteInstance, getInstanceByID, getInstancesByEquipment, setInstanceName, setInstanceStatus } from "../../database/repositories/Equipment/EquipmentInstancesRepository.js";
import { createAuditLog, createUnassocaitedAuditLog } from "../../database/repositories/AuditLogs/AuditLogRepository.js";
import { GraphQLError } from "graphql";
import { getUsersFullName } from "../../database/repositories/Users/UserRepository.js";
import { ACSOrchestrator } from "../../database/models/api/ACSOrchestrator.js";

const EquipmentInstanceResolver = {
  EquipmentInstance: {
    //Fetch full data for equipment field
    equipment: async (
      parent: EquipmentInstancesRow,
      _args: any,
      _context: ApolloContext) => {
      return EquipmentRepo.getEquipmentByID(Number(parent.equipmentID));
    },

    accessController: async (
      parent: EquipmentInstancesRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => {
      if (parent.accessControllerID === null || parent.accessControllerID === undefined) { return undefined; }
      return await ACRepo.getAccessControllerByID(parent.accessControllerID);
    })
  },

  Query: {
    /**
     * Fetch all equipment instances by equipment
     * @argument equipmentID ID of equipment to filter by
     * @returns all matching Equipment Instances
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    equipmentInstances: async (
      _parent: any,
      args: { equipmentID: number },
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await getInstancesByEquipment(args.equipmentID)
      }),

    getInstanceByID: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await getInstanceByID(args.id)
      }),

    getReaderPairedWithInstanceByInstanceId: async (
      _parent: any,
      args: { instanceID: number },
      { isStaff }: ApolloContext
    ) => isStaff(async () => {
      return await InstanceRepo.getReaderByInstanceId(args.instanceID)
    }),

    getInstanceByControllerID: async (
      _parent: any,
      args: {
        controllerID: number
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      await InstanceRepo.getInstanceByAccessControllerID(args.controllerID)
    ))
  },

  Mutation: {
    /**
     * Create a new equipment instance
     * @argument equipmentID ID of equipment to reference
     * @argument name Instance name
     * @returns new equipment instance
     * @throws GraphQLError if not MENTOR or STAFF or is on hold or equipment does not exist
     */
    createEquipmentinstance: async (
      _parent: any,
      args: {
        equipmentID: number, name: string
      },
      { isManager }: ApolloContext) =>
      isManager(async (user) => {
        const equipment = await EquipmentRepo.getEquipmentByID(args.equipmentID);
        if (!equipment) throw new GraphQLError("Equipment does not exist");
        await createUnassocaitedAuditLog(`{user} created instance "${args.name}" on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
        return await createInstance(args.equipmentID, args.name)
      }),

    /**
     * Update an equipment instance
     * @argument instanceID ID of the instance to modify
     * @argument name name of the instance
     * @argument status status of the instance (active, undeployed, etc)
     * @argument reader id of reader to pair with or null
     */
    updateInstance: async (
      _parent: any,
      args: {
        id: number,
        name: string,
        status: string,
      },
      { isStaff }: ApolloContext) =>
      isStaff(async (user) => {

        const instance = await InstanceRepo.getInstanceByID(args.id);

        if (!instance) throw new GraphQLError("Instance does not exist");

        const equipment = await EquipmentRepo.getEquipmentByID(instance.equipmentID);
        if (!equipment) throw new GraphQLError("Instance does not have associate Machine");

        const newInstance = await InstanceRepo.updateInstance(args.id, args.name, args.status);

        if (instance?.name != newInstance?.name) {
          await createUnassocaitedAuditLog(`{user} renamed instance '${instance?.name}' of equipment {equipment} to '${newInstance?.name}'`, 'admin', { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
        }

        if (instance?.status != newInstance?.status) {
          await createUnassocaitedAuditLog(`{user} changed status of '${newInstance?.name}' of equipment {equipment} to '${newInstance?.status}'`, 'admin', { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
        }

        return newInstance;
      }),


    /**
     * Update the hobbs time of an equipment instance
     * @argument instanceID ID of the instance to modify
     * @argument hobbsTime seconds of hobbs time to set
     */
    updateInstanceHobbsTime: async (
      _parent: any,
      args: {
        id: number,
        hobbsTime: number
      },
      { isStaff }: ApolloContext) =>
      isStaff(async (user) => {

        const instance = await InstanceRepo.getInstanceByID(args.id);
        if (!instance) throw new GraphQLError("Instance does not exist");

        const equipment = await EquipmentRepo.getEquipmentByID(instance.equipmentID);
        if (!equipment) throw new GraphQLError("Instance does not have associated Machine");

        const room = await RoomRepo.getRoomByID(equipment.roomID)
        if (!room) throw new GraphQLError("Instance does not have associated Room");
        const newInstance = await InstanceRepo.updateInstanceHobbsTime(args.id, args.hobbsTime);

        if (instance.accessControllerID) {
          const accessController = await ACRepo.getAccessControllerByID(instance.accessControllerID)

          if (accessController) {
            ACSOrchestrator.handleSendCoreCommand(accessController.deviceID, {
              hobbsTime: [{ channelID: accessController.channelID, hobbsTime: args.hobbsTime }]
            })
          } else {
            throw new GraphQLError("Could not find AccessController to update");
          }
        }

        await createAuditLog(`{user} set hobbs time of instance '${instance?.name}' of equipment {equipment} to ${args.hobbsTime} seconds from ${instance.hobbsTime} seconds`, 'admin', room.makerspaceID ?? undefined, { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });

        return newInstance;
      }),


    /**
   * Update the status field of an Equipment Instance
   * @argument id ID of equipment instance to modify
   * @argument status New Instance status
   * @returns updated equipment instance
   * @throws GraphQLError if not MENTOR or STAFF or is on hold or equipment instance does not exist
   */
    setInstanceStatus: async (
      _parent: any,
      args: { id: number, status: string },
      { isStaff }: ApolloContext) =>
      isStaff(async (user) => {
        const orig = await getInstanceByID(args.id);
        if (!orig) throw new GraphQLError("Instance does not exist");
        const equipment = await EquipmentRepo.getEquipmentByID(orig.equipmentID);
        if (!equipment) throw new GraphQLError("Equipment does not exist");
        const room = await RoomRepo.getRoomByID(equipment.roomID);
        if (!user.staff.includes(room?.makerspaceID ?? -1) && !user.manager.includes(room?.makerspaceID ?? -1) && !user.admin) {
          throw new GraphQLError(`Not Privileged for Makerspace ${room?.makerspaceID}`);
        }
        await createUnassocaitedAuditLog(`{user} changed instance "${orig.name}" status to "${args.status}" on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
        return await setInstanceStatus(args.id, args.status)
      }),

    /**
     * Update the name field of an Equipment Instance
     * @argument id ID of equipment instance to modify
     * @argument name New Instance name
     * @returns updated equipment instance
     * @throws GraphQLError if not MENTOR or STAFF or is on hold or equipment instance does not exist
     */
    setInstanceName: async (
      _parent: any,
      args: { id: number, name: string },
      { isManager }: ApolloContext) =>
      isManager(async (user) => {
        const orig = await getInstanceByID(args.id);
        if (!orig) throw new GraphQLError("Instance does not exist");
        const equipment = await EquipmentRepo.getEquipmentByID(orig.equipmentID);
        if (!equipment) throw new GraphQLError("Equipment does not exist");
        const room = await RoomRepo.getRoomByID(equipment.roomID);
        if (!user.manager.includes(room?.makerspaceID ?? -1) && !user.admin) {
          throw new GraphQLError(`Not Privileged for Makerspace ${room?.makerspaceID}`);
        }
        await createUnassocaitedAuditLog(`{user} changed instance "${orig.name}" name to "${args.name}" on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
        return await setInstanceName(args.id, args.name)
      }),

    /**
     * Delete an Equipment Instance
     * @argument id ID of equipment instance to delete
     * @returns new equipment instance
     * @throws GraphQLError if not MENTOR or STAFF or is on hold or equipment instance does not exist
     */
    deleteInstance: async (
      _parent: any,
      args: { id: number },
      { isManager }: ApolloContext
    ) => isManager(async (user) => {
      const orig = await getInstanceByID(args.id);
      if (!orig) throw new GraphQLError("Instance does not exist");
      const equipment = await EquipmentRepo.getEquipmentByID(orig.equipmentID);
      if (!equipment) throw new GraphQLError("Equipment does not exist");
      const room = await RoomRepo.getRoomByID(equipment.roomID);
      if (!user.manager.includes(room?.makerspaceID ?? -1) && !user.admin) {
        throw new GraphQLError(`Not Privileged for Makerspace ${room?.makerspaceID}`);
      }
      await createUnassocaitedAuditLog(`{user} deleted instance "${orig.name}" on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
      return await deleteInstance(args.id)
    }),

    updateInstanceControllerAssignment: async (
      _parent: any,
      args: {
        id: number,
        accessControllerID?: number
      },
      { isManager }: ApolloContext
    ) => isManager(async (_user) => (
      InstanceRepo.updateInstanceControllerAssignment(args.id, args.accessControllerID)
    ))
  }

};

export default EquipmentInstanceResolver;