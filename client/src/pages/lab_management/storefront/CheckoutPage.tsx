import { useQuery } from "@apollo/client";
import { Alert, Autocomplete, TextField } from "@mui/material";
import { Stack } from "@mui/system";
import { GET_USERS_LIMIT } from "../../../queries/userQueries";
import { useState } from "react";

export default function CheckoutPage(){
    const [userQuery, setUserQuery] = useState("")
    const getUsersResult = useQuery(GET_USERS_LIMIT, {variables: {searchText: userQuery}})
    return <Stack direction="column">
        <title>Checkout | Make @ RIT</title>
        asdfghjkl
        <Autocomplete
          renderInput={(params: any) => <TextField {...params} label="User" />}
          size="small"
          options={getUsersResult.data ?? []}
          onChange={(_, val) => setUserQuery(val?? "")}
          value={userQuery}
          fullWidth
          loading={getUsersResult.loading}
        />

        <Alert>Make sure to update the inventory when you grab items from the shelf</Alert>
    </Stack>
}