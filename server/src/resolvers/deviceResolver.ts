import { ApolloContext } from "../context.js";
import { AccessControllerRow, AccessControllerState, CoreRow, DispenserRow } from "../db/tables.js";
import * as DeviceRepo from "../repositories/Devices/DeviceRepository.js";
import * as ACRepo from "../repositories/Devices/AccessControllerRepository.js";
import * as InstanceRepo from "../repositories/Equipment/EquipmentInstancesRepository.js";
import * as UserRepo from "../repositories/Users/UserRepository.js";
import * as CoreRepo from "../repositories/Devices/CoreRepository.js";
import * as DispenserRepo from "../repositories/Devices/DispenserRepository.js";
import * as AuditLogRepo from "../repositories/AuditLogs/AuditLogRepository.js";
import { WSACSServerUnprompted } from "../models/api/WSACS/WSACSFormats.js";
import { EntityNotFound } from "../EntityNotFound.js";
import WSACSController from "../models/api/WSACS/WSACSController.js";
import { ACSOrchestrator } from "../models/api/ACSOrchestrator.js";
import { CoreActions, CoreFlags } from "../models/api/ACSFormats.js";

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
  },

  AccessController: {
    device: async (
      parent: AccessControllerRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      await DeviceRepo.getDeviceByID(parent.deviceID)
    )),

    core: async (
      parent: AccessControllerRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      await CoreRepo.getCoreByDeviceID(parent.deviceID)
    ))
  },

  Query: {
    getAccessControllerByID: async (
      _parent: any,
      args: {
        accessControllerID: number
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      await ACRepo.getAccessControllerByID(args.accessControllerID)
    )),

    getUnpairedAccessControllers: async (
      _parent: any,
      args: {
        makerspaceID: number
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      await ACRepo.getUnpairedAccessControllers(args.makerspaceID)
    )),

    getUnpairedCores: async (
      _parent: any,
      args: {
        makerspaceID: number
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async (_user) => (
      await CoreRepo.getUnpairedCores(args.makerspaceID)
    )),

    getPairedWelcomeCores: async (
      _parent: any,
      args: {
        makerspaceID: number
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async (_user) => (
      await CoreRepo.getMakerspaceWelcomeCores(args.makerspaceID)
    ))
  },

  Mutation: {
    // This should not be used, setting state should be done on the access controller level
    setCoreState: async (
      _parent: any,
      args: {
        deviceID: number,
        targetState: AccessControllerState
      },
      { isStaff }: ApolloContext
    ) => isStaff(async (user) => {
      const core = await CoreRepo.getCoreByDeviceID(args.deviceID);
      if (core === undefined) { return false; }
      await AuditLogRepo.createUnassocaitedAuditLog(
        `{user} commanded {device} to ${args.targetState}`,
        "admin",
        { id: user.id, label: `${user.firstName} ${user.lastName}` },
        { id: args.deviceID, label: core.name }
      );
      return await core.setState(user, args.targetState);
    }),

    pairGenericDevice: async (
      _parent: any,
      args: {
        SN: string,
        makerspaceID: number
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async (_user) => {
      const device = await DeviceRepo.pairNewDevice(args.SN, args.makerspaceID);
      return await device.generateKey();
    }),

    pairCore: async (
      _parent: any,
      args: {
        SN: string,
        makerspaceID: number
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async (_user) => {
      const newCore = await CoreRepo.pairNewCore(args.SN, args.makerspaceID);
      return await newCore.generateKey();
    }),

    pairDispenser: async (
      _parent: any,
      args: {
        SN: string,
        makerspaceID: number
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async (_user) => {
      const newDispenser = await DispenserRepo.pairNewDispenser(args.SN, args.makerspaceID);
      return await newDispenser.generateKey();
    }),

    sendCoreAction: async (
      _parent: any,
      args: {
        deviceID: number,
        action: CoreActions
      },
      { isManagerFor }: ApolloContext
    ) => {
      const core = await CoreRepo.getCoreByDeviceID(args.deviceID);
      if (core === undefined) {
        throw new EntityNotFound(`Core with ID: ${args.deviceID} not found`);
      }

      return isManagerFor(core.makerspaceID, async (_user) => {
        if (args.action === CoreActions.SEAL) {
          await core.sealDeployment();
        }

        await ACSOrchestrator.handleSendCoreCommand(args.deviceID, {
          action: args.action
        });
      })
    },

    sendCoreFlags: async (
      _parent: any,
      args: {
        deviceID: number,
        flags: CoreFlags
      },
      { isManagerFor }: ApolloContext
    ) => {
      const core = await CoreRepo.getCoreByDeviceID(args.deviceID);
      if (core === undefined) {
        throw new EntityNotFound(`Core with ID: ${args.deviceID} not found`);
      }

      return isManagerFor(core.makerspaceID, (_user) => {
        const command: WSACSServerUnprompted = {
          command: {
            flags: args.flags
          }
        };

        ACSOrchestrator.handleSendCoreCommand(args.deviceID, {
          flags: args.flags
        })
        return WSACSController.sendCoreRequest(command, args.deviceID);
      })
    },

    pairWelcomeDevice: async (
      _parent: any,
      args: {
        deviceID: number,
        makerspaceID: number
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async (user) => {
      const result = await DeviceRepo.pairWelcomeDevice(args.deviceID, args.makerspaceID);

      const core = await CoreRepo.getCoreByDeviceID(args.deviceID);
      if (core !== undefined) {
        core.setFlags({
          lockWhenIdle: core.flags.lockWhenIdle,
          restartWhenUnused: core.flags.restartWhenUnused,
          welcoming: true
        });
      }

      return result;
    }),

    unpairWelcomeDevice: async (
      _parent: any,
      args: {
        deviceID: number,
        makerspaceID: number
      },
      { isManagerFor }: ApolloContext
    ) => isManagerFor(args.makerspaceID, async (user) => {
      await DeviceRepo.unpairWelcomeDevice(args.deviceID, args.makerspaceID)

      const core = await CoreRepo.getCoreByDeviceID(args.deviceID);
      if (core !== undefined) {
        core.setFlags({
          lockWhenIdle: core.flags.lockWhenIdle,
          restartWhenUnused: core.flags.restartWhenUnused,
          welcoming: false
        });
      }
    })
  }
};

export default DeviceResolver;