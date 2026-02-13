import { ApolloContext } from "../context.js";
import { CoreRow, DispenserRow } from "../db/tables.js";
import * as DeviceRepo from "../repositories/Devices/DeviceRepository.js";

const DeviceResolver = {
  Core: {
    device: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      await DeviceRepo.getDeviceByID(parent.deviceID)
    )),
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