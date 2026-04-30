import { Alert, AppBar, Avatar, Box, Button, ButtonBase, Drawer, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import styled from "styled-components";
import LogoSvgWhite from "../assets/shed logo white.png";
import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import LayersIcon from '@mui/icons-material/Layers';
import NavLink from "./NavLink";
import { useCurrentUser } from "../common/CurrentUserProvider";
import SchoolIcon from "@mui/icons-material/School";
import SettingsIcon from '@mui/icons-material/Settings';
import { stringAvatar } from "../common/avatarGenerator";
import MenuIcon from '@mui/icons-material/Menu';
import Footer from "./Footer";
import PersonIcon from '@mui/icons-material/Person';
import { useIsMobile } from "../common/IsMobileProvider";
import ArticleIcon from '@mui/icons-material/Article';
import TuneIcon from '@mui/icons-material/Tune';
import LogoutIcon from '@mui/icons-material/Logout';
import { useMakeTheme } from "../common/MakeThemeProvider";
import { makeCDNLink } from "../common/ImageFinder";

const StyledLogo = styled.img`
  padding: 12px;
  &:hover {
    cursor: pointer;
  }
`;

export default function TopNav() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();

  const currentUser = useCurrentUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(anchorEl);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const [labTraining, setLabTraining] = useState(!(localStorage.getItem("showLabTraining2") === "false"));

  const [mobileDrawer, setMobileDrawer] = useState(false);

  function handleDismissLabTraining() {
    setLabTraining(false);
    localStorage.setItem("showLabTraining2", "false");
  }

  const makeAlerts =
    <Stack>
      { // Archived account alert
        currentUser.archived
          ? <Alert variant="filled" severity="error" sx={{ borderRadius: 0 }}>
            Your account has been archived. You are still able to take trainings and review reference materials, but you won't be able to use any machines. Please speak to a member of staff if you believe this was a mistake.
          </Alert>
          : null
      }
      { // Hold alert
        currentUser.hasHolds
          ? <Alert variant="filled" severity="error" sx={{ borderRadius: 0 }}>
            A hold has been placed on your account. You won't be able to create reservations, use machines, or purchase materials. Please speak to a member of staff in the makerspace to rectify this.
          </Alert>
          : null
      }
      { // Lab training Alert
        labTraining
          ? <Alert variant="filled" severity="info" onClose={handleDismissLabTraining} sx={{ borderRadius: 0 }}>
            All Makerspace users must complete the <a href="https://make.rit.edu/link/ehs" rel="noopener noreferrer" target="_blank">Shop Safety training course</a> before using any equipment.
          </Alert>
          : null
      }
    </Stack>

  const navlinks = [
    <NavLink
      to="https://cloud.3dprinteros.com/ssosaml/rit/auth"
      primary="3D Printing"
      icon={<LayersIcon />}
      newTab={true}
      key={0}
    />,
    <NavLink
      to={"https://docs.make.rit.edu"}
      primary={"Knowledge Base"}
      icon={<ArticleIcon />}
      newTab={true}
      key={1}
    />,
    //Commented out 2-24-26 until we can get the storefront payments working -@jim
    //    <NavLink
    //      to="/storefront"
    //      primary="Storefront"
    //      icon={<StorefrontIcon />}
    //      newTab={false}
    //    />
  ];

  const userProfileButton = currentUser.visitor
    ? <Button
      sx={{ height: "95%", marginRight: isMobile ? undefined : "10px" }}
      variant="contained"
      color="secondary"
      endIcon={<PersonIcon />}
      onClick={() => window.location.replace(import.meta.env.VITE_LOGIN_URL + "?redir=" + import.meta.env.VITE_ORIGIN + window.location.pathname)}
    >
      LOGIN
    </Button>
    : <ButtonBase onClick={handleUserMenuOpen}>
      <Stack direction={isMobile ? "row" : "row-reverse"} alignItems="center" spacing={2} padding={2}>
        {
          isMobile
            ? <Avatar
              alt="Profile picture"
              {...stringAvatar(currentUser.firstName, currentUser.lastName, { height: "30px", width: "30px", fontSize: 16 })}
            />
            : <Avatar
              alt="Profile picture"
              {...stringAvatar(currentUser.firstName, currentUser.lastName)}
            />
        }
        <Typography variant="body1" fontWeight={isMobile ? undefined : "bold"}>
          {`${currentUser.firstName} ${currentUser.lastName}`}
        </Typography>
      </Stack>
    </ButtonBase>

  const userMenu =
    <Menu open={userMenuOpen} anchorEl={anchorEl} onClose={handleUserMenuClose}>
      <MenuItem onClick={() => { navigate("/user/trainings"); handleUserMenuClose(); }}>
        <Stack direction="row" spacing={2} alignItems="center" width="100%">
          <SchoolIcon />
          <Typography variant="body1">User Trainings</Typography>
        </Stack>
      </MenuItem>
      <MenuItem onClick={() => { navigate("/user/settings"); handleUserMenuClose(); }}>
        <Stack direction="row" spacing={2} alignItems="center" width="100%">
          <SettingsIcon />
          <Typography variant="body1">User Settings</Typography>
        </Stack>
      </MenuItem>
      {
        currentUser.admin &&
        <MenuItem onClick={() => { navigate("/admin/makerspaces"); handleUserMenuClose(); setMobileDrawer(false); }}>
          <Stack direction={"row"} spacing={2} alignItems="center" width={"100%"}>
            <TuneIcon />
            <Typography variant="body1">Manage Site</Typography>
          </Stack>
        </MenuItem>
      }
      <MenuItem onClick={() => { window.location.href = import.meta.env.VITE_LOGOUT_URL }}>
        <Stack direction={"row"} spacing={2} alignItems="center" width={"100%"}>
          <LogoutIcon />
          <Typography variant="body1" width={"100%"}>Logout</Typography>
        </Stack>
      </MenuItem>
    </Menu>

  return (
    <Stack minHeight={"100vh"}>
      {isMobile
        ? <AppBar position="static">
          <Stack direction="row" justifyContent="space-between">
            <StyledLogo width="65%" src={makeTheme.logo !== "" ? makeCDNLink(makeTheme.logo, "user-uploads/") : LogoSvgWhite} onClick={() => { navigate(`/`); }} />
            <IconButton onClick={() => setMobileDrawer(true)}>
              <MenuIcon />
            </IconButton>
          </Stack>
          <Drawer anchor="top" open={mobileDrawer} onClose={() => setMobileDrawer(false)}>
            <Stack alignItems="center" spacing={2} paddingTop="10px" paddingBottom="10px">
              {navlinks}
              {userProfileButton}
              {userMenu}
            </Stack>
          </Drawer>
        </AppBar>
        : <Box width="100%" height="5%">
          <AppBar position="static">
            <Stack component="nav" direction="row" justifyContent="space-between" alignItems="center">
              <ButtonBase onClick={() => { navigate(`/`); }} sx={{ width: "15%" }} focusRipple>
                <StyledLogo width="100%" src={makeTheme.logo !== "" ? makeCDNLink(makeTheme.logo, "user-uploads/") : LogoSvgWhite} />
              </ButtonBase>
              {navlinks}
              {userProfileButton}
              {userMenu}
            </Stack>
          </AppBar>
        </Box>
      }
      {makeAlerts}
      <Outlet />
      <Footer />
    </Stack>
  );
}
