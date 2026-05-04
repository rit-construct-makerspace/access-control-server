import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from "@mui/icons-material/History";
import InventoryIcon from "@mui/icons-material/Inventory";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import PaidIcon from '@mui/icons-material/Paid';
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HandymanIcon from '@mui/icons-material/Handyman';
import RouterIcon from '@mui/icons-material/Router';
import { ButtonBase, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import { useIsMobile } from "../../common/IsMobileProvider";
import { isOnlyTrainer, isStaffFor, isManagerFor } from "../../common/PrivilegeUtils";
import NavLink from "../../top_nav/NavLink";

export default function StaffBar() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const user = useCurrentUser();
  const isMobile = useIsMobile();
  const isPriviledged = isStaffFor(user, Number(makerspaceID));
  const isTrainer = isOnlyTrainer(user);
  const isManager = isManagerFor(user, Number(makerspaceID));

  const [mobileMenu, setMobileMenu] = useState(false);

  if (!isPriviledged && !isTrainer) {
    return null;
  }

  const staffNavigation = isTrainer
    ? (
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent={isMobile ? "flex-start" : "space-around"}
        alignItems="center"
        padding="10px 0px"
      >
        {
          isMobile && mobileMenu
            ? <ButtonBase onClick={() => setMobileMenu(false)} sx={{ width: "100%", padding: "10px 0px" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="body1" color="grey">Trainer Actions</Typography>
                <KeyboardArrowDownIcon />
              </Stack>
            </ButtonBase>
            : null
        }
        {
          window.location.pathname.match(/\/app\/makerspace\/\d+\/.+/gm) !== null
            ? <NavLink
              primary={"Back"}
              to={`/makerspace/${makerspaceID}`}
              icon={<ArrowBackIcon />}
            />
            : null
        }
        <NavLink
          primary={"People"}
          to={`/makerspace/${makerspaceID}/people`}
          icon={<PeopleIcon />}
        />
      </Stack>
    )
    : (
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent={isMobile ? "flex-start" : "space-around"}
        alignItems="center"
        padding="10px 0px"
      >
        {
          isMobile && mobileMenu
            ? <ButtonBase onClick={() => setMobileMenu(false)} sx={{ width: "100%", padding: "10px 0px" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="body1" color="grey">Staff Actions</Typography>
                <KeyboardArrowDownIcon />
              </Stack>
            </ButtonBase>
            : null
        }
        {
          window.location.pathname.match(/\/app\/makerspace\/\d+\/.+/gm) !== null
            ? <NavLink
              primary={"Makerspace"}
              to={`/makerspace/${makerspaceID}`}
              icon={<ArrowBackIcon />}
            />
            : null
        }
        <NavLink
          primary={"Trainings"}
          to={`/makerspace/${makerspaceID}/trainings`}
          icon={<SchoolIcon />}
        />
        <NavLink
          primary={"Inventory"}
          to={`/makerspace/${makerspaceID}/inventory`}
          icon={<InventoryIcon />}
        />
        <NavLink
          primary={"Tools"}
          to={`/makerspace/${makerspaceID}/tools`}
          icon={<ArchitectureIcon />}
        />
        <NavLink
          primary={"People"}
          to={`/makerspace/${makerspaceID}/people`}
          icon={<PeopleIcon />}
        />
        <NavLink
          primary={"Orgs"}
          to={`/makerspace/${makerspaceID}/organizations`}
          icon={<AccountBalanceIcon />}
        />
        <NavLink
          primary={"History"}
          to={`/makerspace/${makerspaceID}/history`}
          icon={<HistoryIcon />}
        />
        <NavLink
          primary={"Maintenance"}
          to={`/makerspace/${makerspaceID}/maintenance`}
          icon={<HandymanIcon />}
        />
        <NavLink
          primary={"Reservations"}
          to={`/makerspace/${makerspaceID}/reservations`}
          icon={<CalendarMonthIcon />}
        />
        {
          isManager
            ? <NavLink
              primary={"Devices"}
              to={`/makerspace/${makerspaceID}/devices`}
              icon={<RouterIcon />}
            />
            : null
        }
        {
          isManager
            ? <NavLink
              primary={"Finances"}
              to={`/makerspace/${makerspaceID}/currency`}
              icon={<PaidIcon />}
            />
            : null
        }
      </Stack>
    );

  return (
    <Stack>
      {
        isMobile
          ? mobileMenu
            ? staffNavigation
            : <ButtonBase onClick={() => setMobileMenu(true)} sx={{ width: "100%", padding: "10px 0px" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="body1" color="grey">{isTrainer ? "Trainer Actions" : "Staff Actions"}</Typography>
                <MenuIcon />
              </Stack>
            </ButtonBase>
          : staffNavigation
      }
      <Outlet />
    </Stack>
  );
}