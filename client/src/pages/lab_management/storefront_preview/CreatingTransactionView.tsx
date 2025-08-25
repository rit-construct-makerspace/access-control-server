import React from "react";
import LogoSvg from "../../../assets/shed logo orange white.png";
import { Divider, Stack, Typography } from "@mui/material";
import NameTag from "./NameTag";
import styled from "styled-components";
import ShoppingCartPreviewRow from "./ShoppingCartPreviewRow";
import { ShoppingCartEntry } from "../storefront/StorefrontPage";

const StyledLogo = styled.img`
  width: 530px;
`;

const AdamSavage = {
  name: "Adam Savage",
  avatarHref: "https://speaking.com/wp-content/uploads/2017/06/Adam-Savage.jpg",
  id: "test-id-1",
};

interface CreatingTransactionViewProps {
  cart: ShoppingCartEntry[];
}

export default function CreatingTransactionView({
  cart,
}: CreatingTransactionViewProps) {
  const total = cart
    .reduce((acc, { count, item }) => acc + count * item.pricePerUnit, 0)
    .toFixed(2);

  return (
    <Stack alignItems="center" mt={8}>
      <Stack justifyContent="center" height="100%">
        <Stack direction="row">
          <StyledLogo src={LogoSvg} alt="SHED Logo" />
          <NameTag person={AdamSavage} scale={0.6} />
        </Stack>

        <Typography variant="h2" mt={4}>
          Shopping cart
        </Typography>

        <Stack divider={<Divider flexItem />} spacing={4} mt={4}>
          {cart.map((entry) => (
            <ShoppingCartPreviewRow key={entry.id} entry={entry} />
          ))}
        </Stack>

        <Typography variant="h3" component="div" alignSelf="flex-end" mt={4}>
          ${total}
        </Typography>
      </Stack>
    </Stack>
  );
}
