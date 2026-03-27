import { ACSController } from "./ACSController.js";
import { CoreAuthToRequest, CoreConfigReport, CoreInfoRequest, CoreLogRequest, CoreStateChangeReport, CoreStatusReport } from "./ACSFormats.js";

export class ACSOrchestrator {
  private static coreControllers: Map<number, ACSController> = new Map();

  public registerDevice(deviceID: number, controller: ACSController) {
    ACSOrchestrator.coreControllers.set(deviceID, controller);
  }

  public getCoreController(deviceID: number): ACSController | undefined {
    return ACSOrchestrator.coreControllers.get(deviceID);
  }

  public async handleCoreStatusReport(deviceID: number, statusReport: CoreStatusReport) {

  }

  public async handleCoreStateChangeReport(deviceID: number, stateChangeReport: CoreStateChangeReport) {

  }

  public async handleCoreLogRequest(deviceID: number, logRequest: CoreLogRequest) {

  }

  public async handleCoreAuthToRequest(deviceID: number, authToRequest: CoreAuthToRequest) {

  }

  public async handleCoreConfigReport(deviceID: number, configReport: CoreConfigReport) {

  }

  public async handleCoreInfoRequest(deviceID: number, infoRequest: CoreInfoRequest) {

  }
}