import React, { ReactNode } from "react";
import { Card, Modal } from "@mui/material";

interface PrettyModalProps {
  open: boolean;
  onClose: () => void;
  width?: number | string;
  children: ReactNode;
}

export default function PrettyModal({
  width = 400,
  open,
  onClose,
  children,
}: PrettyModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Card
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width,
          boxShadow: 24,
          maxHeight: "calc(100vh - 160px)",
          overflowY: "auto",
          p: 4,
        }}
      >
        {children}
      </Card>
    </Modal>
  );
}
