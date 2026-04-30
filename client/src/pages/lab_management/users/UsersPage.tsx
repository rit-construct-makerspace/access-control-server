import { useEffect, useMemo, useState } from "react";
import SearchBar from "../../../common/SearchBar";
import { Box, Button, Stack, Typography } from "@mui/material";
import UserCard from "./UserCard";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import { GET_NUM_USERS, GET_USERS_LIMIT, PartialUser } from "../../../queries/userQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

export default function UsersPage() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const { search } = useLocation();
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();

  const [query, queryResult] = useLazyQuery(GET_USERS_LIMIT);
  const numUsersResult = useQuery(GET_NUM_USERS);

  const [searchText, setSearchText] = useState("");

  const setUrlParam = (paramName: string, paramValue: string) => {
    const params = new URLSearchParams(search);
    params.set(paramName, paramValue);
    navigate(`/makerspace/${makerspaceID}/people?` + params, { replace: true });
  };


  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const queryString = searchParams.get("q") ?? "";

    setSearchText(queryString);

    query({
      variables: {
        searchText: queryString,
      },
    });
  }, [search, query]);

  function generateUserStack() {
    const safeUsers = queryResult.data?.usersLimit.slice() ?? [];
    return <Stack direction="row" flexWrap="wrap" justifyContent="center">
      {safeUsers?.map((user: PartialUser) => (
        <UserCard
          user={user}
          key={user.id}
          onClick={() => navigate(`/makerspace/${makerspaceID}/people/` + user.id)}
        />
      ))}
    </Stack>
  }

  const userStack = useMemo(generateUserStack, [makerspaceID, navigate, queryResult.data])

  return (
    <Box margin="10px 25px">
      <title>{`People | ${makeTheme.title}`}</title>
      <Typography variant="h4" sx={{ mb: 2 }}>People</Typography>
      <Stack direction={"row"} spacing={1} sx={{ mb: 2 }}>
        <SearchBar
          placeholder={"Search " + numUsersResult.data?.numUsers.count + " users"}
          sx={{ maxWidth: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClear={() => setSearchText("")}
          onSubmit={() => setUrlParam("q", searchText)}
        />
        <Button onClick={(_e) => setUrlParam("q", searchText)} variant="contained" color="primary">Search</Button>
      </Stack>

      <RequestWrapper
        loading={queryResult.loading}
        error={queryResult.error}
      >
        {userStack}
      </RequestWrapper >
      <p>This page is limited to 100 users. Consider narrowing your search.</p>
    </Box>
  );
}
