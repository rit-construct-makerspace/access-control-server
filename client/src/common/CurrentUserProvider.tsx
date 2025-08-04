import { createContext, ReactElement, useContext } from "react";
import { gql, useQuery } from "@apollo/client";
import RequestWrapper2 from "./RequestWrapper2";
import { Navigate, useLocation } from "react-router-dom";
import Privilege from "../types/Privilege";
import { AccessCheck } from "../pages/lab_management/users/UserModal";

const loginUrl = process.env.REACT_APP_LOGIN_URL ?? "/";

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      id
      ritUsername
      firstName
      lastName
      privilege
      setupComplete
      admin
      holds {
        removeDate
      }
      passedModules {
        moduleID
        moduleName
        passedDate
      }
      accessChecks {
        equipmentID
        approved
      }
      cardTagID
      trainingHolds {
        moduleID
        expires
      }
      manager
      staff
      trainer
      currencyAccount{
        id
        balance
      }
    }
  }
`;

export interface PassedModule {
  moduleID: number;
  moduleName: string;
  passedDate: string;
}

export interface TrainingHold {
  moduleID: number;
  expires: Date;
}

export interface CurrentUser {
  id: string;
  ritUsername: string;
  firstName: string;
  lastName: string;
  privilege: Privilege;
  setupComplete: boolean;
  balance: string;
  hasHolds: boolean;
  passedModules: PassedModule[];
  accessChecks: AccessCheck[];
  cardTagID: string;
  trainingHolds: TrainingHold[];
  visitor: boolean;
  admin: boolean;
  manager: number[];
  staff: number[];
  trainer: number[];
}

const CurrentUserContext = createContext<CurrentUser | undefined>(undefined);

function mapUser(data: any): CurrentUser | undefined {
  if (!data?.currentUser) return undefined;

  const hasHolds = data.currentUser.holds.some(
    (hold: { removeDate: string }) => !hold.removeDate
  );

  //const hasCardTag = data.currentUser.cardTagID != null && data.currentUser.cardTagID != "";

  return {
    ...data.currentUser,
    hasHolds,
    //hasCardTag,
  };
}

interface CurrentUserProviderProps {
  children: ReactElement;
}

const visitor: CurrentUser = {
  id: "-1",
  ritUsername: "",
  firstName: "",
  lastName: "",
  privilege: Privilege.VISITOR,
  setupComplete: true,
  balance: "",
  hasHolds: false,
  passedModules: [],
  accessChecks: [],
  cardTagID: "nothing",
  trainingHolds: [],
  visitor: true,
  admin: false,
  manager: [],
  staff: [],
  trainer: []
}

export function CurrentUserProvider({ children }: CurrentUserProviderProps) {
  const result = useQuery(GET_CURRENT_USER);
  const location = useLocation();

  // If the current user is null, redirect to SSO login
  // if (
  //   result &&
  //   !result.loading &&
  //   !result.data?.currentUser
  // ) {
  //   window.location.replace(loginUrl);
  //   return null;
  // }

  // If the user exists but setupComplete is false,
  // redirect to them to the signup form
  if (
    result.data?.currentUser &&
    !result.data.currentUser.setupComplete &&
    !location.pathname.includes("/signup")
  ) {
    return <Navigate to={"/signup"} />;
  }

  return (
    <CurrentUserContext.Provider value={result.data?.currentUser ? mapUser(result.data) : visitor}>
      <RequestWrapper2 result={result} render={() => children} />
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);

  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }

  return context;
}
