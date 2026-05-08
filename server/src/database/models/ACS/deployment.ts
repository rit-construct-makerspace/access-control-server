import { ACSComponent } from "./component.js"

export interface ACSDeployment {
  SN: string // Core Serial Number
  components?: ACSComponent[];
}