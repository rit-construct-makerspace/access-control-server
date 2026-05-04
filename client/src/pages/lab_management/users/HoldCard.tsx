import { Button, Card, CardActions, Stack, Typography } from "@mui/material";
import { format, parseISO } from "date-fns";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isManager, isStaff } from "../../../common/PrivilegeUtils";
import { GET_USER, Hold } from "../../../queries/userQueries";

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
	const currentUser = useCurrentUser();

	const [removeHold, result] = useMutation(REMOVE_HOLD, {
		variables: { holdID: hold.id },
		refetchQueries: [{ query: GET_USER, variables: { id: userID } }],
	});

	const removed = hold.removeDate && hold.remover;

	return (
		<Card
			sx={{
				border: `1px solid ${removed ? "grey" : "red"}`,
			}}
		>
			{isStaff(currentUser) && (
				<Typography variant="body1" sx={{ fontWeight: 500, mt: 2, mx: 2 }}>
					{hold.description}
				</Typography>
			)}
			<CardActions sx={{ px: 2 }}>
				<Stack sx={{ flex: 1 }}>
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
					<Button
						size="small"
						color="error"
						loading={result.loading}
						onClick={() => removeHold()}
						disabled={!isManager(currentUser)}
					>
						Remove hold
					</Button>
				)}
			</CardActions>
		</Card>
	);
}
