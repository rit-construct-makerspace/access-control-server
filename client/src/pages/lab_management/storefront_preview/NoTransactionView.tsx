import React from "react";
import { Stack, Typography } from "@mui/material";
import LogoSvg from "../../../assets/shed logo orange white.png";
import styled from "styled-components";
import NameTag from "./NameTag";

const StyledLogo = styled.img`
  width: 530px;
`;

const AdamSavage = {
  name: "Adam Savage",
  avatarHref: "https://speaking.com/wp-content/uploads/2017/06/Adam-Savage.jpg",
  id: "test-id-1",
};

export default function NoTransactionView() {
  return (
    <Stack alignItems="center" justifyContent="center" height="100%">
      <StyledLogo src={LogoSvg} alt="Shed Logo" />
      <Typography variant="h1" mt={4} mb={8}>
        Retail Center
      </Typography>
      <NameTag person={AdamSavage} />
    </Stack>
  );
}
