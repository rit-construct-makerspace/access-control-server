import { Button, Card, CardActions, Stack } from "@mui/material";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import AuditLogEntity from "../audit_logs/AuditLogEntity";
import { AccessCheckExtraInfo, GET_USER } from "../../../queries/userQueries";
import { useIsMobile } from "../../../common/IsMobileProvider";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const APPROVE_CHECK = gql`
  mutation ApproveAccessCheck($id: ID!) {
    approveAccessCheck(id: $id) {
      id
    }
  }
`;

const UNAPPROVE_CHECK = gql`
  mutation UnapproveAccessCheck($id: ID!) {
    unapproveAccessCheck(id: $id) {
      id
    }
  }
`;

interface AccessCheckCardProps {
  accessCheck: AccessCheckExtraInfo;
  userID: string;
}

export default function AccessCheckCard({ accessCheck, userID }: AccessCheckCardProps) {
  const [approveCheck, approveCheckResult] = useMutation(APPROVE_CHECK, {
    variables: { id: accessCheck.id },
    refetchQueries: [{ query: GET_USER, variables: { id: userID } }],
  });
  const [unapproveCheck, unapproveCheckResult] = useMutation(UNAPPROVE_CHECK, {
    variables: { id: accessCheck.id },
    refetchQueries: [{ query: GET_USER, variables: { id: userID } }],
  });

  const approved = accessCheck.approved;

  const isMobile = useIsMobile();

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        alignItems: 'center',
        padding: "5px"
      }}
      variant={approved ? undefined : "outlined"}
    >
      <Stack sx={{ paddingLeft: "10px" }} direction={"row"} spacing={1} alignItems={"center"}>
        {
          approved
            ? <CheckIcon color="success" />
            : <CloseIcon color="error" />
        }
        <AuditLogEntity
          entityCode={"equipment:" + accessCheck.equipment.id + ":" + ((accessCheck.equipment !== undefined) ? accessCheck.equipment.name : "Loading...")}
        />
      </Stack>
      <CardActions>
        {!approved && (
          <Button
            size="small"
            color="success"
            variant="outlined"
            loading={approveCheckResult.loading}
            onClick={() => approveCheck()}
          >
            <b>Approve Check</b>
          </Button>
        )}
        {approved && (
          <Button
            size="small"
            color="error"
            variant="outlined"
            loading={unapproveCheckResult.loading}
            onClick={() => unapproveCheck()}
          >
            <b>Unapprove Check</b>
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
