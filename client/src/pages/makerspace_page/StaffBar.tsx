import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import NavLink from "../../top_nav/NavLink";
import InventoryIcon from "@mui/icons-material/Inventory";
import SchoolIcon from "@mui/icons-material/School";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from '@mui/icons-material/BarChart';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import { useState } from "react";
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ScannerIcon from '@mui/icons-material/Scanner';
import { isStaffFor } from "../../common/PrivilegeUtils";
import { useIsMobile } from "../../common/IsMobileProvider";
import { Outlet, useParams } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function StaffBar() {
    const { makerspaceID } = useParams<{ makerspaceID: string }>();
    
    const user = useCurrentUser();
    const isMobile = useIsMobile();
    const isPriviledged = isStaffFor(user, Number(makerspaceID));

    const [mobileMenu, setMobileMenu] = useState(false);

    if (!isPriviledged) {
        return null;
    }

    const staffNavigation = (
        <Stack
            direction={isMobile ? "column" : "row"}
            justifyContent={isMobile ? "flex-start" : "space-around"}
            alignItems="center"
            padding="10px 0px"
        >
            {
                mobileMenu
                ? <ButtonBase onClick={() => setMobileMenu(false)} sx={{width: "100%", padding: "10px 0px"}}> 
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
                    icon={<ArrowBackIcon/>}
                />
                : null
            }
            <NavLink
                primary={"Manage Trainings"}
                to={"/admin/training"}
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
                primary={"Storefront"}
                to={"/admin/storefront"}
                icon={<StorefrontIcon />}
            />
            <NavLink
                primary={"People"}
                to={`/makerspace/${makerspaceID}/people`}
                icon={<PeopleIcon />}
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
        </Stack>
    );

    return (
        <Stack>
            {
                isMobile
                ? mobileMenu
                    ? staffNavigation
                    : <ButtonBase onClick={() => setMobileMenu(true)} sx={{width: "100%", padding: "10px 0px"}}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                            <Typography variant="body1" color="grey">Staff Actions</Typography>
                            <MenuIcon />
                        </Stack>
                    </ButtonBase>
                : staffNavigation
            }
            <Outlet/>
        </Stack>
    );
}