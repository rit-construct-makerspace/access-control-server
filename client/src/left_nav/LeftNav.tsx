import List from "@mui/material/List";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import HandymanIcon from "@mui/icons-material/Handyman";
import InventoryIcon from "@mui/icons-material/Inventory";
import EventIcon from "@mui/icons-material/Event";
import SchoolIcon from "@mui/icons-material/School";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import Avatar from "@mui/material/Avatar";
import AnnouncementIcon from '@mui/icons-material/Announcement';
import AdfScannerIcon from '@mui/icons-material/AdfScanner';
import Typography from "@mui/material/Typography";
import NavLink from "./NavLink";
import LogoSvg from "../assets/acronym_logo.svg";
import LogoSvgW from "../assets/acronym_logo_w.svg";
import styled from "styled-components";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { useCurrentUser } from "../common/CurrentUserProvider";
import Privilege from "../types/Privilege";
import { Outlet } from "react-router-dom";
import { Stack, Box, Button, IconButton, Badge, ButtonBase, Menu, MenuItem } from "@mui/material";
import HoldAlert from "./HoldAlert";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PrinterOsIcon from "../common/PrinterOSIcon";
import SlackIcon from "../common/SlackIcon";
import { useEffect, useState } from "react";
import MenuIcon from '@mui/icons-material/Menu';
import RequestWrapper from "../common/RequestWrapper";
import { gql, useQuery } from "@apollo/client";
import BarChartIcon from '@mui/icons-material/BarChart';
import ThemeToggle from "./ThemeToggle";
import ArchitectureIcon from '@mui/icons-material/Architecture';
import SettingsIcon from '@mui/icons-material/Settings';
import SharepointIcon from "../common/SharepointIcon";

const StyledLogo = styled.img`
  margin: 20px 12px 12px 12px;
  &:hover {
    cursor: pointer;
  }
`;

const IS_MENTOR_OR_HIGHER = gql`
  query IsMentorOrHigher {
    isMentorOrHigher
  }
`;

const drawerWidth = 250;

