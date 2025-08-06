import React, { forwardRef, useMemo } from "react";
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
  useLocation,
} from "react-router-dom";
import { Button } from "@mui/material";

interface NavLinkProps {
  icon?: React.ReactElement;
  primary: string;
  to: string;
  notificationCount?: number;
  newTab?: boolean
  toggleDrawer?: () => void;
}

export default function NavLink({
  icon,
  primary,
  to,
  newTab,
  toggleDrawer
}: NavLinkProps) {
  const url = useLocation();

  const renderLink = useMemo(
    () =>
      forwardRef<HTMLAnchorElement, Omit<RouterLinkProps, "to">>(
        (itemProps, ref) => (
          <RouterLink to={to} ref={ref} {...itemProps} role={undefined} target={newTab ? "_blank" : ""} rel={newTab ? "noopener noreferrer" : ""}/>
        )
      ),
    [to, newTab]
  );

  return (
    <Button
      component={renderLink}
      onClick={(e) => {
        if (url.pathname.includes("/maker/training/") && !url.pathname.includes("results") && !window.confirm(
          `Are you sure you want to leave this quiz? Progress will not be saved.`
        )) {
          e.preventDefault();
          return ''
        }
        if (toggleDrawer) toggleDrawer();
      }}
      startIcon={icon}
      color="inherit"
      sx={{fontSize: 16}}
    >
        {primary}
    </Button>
  );
}
