import { ButtonBase, Stack, Typography } from "@mui/material";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import NavLink from "../../top_nav/NavLink";
import InventoryIcon from "@mui/icons-material/Inventory";
import SchoolIcon from "@mui/icons-material/School";
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from '@mui/icons-material/BarChart';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import { useState } from "react";
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ScannerIcon from '@mui/icons-material/Scanner';
import { isOnlyTrainer, isStaffFor } from "../../common/PrivilegeUtils";
import { useIsMobile } from "../../common/IsMobileProvider";
import { Outlet, useParams } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaidIcon from '@mui/icons-material/Paid';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

export default function StaffBar() {
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const user = useCurrentUser();
  const isMobile = useIsMobile();
  const isPriviledged = isStaffFor(user, Number(makerspaceID));
  const isTrainer = isOnlyTrainer(user);

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
          mobileMenu
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
          mobileMenu
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
              primary={"Back"}
              to={`/makerspace/${makerspaceID}`}
              icon={<ArrowBackIcon />}
            />
            : null
        }
        <NavLink
          primary={"Manage Trainings"}
          to={`/makerspace/${makerspaceID}/trainings`}
          icon={<SchoolIcon />}
        />
        <NavLink
          primary={"Materials"}
          to={"/admin/inventory"}
          icon={<InventoryIcon />}
        />
        <NavLink
          primary={"Tools"}
          to={`/makerspace/${makerspaceID}/tools`}
          icon={<ArchitectureIcon />}
        />
        <NavLink
          primary={"Orders"}
          to={`/makerspace/${makerspaceID}/storefront/carts`}
          icon={<ShoppingCartCheckoutIcon />}
        />
        <NavLink
          primary={"People"}
          to={`/makerspace/${makerspaceID}/people`}
          icon={<PeopleIcon />}
        />
        <NavLink
          primary={"Organizations"}
          to={`/makerspace/${makerspaceID}/organizations`}
          icon={<AccountBalanceIcon />}
        />
        <NavLink
          primary={"History"}
          to={`/makerspace/${makerspaceID}/history`}
          icon={<HistoryIcon />}
        />
        <NavLink
          primary={"Readers"}
          to={`/makerspace/${makerspaceID}/readers`}
          icon={<ScannerIcon />}
        />
        <NavLink
          primary={"Statistics"}
          to={"/admin/statistics"}
          icon={<BarChartIcon />}
        />
        <NavLink
          primary={"Finances"}
          to={`/makerspace/${makerspaceID}/currency`}
          icon={<PaidIcon />}
        />
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