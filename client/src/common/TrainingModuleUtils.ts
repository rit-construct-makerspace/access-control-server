import { PassedModule, TrainingHold } from "./CurrentUserProvider";
import { differenceInMonths, differenceInYears, parseISO } from "date-fns";

export interface ModuleStatus {
  moduleID: number;
  moduleName: string;
  archived: boolean;
  status: "Passed" | "Expired" | "Not taken" | "Expiring Soon" | "Locked";
  submissionDate: string;
  expirationDate: string;
}

export interface TrainingModule {
  id: number;
  name: string;
  archived: boolean;
  isLocked?: boolean;
  makerspaceID: number | null;
}

/**
 * This constant returns a function that maps a TrainingModule to a ModuleStatus based on the user's passed modules and
 * training holds.
 */
export const moduleStatusMapper =
  (passedModules: PassedModule[], trainingHolds: TrainingHold[]) =>
    (module: TrainingModule): ModuleStatus => {
      const passedModule = passedModules.find((pm) => pm.moduleID === module.id);
      const hold = trainingHolds.find((hold) => hold.moduleID === module.id);

      if ((hold || module.isLocked) && !passedModule)
        return {
          moduleID: module.id,
          moduleName: module.name,
          archived: module.archived,
          status: "Locked",
          submissionDate: "",
          expirationDate: "",
        };
      if (!passedModule)
        return {
          moduleID: module.id,
          moduleName: module.name,
          archived: module.archived,
          status: "Not taken",
          submissionDate: "",
          expirationDate: "",
        };

      const submissionDate = parseISO(passedModule.passedDate);
      const expirationDate = new Date(submissionDate);
      expirationDate.setFullYear(submissionDate.getFullYear() + 1);
      const expiringSoon = differenceInMonths(expirationDate, new Date()) <= 1; // differenceInMonths(new Date(), submissionDate) > 11 && differenceInMonths(new Date(), submissionDate) < 12;
      const expired = differenceInYears(submissionDate, new Date()) > 0;

      if (expiringSoon)
        return {
          moduleID: module.id,
          moduleName: module.name,
          archived: module.archived,
          status: "Expiring Soon",
          submissionDate: submissionDate.toDateString(),
          expirationDate: expirationDate.toDateString(),
        };

      return {
        moduleID: module.id,
        moduleName: module.name,
        archived: module.archived,
        status: expired ? "Expired" : "Passed",
        submissionDate: submissionDate.toDateString(),
        expirationDate: expirationDate.toDateString(),
      };
    };
