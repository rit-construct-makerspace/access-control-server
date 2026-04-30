import { useQuery } from "@apollo/client/react";
import { Box, Divider, LinearProgress, Slide, Typography } from "@mui/material";
import { Announcement, GET_ANNOUNCEMENTS } from "../../queries/announcementsQueries";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { Stack } from "@mui/system";
import { useEffect, useState } from "react";
import styled from "styled-components";
import MakeQRCode from "../../assets/make-qr-code.png";
import ThemedMarkdown from "../../common/ThemedMarkdown";

const StyledQRCode = styled.img`
    padding: 10px;
`;

let listLength = 0;
let index = 0;

export default function AnnouncementsDisplay() {

  const getAnnouncementsResult = useQuery(GET_ANNOUNCEMENTS, { pollInterval: 300000 });

  const [progress, setProgress] = useState(0);

  function handleNextAnnouncement() {
    if (index + 1 < listLength) {
      index = index + 1;
    } else {
      index = 0;
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress === 100 ? 0 : Math.min(oldProgress + 1, 100);

        if (newProgress < oldProgress) {
          handleNextAnnouncement();
        }

        return newProgress;
      })
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <RequestWrapper2 result={getAnnouncementsResult} render={(data) => {

      const announcements: Announcement[] = data.getAllAnnouncements;

      const announcementGraphics = announcements.map((announcement: Announcement) => {
        return (
          <Stack width="100%" padding="25px" key={announcement.id} spacing={2} divider={<Divider orientation="horizontal" flexItem />}>
            <Typography fontSize={100} textAlign="center" color="primary" fontWeight="bold">{announcement.title}</Typography>
            <Typography variant="h3" textAlign="center">
              <ThemedMarkdown>{announcement.description}</ThemedMarkdown>
            </Typography>
          </Stack>
        );
      });

      listLength = announcementGraphics.length;

      return (
        <Stack width="100%" height="100vh" justifyContent="space-between">
          <Stack height={"100%"} justifyContent="space-between" overflow="hidden">
            <Slide direction="down" in={progress < 99 && progress > 1} appear={false}>
              <Box>
                {
                  announcementGraphics.slice(index, index + 1)
                }
              </Box>
            </Slide>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={4} pb="10px">
              <Typography variant="h3">For more information, go to: <Typography textAlign="center" sx={{ textDecoration: "underline" }} fontSize={72} fontStyle="none" color="primary">make.rit.edu</Typography></Typography>
              <StyledQRCode src={MakeQRCode} />
            </Stack>
          </Stack>
          <LinearProgress variant="determinate" value={progress} sx={{ height: "30px" }} />
        </Stack>
      );
    }} />
  )
}