import { Box, Stack } from "@mui/system";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import GET_EVENTS, { MakeEvent } from "../../queries/eventQueries";
import { Fade, LinearProgress, Typography } from "@mui/material";
import { format } from "date-fns";
import QRCode from "react-qr-code";


let listLength = 0;
let index = 0;

export default function EventsDisplay() {

    const getEvents = useQuery(GET_EVENTS, { pollInterval: 300000 });

    const [progress, setProgress] = useState(0);

    function handleNextEvent() {
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
                    handleNextEvent();
                }

                return newProgress;
            })
        }, 200);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <RequestWrapper2 result={getEvents} render={(data) => {
            const events: MakeEvent[] = data.events;
            const filteredEvents = events.filter((event) => (event.ticket_availability.has_available_tickets));

            const eventGraphics = filteredEvents.map((event) => {

                return (
                    <Stack height="100%" spacing={3} alignItems={"center"}>
                        <Stack>
                            <Typography fontSize={100} color="primary" fontWeight="bold" textAlign="center">{event.name.text}</Typography>
                            <Typography variant="h2" color="secondary" fontWeight="bold" textAlign="center">{`${format(new Date(event.start.local), "MMM do, h:mm bb")} - ${format(new Date(event.end.local), "MMM do, h:mm bb")}`}</Typography>
                            <Typography variant="h3" textAlign="center">{event.description.text}</Typography>
                        </Stack>
                        <Stack direction={"row"} alignItems={"center"} spacing={10} height={"100%"} justifyContent={"center"}>
                            <Stack>
                                <Typography variant="h2" textAlign={"right"} fontWeight={"bold"}>Register Here!</Typography>
                                <Typography variant="h3">
                                    Or on: <Typography variant="h3" color="primary" display={"inline"} sx={{ textDecoration: "underline" }}>make.rit.edu</Typography>
                                </Typography>
                            </Stack>

                            <Stack justifyContent={"center"}>
                                <QRCode value={event.url} size={500} />

                            </Stack>
                        </Stack>
                    </Stack>
                );
            })

            listLength = eventGraphics.length;

            return (
                <Stack height="100vh" width="100%" justifyContent="space-between">
                    <Fade in={(progress < 99 && progress > 1) || (events.length === 1)} appear={false}>
                        <Box height="100%">
                            {
                                eventGraphics.slice(index, index + 1)
                            }
                        </Box>
                    </Fade>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: "30px" }} />
                </Stack>
            );
        }} />
    );
}