import { Alert, Button, Stack, Typography } from "@mui/material";

export default function ThemePreview() {
  return (
    <Stack direction={"row"} spacing={2}>
      <Stack spacing={1} width={"100%"}>
        <Typography variant="subtitle1">Primary Example</Typography>
        <Button
          variant="contained"
          color="primary"
        >
          I'm a Button!
        </Button>
        <Button
          variant="outlined"
          color="primary"
        >
          I'm a Button!
        </Button>
      </Stack>
      <Stack spacing={1} width={"100%"}>
        <Typography variant="subtitle1">Secondary Example</Typography>
        <Button
          variant="contained"
          color="secondary"
        >
          I'm a Button!
        </Button>
        <Button
          variant="outlined"
          color="secondary"
        >
          I'm a Button!
        </Button>
      </Stack>
      <Stack spacing={1} width={"100%"}>
        <Typography variant="subtitle1">Error Example</Typography>
        <Button
          variant="contained"
          color="error"
        >
          I'm a Button!
        </Button>
        <Button
          variant="outlined"
          color="error"
        >
          I'm a Button!
        </Button>
        <Alert
          variant="filled"
          severity="error"
        >
          Error!
        </Alert>
      </Stack>
      <Stack spacing={1} width={"100%"}>
        <Typography variant="subtitle1">Warning Example</Typography>
        <Button
          variant="contained"
          color="warning"
        >
          I'm a Button!
        </Button>
        <Button
          variant="outlined"
          color="warning"
        >
          I'm a Button!
        </Button>
        <Alert
          variant="filled"
          severity="warning"
        >
          Warning!
        </Alert>
      </Stack>
      <Stack spacing={1} width={"100%"}>
        <Typography variant="subtitle1">Info Example</Typography>
        <Button
          variant="contained"
          color="info"
        >
          I'm a Button!
        </Button>
        <Button
          variant="outlined"
          color="info"
        >
          I'm a Button!
        </Button>
        <Alert
          variant="filled"
          severity="info"
        >
          Info!
        </Alert>
      </Stack>
      <Stack spacing={1} width={"100%"}>
        <Typography variant="subtitle1">Success Example</Typography>
        <Button
          variant="contained"
          color="success"
        >
          I'm a Button!
        </Button>
        <Button
          variant="outlined"
          color="success"
        >
          I'm a Button!
        </Button>
        <Alert
          variant="filled"
          severity="success"
        >
          Success!
        </Alert>
      </Stack>
    </Stack>
  );
}