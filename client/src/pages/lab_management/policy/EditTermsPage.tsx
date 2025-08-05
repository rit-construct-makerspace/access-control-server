import { gql, useMutation, useQuery } from "@apollo/client";
import { Button, TextareaAutosize } from "@mui/material";
import { useState } from "react";
import RequestWrapper from "../../../common/RequestWrapper";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isAdmin } from "../../../common/PrivilegeUtils";

const GET_TERMS_TEXT = gql`
    query GetTermsText {
        getTerms
    }
`;

const SET_TERMS_TEXT = gql`
    mutation SetTermsText($value: String) {
        setTerms(value: $value)
    }
`;

export default function EditTermsPage() {
    const text = useQuery(GET_TERMS_TEXT);
    const [edit] = useMutation(SET_TERMS_TEXT, {refetchQueries: [{query: GET_TERMS_TEXT}]});
    const currentUser = useCurrentUser();

    const [editText, setEditText] = useState<string>();

    return (
        <RequestWrapper loading={text.loading} error={text.error}>
            <>
                {isAdmin(currentUser) &&
                    <>
                        <TextareaAutosize
                            style={{ background: "none", fontFamily: "Roboto", fontSize: "1em", lineHeight: "2em", marginTop: "2em", marginBottom: "2em" }}
                            defaultValue={text.data?.getTerms}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                        ></TextareaAutosize>
                        <Button
                            variant="contained"
                            onClick={() => edit({ variables: { value: editText } })}
                            sx={{ mt: 8, alignSelf: "flex-end" }}
                        >
                            Update
                        </Button>
                    </>}
            </>
        </RequestWrapper>
    );
}
