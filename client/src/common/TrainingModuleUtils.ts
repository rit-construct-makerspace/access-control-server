import { PassedModule, TrainingHold } from "./CurrentUserProvider";
import { differenceInMonths, differenceInYears, parseISO } from "date-fns";

export interface ModuleStatus {
  moduleID: string;
  moduleName: string;
  status: "Passed" | "Expired" | "Not taken" | "Expiring Soon" | "Locked";
  submissionDate: string;
  expirationDate: string;
}

export interface TrainingModule {
  id: string;
  name: string;
  isLocked?: boolean;
  makerspaceID: number | null;
}

export const moduleStatusMapper =
  (passedModules: PassedModule[], trainingHolds: TrainingHold[]) =>
    (module: TrainingModule): ModuleStatus => {
      const passedModule = passedModules.find((pm) => pm.moduleID === module.id);
      const hold = trainingHolds.find((hold) => hold.moduleID.toString() === module.id);

      if ((hold || module.isLocked) && !passedModule)
        return {
          moduleID: module.id,
          moduleName: module.name,
          status: "Locked",
          submissionDate: "",
          expirationDate: "",
        };
      if (!passedModule)
        return {
          moduleID: module.id,
          moduleName: module.name,
          status: "Not taken",
          submissionDate: "",
          expirationDate: "",
        };

      const submissionDate = parseISO(passedModule.passedDate);
      const expirationDate = new Date(submissionDate);
      expirationDate.setFullYear(submissionDate.getFullYear() + 1);
      const expiringSoon = differenceInMonths(expirationDate, new Date()) <= 1; //differenceInMonths(new Date(), submissionDate) > 11 && differenceInMonths(new Date(), submissionDate) < 12;
      const expired = differenceInYears(submissionDate, new Date()) > 0;

      if (expiringSoon)
        return {
          moduleID: module.id,
          moduleName: module.name,
          status: "Expiring Soon",
          submissionDate: submissionDate.toDateString(),
          expirationDate: expirationDate.toDateString(),
        }

      return {
        moduleID: module.id,
        moduleName: module.name,
        status: expired ? "Expired" : "Passed",
        submissionDate: submissionDate.toDateString(),
        expirationDate: expirationDate.toDateString(),
      };
    };
