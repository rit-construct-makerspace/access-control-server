import { useEffect, useState } from "react";
import SearchBar from "../../../common/SearchBar";
import { Box, Button, Stack, Typography } from "@mui/material";
import UserCard from "./UserCard";
import { useLazyQuery, useQuery } from "@apollo/client";
import { GET_NUM_USERS, GET_USERS_LIMIT, PartialUser } from "../../../queries/getUsers";
import RequestWrapper from "../../../common/RequestWrapper";
import UserModal from "./UserModal";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminPage from "../../AdminPage";

export default function UsersPage() {
  const { makerspaceID, userID } = useParams<{ makerspaceID: string, userID: string }>();
  const { search } = useLocation();
  const navigate = useNavigate();
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


  const handleUserModalClosed = () => {
    navigate(`/makerspace/${makerspaceID}/people`);
  };

  const safeUsers = queryResult.data?.usersLimit.slice() ?? [];

  return (
    <RequestWrapper
      loading={queryResult.loading}
      error={queryResult.error}
    >
      <Box margin="25px">
        <title>People | Make @ RIT</title>
      <Typography variant="h4">People</Typography>
      <Stack direction={"row"} spacing={1} sx={{mb: 2}}>
        <SearchBar 
          placeholder={"Search " + numUsersResult.data?.numUsers.count + " users"}
          sx={{ maxWidth: 300 }} 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClear={() => setSearchText("")}
          onSubmit={() => setUrlParam("q", searchText)}
        />
        <Button onClick={(e) => setUrlParam("q", searchText)} variant="contained" color="primary">Search</Button>
      </Stack>
      <Stack direction="row" flexWrap="wrap" justifyContent="center">
        {safeUsers
          // .filter((m: { id: number; ritUsername: String; firstName: string; lastName: string }) =>
          //   (m.firstName + " " + m.lastName + " " + m.ritUsername)
          //     .toLocaleLowerCase()
          //     .includes(searchText.toLocaleLowerCase())
          // )
          ?.map((user: PartialUser) => (
          <UserCard
            user={user}
            key={user.id}
            onClick={() => navigate(`/makerspace/${makerspaceID}/people/` + user.id)}
          />
        ))}
      </Stack>
      <p>This page is limited to 100 users. Consider narrowing your search.</p>

      <UserModal selectedUserID={userID ?? ""} onClose={handleUserModalClosed} />
      </Box>
    </RequestWrapper>
  );
}
