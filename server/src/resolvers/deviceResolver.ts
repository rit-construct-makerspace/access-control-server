import { ApolloContext } from "../context.js";
import { CoreRow, DispenserRow } from "../db/tables.js";
import * as DeviceRepo from "../repositories/Devices/DeviceRepository.js";
import * as ACRepo from "../repositories/Devices/AccessControllerRepository.js";
import * as InstanceRepo from "../repositories/Equipment/EquipmentInstancesRepository.js";
import * as UserRepo from "../repositories/Users/UserRepository.js";
import * as CoreRepo from "../repositories/Devices/CoreRepository.js";

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
      if (controllers.length !== 1) { return undefined; }
      return await InstanceRepo.getInstanceByAccessControllerID(controllers[0].id);
    }),

    welcomeSpace: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      await DeviceRepo.getMakerspaceOfWelcomeDevice(parent.deviceID)
    )),

    activeUser: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => {
      if (parent.currentCardTag !== undefined) {
        return await UserRepo.getUserByCardTagID(parent.currentCardTag)
      }

      return undefined;
    }),
    state: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      CoreRepo.getCoreState(parent.deviceID)
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