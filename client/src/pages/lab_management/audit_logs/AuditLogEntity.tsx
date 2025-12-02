import React, { useState } from "react";
import { Link } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isManagerFor } from "../../../common/PrivilegeUtils";

interface AuditLogEntityProps {
  entityCode: string;
}

function getEntityUrl(entityType: string, id: string, makerspaceID: string) {
  switch (entityType) {
    case "user":
      return `/makerspace/${makerspaceID}/people/${id}`;
    case "room":
      return `/makerspace/${makerspaceID}/edit/room/${id}`;
    case "equipment":
      return "/equipment/" + id;
    case "inventory":
      return "/admin/inventory";
    case "module":
      return `/makerspace/${makerspaceID}/training/${id}`;
    case "conceal":
      return "#";
    case "access_device":
      return `/makerspace/${makerspaceID}/readers#id-${id}`;
    case "machine":
      return `/makerspace/${makerspaceID}/readers#id-${id}`;
    case "makerspace":
      return `/makerspace/${id}`;
    default:
      return `/makerspace/${makerspaceID}/history`;
  }
}

export default function AuditLogEntity({ entityCode }: AuditLogEntityProps) {
  const navigate = useNavigate();
  // Dangerous!!! Might be undefined. A temporary fix until history/logs can be overhauled
  const { makerspaceID } = useParams<{ makerspaceID: string }>();
  const user = useCurrentUser();
  const manager = isManagerFor(user, Number(makerspaceID));

  const [entityType, id, label] = entityCode.split(":");

  let url = getEntityUrl(entityType, id, makerspaceID ?? "0");

  // If this would link to the readers page, but the current user is not a manager,
  // fall back to the makerspace history instead of exposing a non-accessible link.
  if ((entityType === "access_device" || entityType === "machine") && !manager) {
    url = `/makerspace/${makerspaceID}/history`;
  }

  const [reveal, setReveal] = useState(entityType !== "conceal");

  const toggleConcealment = () => {
    setReveal(reveal => !reveal)
  }

  return (
    <span>
      {!reveal
        ? <Link onClick={toggleConcealment}>
          Click to Reveal
        </Link>
        : <Link onClick={() => navigate(url)} sx={{ cursor: "pointer" }}>
          {label}
        </Link>
      }
    </span>
  );
}
