import { ApolloContext } from "../context.js";
import { CoreRow, DispenserRow } from "../db/tables.js";
import * as DeviceRepo from "../repositories/Devices/DeviceRepository.js";
import * as ACRepo from "../repositories/Devices/AccessControllerRepository.js";
import * as InstanceRepo from "../repositories/Equipment/EquipmentInstancesRepository.js";

const DeviceResolver = {
  Core: {
    device: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      await DeviceRepo.getDeviceByID(parent.deviceID)
    )),

    instance: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => {
      const controllers = await ACRepo.getAccessControllersByDeviceID(parent.deviceID);
      if (controllers.length > 1 || controllers.length === 0) { return undefined; }
      return await InstanceRepo.getInstanceByAccessControllerID(controllers[1].id);
    }),

    welcomeSpace: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      await DeviceRepo.getMakerspaceOfWelcomeDevice(parent.deviceID)
    ))
  },

  Dispenser: {
    device: async (
      parent: DispenserRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => (
      await DeviceRepo.getDeviceByID(parent.deviceID)
    )),
  }
};

export default DeviceResolver;