import React from "react";
import { Card, CardActions, Stack, Typography } from "@mui/material";
import { GET_USER, Hold } from "./UserModal";
import { format, parseISO } from "date-fns";
import { gql, useMutation } from "@apollo/client";
import { LoadingButton } from "@mui/lab";

const REMOVE_HOLD = gql`
  mutation RemoveHold($holdID: ID!) {
    removeHold(holdID: $holdID) {
      id
    }
  }
`;

interface HoldCardProps {
  hold: Hold;
  userID: string;
}

export default function HoldCard({ hold, userID }: HoldCardProps) {
  const [removeHold, result] = useMutation(REMOVE_HOLD, {
    variables: { holdID: hold.id },
    refetchQueries: [{ query: GET_USER, variables: { id: userID } }],
  });

  const removed = hold.removeDate && hold.remover;

  return (
    <Card
      sx={{
        backgroundColor: removed ? "grey.100" : "#fff8f8",
        border: `1px solid ${removed ? "grey" : "red"}`,
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: 500, mt: 2, mx: 2 }}>
        {hold.description}
      </Typography>
      <CardActions sx={{ px: 2 }}>
        <Stack sx={{ flex: 1, color: "#595959" }}>
          <Typography variant="body2">
            Placed by {`${hold.creator.firstName} ${hold.creator.lastName}`} on{" "}
            {format(parseISO(hold.createDate), "M/d/yy h:mmaaa")}
          </Typography>

          {hold.remover && hold.removeDate && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Removed by {`${hold.remover.firstName} ${hold.remover.lastName}`}{" "}
              on {format(parseISO(hold.removeDate), "M/d/yy h:mmaaa")}
            </Typography>
          )}
        </Stack>

        {!removed && (
          <LoadingButton
            size="small"
            color="error"
            loading={result.loading}
            onClick={() => removeHold()}
          >
            Remove hold
          </LoadingButton>
        )}
      </CardActions>
    </Card>
  );
}
