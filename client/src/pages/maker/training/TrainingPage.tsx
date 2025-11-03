import React, { useState } from "react";
import Page from "../../Page";
import Explainer from "./Explainer";
import { gql, useQuery } from "@apollo/client";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import {
  ModuleStatus,
  moduleStatusMapper,
} from "../../../common/TrainingModuleUtils";
import TrainingModuleRow from "../../../common/TrainingModuleRow";
import SearchBar, { searchFilter } from "../../../common/SearchBar";
import { GET_ALL_TRAINING_MODULES } from "../../../queries/trainingQueries";

/**
 * This function returns a page that displays all training modules with their statuses for the current user, along with
 * a search bar to filter the modules.
 *
 * @returns A page that displays all training modules with their statuses for the current user, along with a search bar
 * to filter the modules.
 */
export default function TrainingPage() {
  const { passedModules, trainingHolds } = useCurrentUser();
  const result = useQuery(GET_ALL_TRAINING_MODULES);
  const [searchText, setSearchText] = useState("");

  return (
    <RequestWrapper2
      result={result}
      render={({ modules }) => {
        const moduleStatuses = modules.map(
          moduleStatusMapper(passedModules, trainingHolds)
        );

        const matching = searchFilter<ModuleStatus>(
          searchText,
          moduleStatuses,
          (ms: ModuleStatus) => ms.moduleName
        );

        const expired = matching.filter(
          (ms: ModuleStatus) => ms.status === "Expired"
        );
        const passed = matching.filter(
          (ms: ModuleStatus) => ms.status === "Passed"
        );
        const notTaken = matching.filter(
          (ms: ModuleStatus) => ms.status === "Not taken"
        );
        const locked = matching.filter(
          (ms: ModuleStatus) => ms.status === "Locked"
        );

        const reordered = [...expired, ...passed, ...locked, ...notTaken];

        return (
          <Page title="Training" maxWidth="1250px">
            <Explainer />

            <SearchBar
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClear={() => setSearchText("")}
              sx={{ mt: 8, mb: 1 }}
            />

            {reordered.map((ms: ModuleStatus) => (
              <TrainingModuleRow key={ms.moduleID} moduleStatus={ms} />
            ))}
          </Page>
        );
      }}
    />
  );
}
