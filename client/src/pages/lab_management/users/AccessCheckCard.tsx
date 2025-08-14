import { useEffect, useState } from "react";
import { Button, Card, CardActions  } from "@mui/material";
import { AccessCheckExtraInfo, GET_USER } from "./UserModal";
import { gql, useMutation } from "@apollo/client";
import AuditLogEntity from "../audit_logs/AuditLogEntity";

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

  const [width, setWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);
  const isMobile = width <= 1100;

  return (
    <Card
      sx={{
        backgroundColor: !approved ? (localStorage.getItem("themeMode") === "dark" ? "grey.900" : "grey.100") : (localStorage.getItem("themeMode") === "dark" ? "lightGreen.800" : "lightGreen.100"),
        border: `2px solid ${!approved ? "lightgrey" : "palegreen"}`,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        alignItems: 'center',
      }}
    >
      <div style={{ width: isMobile ? "100%" : "40%", marginLeft: "10px" }}>
        <AuditLogEntity entityCode={"equipment:" + accessCheck.equipment.id + ":" + ((accessCheck.equipment !== undefined) ? accessCheck.equipment.name : "Loading...")}></AuditLogEntity>
      </div>
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
