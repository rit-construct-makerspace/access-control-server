import { ButtonBase, Divider, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useIsMobile } from "../../common/IsMobileProvider";
import { Outlet } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import NavLink from "../../top_nav/NavLink";
import CarpenterIcon from '@mui/icons-material/Carpenter';
import LinkIcon from '@mui/icons-material/Link';
import InventoryIcon from '@mui/icons-material/Inventory';
import HistoryIcon from '@mui/icons-material/History';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import PaletteIcon from '@mui/icons-material/Palette';

export default function AdminBar() {
  const isMobile = useIsMobile();

  const [mobileMenu, setMobileMenu] = useState(false);

  const adminNavigation = <Stack
    direction={isMobile ? "column" : "row"}
    justifyContent={isMobile ? "flex-start" : "space-around"}
    alignItems="center"
    padding="10px 0px"
  >
    <NavLink
      primary={"Makerspaces"}
      to={`/admin/makerspaces`}
      icon={<CarpenterIcon />}
    />
    <NavLink
      primary={"Links"}
      to={`/admin/links`}
      icon={<LinkIcon />}
    />
    <NavLink
      primary={"Inventory"}
      to={`/admin/inventory`}
      icon={<InventoryIcon />}
    />
    <NavLink
      primary={"History"}
      to={`/admin/history`}
      icon={<HistoryIcon />}
    />
    <NavLink
      primary={"Announcements"}
      to={"/admin/announcements"}
      icon={<AnnouncementIcon />}
    />
    <NavLink
      primary="Themes"
      to={"/admin/themes"}
      icon={<PaletteIcon />}
    />
  </Stack>

  return (
    <Stack>
      {
        isMobile
          ? mobileMenu
            ? adminNavigation
            : <ButtonBase onClick={() => setMobileMenu(true)} sx={{ width: "100%", padding: "10px 0px" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                <Typography variant="body1" color="grey">Admin Navigation</Typography>
                <MenuIcon />
              </Stack>
            </ButtonBase>
          : adminNavigation
      }
      <Divider orientation={"horizontal"} flexItem />
      <Outlet />
    </Stack>
  );
}