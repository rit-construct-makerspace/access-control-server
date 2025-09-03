import React, { useState } from "react";
import { Link } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

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

  const [entityType, id, label] = entityCode.split(":");

  const url = getEntityUrl(entityType, id, makerspaceID ?? "0");

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
