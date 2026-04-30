import { createContext, ReactElement, useContext } from "react";
import { useQuery } from "@apollo/client/react";
import RequestWrapper2 from "./RequestWrapper2";
import { Navigate, useLocation } from "react-router-dom";
import { AccessCheck, GET_CURRENT_USER } from "../queries/userQueries";

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
  visitor: boolean; // frontend addition. routes.ts should make it so that this is only true on visitor pages and the current user is a real user in all other places
  id: string;
  ritUsername: string;
  firstName: string;
  lastName: string;
  setupComplete: boolean;
  balance: string;
  hasHolds: boolean;
  archived: boolean;
  passedModules: PassedModule[];
  accessChecks: AccessCheck[];
  cardTagID: string;
  trainingHolds: TrainingHold[];
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
  visitor: true,
  id: "-1",
  ritUsername: "",
  firstName: "",
  lastName: "",
  setupComplete: true,
  balance: "",
  hasHolds: false,
  passedModules: [],
  accessChecks: [],
  cardTagID: "nothing",
  trainingHolds: [],
  admin: false,
  archived: false,
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

export function useCurrentUser(): CurrentUser {
  const context = useContext(CurrentUserContext);

  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }

  return context;
}
