import { ApolloContext } from "../context.js";
import { AccessControllerRow, AccessControllerState, CoreRow, DispenserRow } from "../database/knex/tables.js";
import * as DeviceRepo from "../database/repositories/Devices/DeviceRepository.js";
import * as ACRepo from "../database/repositories/Devices/AccessControllerRepository.js";
import * as InstanceRepo from "../database/repositories/Equipment/EquipmentInstancesRepository.js";
import * as UserRepo from "../database/repositories/Users/UserRepository.js";
import * as CoreRepo from "../database/repositories/Devices/CoreRepository.js";
import * as DispenserRepo from "../database/repositories/Devices/DispenserRepository.js";
import * as EquipmentRepo from "../database/repositories/Equipment/EquipmentRepository.js";
import * as AuditLogRepo from "../database/repositories/AuditLogs/AuditLogRepository.js";
import { WSACSServerUnprompted } from "../database/models/api/WSACS/WSACSFormats.js";
import { EntityNotFound } from "../EntityNotFound.js";
import WSACSController from "../database/models/api/WSACS/WSACSController.js";
import { ACSOrchestrator } from "../database/models/api/ACSOrchestrator.js";
import { CoreActions, CoreFlags } from "../database/models/api/ACSFormats.js";
import { GraphQLError } from "graphql";

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
    )),

    controllers: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
      ACRepo.getAccessControllersByDeviceID(parent.deviceID)
    )),

    sealedDeployment: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff((_user) => (
      JSON.stringify(parent.sealedDeployment, undefined, 1)
    )),

    reportedDeployment: async (
      parent: CoreRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff((_user) => (
      JSON.stringify(parent.reportedDeployment, undefined, 1)
    ))
  },

  Dispenser: {
    device: async (
      parent: DispenserRow,
      _args: any,
      { isStaff }: ApolloContext
    ) => isStaff(async (_user) => (
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
      await AuditLogRepo.createAuditLog(
        `{user} commanded {device} to ${args.targetState}`,
        "admin",
        core.makerspaceID,
        { id: user.id, label: `${user.firstName} ${user.lastName}` },
        { id: args.deviceID, label: core.name }
      );
      return await core.setState(user, args.targetState);
    }),

    commandAccessControllerState: async (
      _parent: any,
      args: {
        accessControllerID: number,
        targetState: AccessControllerState
      },
      { isStaffFor }: ApolloContext
    ) => {
      const controller = await ACRepo.getAccessControllerByID(args.accessControllerID);
      if (controller === undefined) { throw new EntityNotFound(`Access Controller ${args.accessControllerID} not found`); }

      const core = await CoreRepo.getCoreByDeviceID(controller.deviceID);
      if (core === undefined) { throw new EntityNotFound(`Core for Acccess Controller ${args.accessControllerID} not found`); }

      const instance = await InstanceRepo.getInstanceByAccessControllerID(controller.id);
      const equipment = await EquipmentRepo.getEquipmentByID(instance?.equipmentID ?? -1);

      return await isStaffFor(core.makerspaceID, async (user) => {
        const result = await controller.canControl(user.id, args.targetState);
        if (result.canControl) {
          ACSOrchestrator.handleSendCoreCommand(core.deviceID, {
            toState: [{
              id: controller.channelID,
              state: args.targetState
            }]
          })
          await AuditLogRepo.createAuditLog(
            `{user} commanded {equipment} to ${args.targetState}`,
            "admin",
            core.makerspaceID,
            { id: user.id, label: `${user.firstName} ${user.lastName}` },
            { id: equipment?.id, label: `${equipment?.name} - ${instance?.name}` }
          )
        } else {
          await AuditLogRepo.createAuditLog(
            `{user} failed to command {equipment} to ${args.targetState} due to ${result.reason}`,
            "admin",
            core.makerspaceID,
            { id: user.id, label: `${user.firstName} ${user.lastName}` },
            { id: equipment?.id, label: `${equipment?.name} - ${instance?.name}` }
          )
        }

        return result.canControl;

      })
    },

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
      const device = await DeviceRepo.getDeviceBySN(args.SN);
      if (device !== undefined) {
        if (device.makerspaceID !== args.makerspaceID) {
          throw new GraphQLError(`Insufficent priviledge! Tried to cycle key of device paired in another makerspace.`);
        }
        const core = await CoreRepo.cycleCoreKey(device.id);
        return await core.generateKey();
      } else {
        const newCore = await CoreRepo.pairNewCore(args.SN, args.makerspaceID);
        return await newCore.generateKey();
      }
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
    ) => isManagerFor(args.makerspaceID, async (_user) => {
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
    ) => isManagerFor(args.makerspaceID, async (_user) => {
      await DeviceRepo.unpairWelcomeDevice(args.deviceID, args.makerspaceID)

      const core = await CoreRepo.getCoreByDeviceID(args.deviceID);
      if (core !== undefined) {
        core.setFlags({
          lockWhenIdle: core.flags.lockWhenIdle,
          restartWhenUnused: core.flags.restartWhenUnused,
          welcoming: false
        });
      }
    }),

    unpairCore: async (
      _parent: any,
      args: {
        deviceID: number
      },
      { isManagerFor }: ApolloContext
    ) => {
      const core = await CoreRepo.getCoreByDeviceID(args.deviceID);
      if (core === undefined) { throw new EntityNotFound(`Core ${args.deviceID} does not exist`) }
      return await isManagerFor(core.makerspaceID, async (user) => {
        await CoreRepo.unpairCore(args.deviceID);
        AuditLogRepo.createAuditLog(
          `{user} unpaired core ${args.deviceID}: ${core.name} from Make`,
          "admin",
          core.makerspaceID,
          { id: user.id, label: `${user.firstName} ${user.lastName}` }
        );
      })
    }
  },
};

export default DeviceResolver;