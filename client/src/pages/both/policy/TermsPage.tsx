import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Page from "../../Page";
import {Button} from "@mui/material";
import {useNavigate} from "react-router-dom";
import RequestWrapper from "../../../common/RequestWrapper";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isAdmin } from "../../../common/PrivilegeUtils";
import ThemedMarkdown from "../../../common/ThemedMarkdown";

const GET_TERMS_TEXT = gql`
    query GetTermsText {
        getTerms
    }
`;

export default function TermsPage() {
    const text = useQuery(GET_TERMS_TEXT);
    const currentUser = useCurrentUser();
    const navigate = useNavigate();

    return (
        <Page title="Terms and Conditions" maxWidth="1250px"
        topRightAddons={isAdmin(currentUser) &&
            <Button variant="outlined" onClick={() => navigate('/admin/terms') }>Edit</Button>
        }>
            <RequestWrapper loading={text.loading} error={text.error}>
                <ThemedMarkdown>{text.data?.getTerms}</ThemedMarkdown>
            </RequestWrapper>
        </Page>
    );
}
