import { Avatar, Card, CardActionArea, Stack, Typography } from "@mui/material";
import { PartialUser } from "../../../queries/userQueries";
import PrivilegeChip from "./PrivilegeChip";
import { stringAvatar } from "../../../common/avatarGenerator";

interface UserCardProps {
  user: PartialUser;
  onClick: () => void;
}

export default function UserCard({ user, onClick }: UserCardProps) {
  return (
    <Card elevation={2} sx={{
      mr: 2, mb: 2
    }}>
      <CardActionArea sx={{ p: 2, height: "100%" }} onClick={onClick}>
        <Stack alignItems="center" spacing={1.5} height="100%">
          <Avatar
            alt={`Profile picture for ${user.firstName} ${user.lastName}`}
            {...stringAvatar(user.firstName, user.lastName, { width: "80px", height: "80px", fontSize: 36 })}
          />

          <Typography
            variant="body1"
            fontWeight={500}
            width={120}
            textAlign="center"
            lineHeight={1.25}
            flex={1}
          >
            {`${user.firstName} ${user.lastName}`}
            <br />
            <Typography
              variant="caption"
              fontWeight={200}
              width={120}
              textAlign="center"
              lineHeight={1}
              flex={1}
            >
              {`${user.ritUsername}`}
            </Typography>
          </Typography>

          <PrivilegeChip user={user} />
        </Stack>
      </CardActionArea>
    </Card>
  );
}
