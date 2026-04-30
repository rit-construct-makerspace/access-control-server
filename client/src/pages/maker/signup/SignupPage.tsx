import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  useCurrentUser,
} from "../../../common/CurrentUserProvider";
import styled from "styled-components";
import { useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { GET_CURRENT_USER, UPDATE_STUDENT_PROFILE } from "../../../queries/userQueries";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

const StyledFakeTextField = styled.div`
  border-radius: 4px;
  border: 1px solid #c0c0c0;
  background-color: #efefef;
  padding: 16.5px 14px;
  flex: 1;
`;

const COLLEGES = [
  "CAD - College of Art and Design",
  "CET - College of Engineering Technology",
  "CHST - College of Health Sciences and Technology",
  "CLA - College of Liberal Arts",
  "COS - College of Science",
  "GCCIS - B. Thomas Golisano College of Computing and Information Sciences",
  "GIS - Golisano Institute for Sustainability",
  "KGCOE - Kate Gleason College of Engineering",
  "NTID - National Technical Institute for the Deaf",
  "SCB - Saunders College of Business",
  "SOIS - School of Individualized Study",
];

const IS_FACULTY_REGEX = /^[a-z]+$/;

function generateGradDates() {
  const semesters = ["Spring", "Summer", "Fall"];
  const year = new Date().getFullYear();
  const dates: string[] = [];

  for (let i = 0; i < 6; i++) {
    semesters.forEach((s) => dates.push(`${s} ${year + i}`));
  }

  return dates;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const makeTheme = useMakeTheme();

  const [updateStudentProfile, result] = useMutation(UPDATE_STUDENT_PROFILE);

  const [pronouns, setPronouns] = useState("");
  const [college, setCollege] = useState("");
  const [expectedGraduation, setExpectedGraduation] = useState("");

  const handleSubmit = () => {
    if (!college && !IS_FACULTY_REGEX.test(currentUser.ritUsername)) {
      window.alert("Please select your college.");
      return;
    }

    if (!expectedGraduation && !IS_FACULTY_REGEX.test(currentUser.ritUsername)) {
      window.alert("Please select your expected graduation date.");
      return;
    }

    //No graduation if faculty
    if (IS_FACULTY_REGEX.test(currentUser.ritUsername)) {
      updateStudentProfile({
        variables: {
          userID: currentUser.id,
          pronouns,
          college,
          expectedGraduation: "Faculty"
        },
        refetchQueries: [{ query: GET_CURRENT_USER }],
      });
    } else {
      updateStudentProfile({
        variables: {
          userID: currentUser.id,
          pronouns,
          college,
          expectedGraduation
        },
        refetchQueries: [{ query: GET_CURRENT_USER }],
      });
    }
  };

  // Redirect to home page if setupComplete
  useEffect(() => {
    if (currentUser?.setupComplete) navigate("/help");
  }, [currentUser, navigate]);

  return (
    <Stack spacing={3} sx={{ maxWidth: 715, mx: "auto", mt: 8 }}>
      <title>{`Signup | ${makeTheme.title}`}</title>
      <Typography variant="h3">Welcome to <Typography variant="h3" display={"inline"} color="primary" fontWeight={"bold"}>Make @ RIT!</Typography></Typography>
      <Typography variant="body1">
        Make is the gateway to accessing trainings and equipment at the <b>SHED</b>, RIT's largest makerspace.
        Join a community of creative thinkers and makers, and use our tools and machinery
        to bring your project to life. <Link
          href="https://docs.make.rit.edu/%E2%80%8BPolicies%20%26%20Guidances/Makerspace%20Policies/"
          target="_blank"
          rel="noreferrer"
        >
          Read about our policies here!
        </Link>
      </Typography>

      <Typography variant="body1">
        Before you get started, please answer a few questions to finish setting
        up your account.
      </Typography>

      <Stack direction="row" spacing={4}>
        <StyledFakeTextField>{`${currentUser.firstName} ${currentUser.lastName}`}</StyledFakeTextField>
      </Stack>

      <Stack spacing={1}>
        <TextField
          label="Pronouns"
          value={pronouns}
          onChange={(e) => setPronouns(e.target.value)}
        />
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ pl: 3 }}
        >
          <Typography variant="body2" fontSize="13px">
            Quick fill:
          </Typography>
          <Chip label="He / Him" onClick={() => setPronouns("He / Him")} />
          <Chip label="She / Her" onClick={() => setPronouns("She / Her")} />
          <Chip label="They / Them" onClick={() => setPronouns("They / Them")} />
        </Stack>
      </Stack>

      <TextField
        select
        label="College"
        value={college}
        hidden={IS_FACULTY_REGEX.test(currentUser.ritUsername)}
        onChange={(e) => setCollege(e.target.value)}
        sx={{ mt: 8, display: (IS_FACULTY_REGEX.test(currentUser.ritUsername) ? "none" : null) }}
      >
        {COLLEGES.map((c) => (
          <MenuItem value={c.split(" ")[0]} key={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Expected Graduation"
        value={expectedGraduation}
        onChange={(e) => setExpectedGraduation(e.target.value)}
        sx={{ mt: 4, display: (IS_FACULTY_REGEX.test(currentUser.ritUsername) ? "none" : null) }}
        hidden={IS_FACULTY_REGEX.test(currentUser.ritUsername) ? true : undefined} //Only if faculty/staff
      >
        {generateGradDates().map((d) => (
          <MenuItem value={d} key={d}>
            {d}
          </MenuItem>
        ))}
      </TextField>

      <Button
        loading={result.loading}
        size="large"
        variant="contained"
        onClick={handleSubmit}
        sx={{ alignSelf: "flex-end" }}
      >
        Start making!
      </Button>
    </Stack>
  );
}
