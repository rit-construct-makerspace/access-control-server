import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import * as InstanceRepo from "../repositories/Equipment/EquipmentInstancesRepository.js";
import * as RoomRepo from "../repositories/Rooms/RoomRepository.js"
import { ApolloContext } from "../context.js";
import { EquipmentInstancesRow } from "../db/tables.js";
import { createInstance, deleteInstance, getInstanceByID, getInstancesByEquipment, setInstanceName, setInstanceStatus } from "../repositories/Equipment/EquipmentInstancesRepository.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { GraphQLError } from "graphql";
import { getReaderByID } from "../repositories/Readers/ReaderRepository.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";

const EquipmentInstanceResolver = {
  EquipmentInstance: {
    //Fetch full data for equipment field
    equipment: async (
      parent: EquipmentInstancesRow,
      _args: any,
      _context: ApolloContext) => {
      return EquipmentRepo.getEquipmentByID(Number(parent.equipmentID));
    },
    //Fetch full data for equipment field
    reader: async (
      parent: EquipmentInstancesRow,
      _args: any,
      _context: ApolloContext) => {
      return getReaderByID(Number(parent.readerID));
    },
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
      { isStaff }: ApolloContext) =>
      isStaff(async () => {
        return await InstanceRepo.getReaderByInstanceId(args.instanceID)
      }),

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
      args: { equipmentID: number, name: string },
      { isManager }: ApolloContext) =>
      isManager(async (user) => {
        const equipment = await EquipmentRepo.getEquipmentByID(args.equipmentID);
        if (!equipment) throw new GraphQLError("Equipment does not exist");
        await createLog(`{user} created instance "${args.name}" on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
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
      args: { id: number, name: string, status: string, readerID: number | null },
      { isStaff }: ApolloContext) =>
      isStaff(async (user) => {

        const instance = await InstanceRepo.getInstanceByID(args.id);

        if (!instance) throw new GraphQLError("Instance does not exist");

        const equipment = await EquipmentRepo.getEquipmentByID(instance.equipmentID);
        if (!equipment) throw new GraphQLError("Instance does not have associate Machine");

        const newInstance = await InstanceRepo.updateInstance(args.id, args.name, args.status, args.readerID);

        if (instance?.name != newInstance?.name) {
          await createLog(`{user} renamed instance '${instance?.name}' of equipment {equipment} to '${newInstance?.name}'`, 'admin', { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
        }

        if (instance?.status != newInstance?.status) {
          await createLog(`{user} changed status of '${newInstance?.name}' of equipment {equipment} to '${newInstance?.status}'`, 'admin', { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
        }

        var oldReader = null;
        if (instance?.readerID) {
          oldReader = await getReaderByID(instance.readerID);
        }

        var newReader = null;
        if (args.readerID == oldReader?.id) {
          newReader = oldReader;
        } if (args.readerID && args.readerID != args.id) {
          newReader = await getReaderByID(args.readerID);
        }
        if (newReader == null && oldReader != null) {
          await createLog(`{user} unpaired {access_device} from instance {equipment}: ${newInstance?.name}`, 'admin', { id: user.id, label: getUsersFullName(user) }, { id: oldReader.id, label: oldReader?.name ?? "unknown reader" }, { id: equipment.id, label: equipment.name });
        } else if (newReader != null && oldReader?.id != newReader?.id) {
          await createLog(`{user} paired {access_device} to {equipment}: ${newInstance?.name}`, 'admin', { id: user.id, label: getUsersFullName(user) }, { id: newReader?.id, label: newReader?.name ?? "unknown reader" }, { id: equipment.id, label: equipment.name });
        }

        if (newInstance?.readerID) {
          newInstance.readerID = Number(newInstance.readerID)
        }

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
        await createLog(`{user} changed instance "${orig.name}" status to "${args.status}" on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
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
        await createLog(`{user} changed instance "${orig.name}" name to "${args.name}" on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
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
        await createLog(`{user} deleted instance "${orig.name}" on {equipment}`, "admin", { id: user.id, label: getUsersFullName(user) }, { id: equipment.id, label: equipment.name });
        return await deleteInstance(args.id)
      }),
    assignReaderToEquipmentInstance: async (
      _parent: any,
      args: { instanceId: number, readerId: number | undefined },
      { isStaff }: ApolloContext) =>
      isStaff(async (user) => {

        return InstanceRepo.assignReaderToEquipmentInstance(args.instanceId, args.readerId);
      }),
  }

};

export default EquipmentInstanceResolver;