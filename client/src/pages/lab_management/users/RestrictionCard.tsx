import gql from "graphql-tag";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { Button, Card, CardActions, CardContent, CardHeader, Stack, Typography, useTheme } from "@mui/material";
import { useMutation } from "@apollo/client/react";
import { format, parseISO } from "date-fns";
import { isStaffFor } from "../../../common/PrivilegeUtils";
import { GET_USER, Restriction } from "../../../queries/userQueries";

interface RestrictionCardProps {
    restriction: Restriction;
    userID: string;
}

const DELETE_RESTRICTION = gql`
    mutation DeleteRestriction($id: ID!) {
        deleteRestriction(id: $id)
    } 
`;

export default function RestrictionCard(props: RestrictionCardProps) {
    const currentUser = useCurrentUser();
    const theme = useTheme();

    const [deleteRestriction] = useMutation(DELETE_RESTRICTION,
        {
            variables: {id: props.restriction.id},
            refetchQueries: [{ query: GET_USER, variables: { id: props.userID } }],
        }
    )

    return (
        <Card
            sx={{
                backgroundColor: theme.palette.warning.light,
                color: theme.palette.warning.contrastText
            }}
        >
            <CardHeader title={`Restricted in ${props.restriction.makerspace.name}`}/>
            <CardContent>
                <Typography variant="body1">
                    {props.restriction.reason}
                </Typography>
            </CardContent>
            <CardActions>
                <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%" marginLeft="10px">
                    <Typography fontStyle="italic">
                        Placed by {props.restriction.creator.firstName} {props.restriction.creator.lastName} on {format(parseISO(props.restriction.createDate), "M/d/yy h:mmaaa")}
                    </Typography>
                    {
                        isStaffFor(currentUser, props.restriction.makerspace.id)
                        ? <Button
                            variant="contained"
                            color="error"
                            onClick={() => deleteRestriction()}
                        >
                            Lift Restriction
                        </Button>
                        : null
                    }
                </Stack>
            </CardActions>
        </Card>
    );
}