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

export const GET_ALL_TRAINING_MODULES = gql`
  query GetAllTrainingModules {
    modules {
      id
      name
    }
  }
`;

export default function TrainingPage() {
  const { passedModules } = useCurrentUser();
  const result = useQuery(GET_ALL_TRAINING_MODULES);
  const [searchText, setSearchText] = useState("");

  return (
    <RequestWrapper2
      result={result}
      render={({ modules }) => {
        const moduleStatuses = modules.map(moduleStatusMapper(passedModules));

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

        const reordered = [...expired, ...passed, ...notTaken];

        return (
          <Page title="Training" maxWidth="736px">
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