export default function LeftNav() {
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const currentUser = useCurrentUser();
  const isMaker = currentUser.privilege === Privilege.MAKER;
  const navigate = useNavigate();

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
  const isMentorOrHigherResult = useQuery(IS_MENTOR_OR_HIGHER);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(anchorEl);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  }

  const drawerContent = (
    <Box sx={{ overflowX: "hidden", minHeight: "100%" }}>
      <StyledLogo src={localStorage.getItem("themeMode") == "dark" ? LogoSvgW : LogoSvg} alt="SHED logo" onClick={() => {
        setOpen(false);
        navigate(`/`);
      }} />
      <ButtonBase onClick={handleUserMenuOpen}>
        <Stack direction="row" alignItems="center" spacing={2} padding={2}>
          <Avatar
            alt="Profile picture"
            src="https://t4.ftcdn.net/jpg/00/64/67/63/240_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg"
          />
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {`${currentUser.firstName} ${currentUser.lastName}`}
          </Typography>
        </Stack>
      </ButtonBase>

      <Menu open={userMenuOpen} anchorEl={anchorEl} onClose={handleUserMenuClose}>
        <MenuItem onClick={() => {navigate("/user/trainings"); handleUserMenuClose();}}>
          <Stack direction="row" spacing={2} alignItems="center" width="100%">
            <SchoolIcon sx={{color: "gray"}}/>
            <Typography variant="body1">User Trainings</Typography>
          </Stack>
        </MenuItem>
        <MenuItem onClick={() => {navigate("/user/settings"); handleUserMenuClose();}}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
            <SettingsIcon sx={{color: "gray"}}/>
            <Typography variant="body1">User Settings</Typography>
          </Stack>
        </MenuItem>
      </Menu>

      {currentUser.hasHolds && <HoldAlert />}

      <List component="nav">
        {!isMaker && <Divider textAlign="left">MAKER</Divider>}
        <NavLink
          to="/maker/equipment"
          primary="Equipment"
          icon={<HandymanIcon />}
          toggleDrawer={toggleDrawer(false)}
        />
        <NavLink
          to="/maker/training"
          primary="Training"
          icon={<SchoolIcon />}
          toggleDrawer={toggleDrawer(false)}
        />
        {/*<NavLink
          to="/maker/materials"
          primary="Materials"
          icon={<InventoryIcon />}
        />*/}
        <NavLink
          to="https://cloud.3dprinteros.com/ssosaml/rit/auth"
          primary="3DPrinterOS"
          icon={<PrinterOsIcon />}
          toggleDrawer={toggleDrawer(false)}
          newTab={true}
        />
        <NavLink
          to="https://rit.enterprise.slack.com/archives/C0440KNF916"
          primary="Slack"
          icon={<SlackIcon />}
          toggleDrawer={toggleDrawer(false)}
          newTab={true}
        />
        <NavLink
          to="https://rit0.sharepoint.com/:l:/s/shed-makerspace-internal/FLWWXKH1sflHs-h3tbs2ZFABOwYAmWuxffG18ansYFXlfA"
          primary="Equipment Calendar"
          icon={<EventIcon />}
          newTab={true}
        />
        <NavLink
          to="https://rit0.sharepoint.com/sites/shed-makerspace-public"
          primary="Knowledge Base"
          icon={<SharepointIcon />}
          toggleDrawer={toggleDrawer(false)}
          newTab={true}
        />
      </List>

      {!isMaker && (
        <RequestWrapper loading={isMentorOrHigherResult.loading} error={isMentorOrHigherResult.error}>
          <List component="nav">
            <Divider textAlign="left">STAFF</Divider>
            <NavLink
              to="/admin/equipment"
              primary="Manage Equipment"
              icon={<Badge badgeContent={<SettingsIcon fontSize="small" />} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><HandymanIcon /></Badge>}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/training"
              primary="Manage Training"
              icon={<Badge badgeContent={<SettingsIcon fontSize="small" />} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><SchoolIcon /></Badge>}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/inventory"
              primary="Material Inventory"
              icon={<InventoryIcon />}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/tools"
              primary="Tool Inventory"
              icon={<ArchitectureIcon />}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/storefront"
              primary="Storefront"
              icon={<StorefrontIcon />}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/rooms"
              primary="Rooms"
              icon={<MeetingRoomIcon />}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/announcements"
              primary="Announcements"
              icon={<AnnouncementIcon />}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/people"
              primary="People"
              icon={<PeopleIcon />}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/history"
              primary="History"
              icon={<HistoryIcon />}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/readers"
              primary="Access Devices"
              icon={<AdfScannerIcon />}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="/admin/statistics"
              primary="Statistics"
              icon={<BarChartIcon />}
              toggleDrawer={toggleDrawer(false)}
            />
            <NavLink
              to="https://rit0.sharepoint.com/sites/shed-makerspace-internal/SitePages/TrainingHome.aspx"
              primary="Internal Wiki"
              icon={<SharepointIcon />}
              toggleDrawer={toggleDrawer(false)}
              newTab={true}
            />
          </List>
        </RequestWrapper>
      )}


      {/*Logout Button*/}
      <List component={"nav"}>
        <NavLink
          to="/logoutprompt"
          primary="Logout"
          icon={<HandymanIcon />}
          toggleDrawer={toggleDrawer(false)}
        />
      </List>


      <List component={"nav"} sx={{ mt: "auto" }}>
        <ThemeToggle />
      </List>
    </Box>
  );

  return (
    <Box display={!isMobile ? "flex" : "block"} sx={{ overflowX: "hidden" }}>
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Box sx={{ position: "fixed", zIndex: 90, background: `#${localStorage.getItem('themeMode') == "dark" ? "000000" : "fafafa"} !important` }}>
        <IconButton onClick={toggleDrawer(true)} sx={{ height: 20, width: 20, p: 3, borderRadius: 1 }}><MenuIcon /></IconButton>
      </Box>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant={isMobile ? "temporary" : "permanent"}
        anchor="left"
        open={open}
        onClose={toggleDrawer(false)}
      >
        {drawerContent}
      </Drawer>
      <Outlet />
    </Box>
  );
}

