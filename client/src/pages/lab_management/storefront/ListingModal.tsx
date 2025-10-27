import { Box, Stack } from "@mui/system";
import PrettyModal from "../../../common/PrettyModal";
import InventoryItem from "../../../types/InventoryItem";
import { Button, Divider, TextField, Typography } from "@mui/material";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { isStaff } from "../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { useState } from "react";
import { makeCDNLink } from "../../../common/ImageFinder.js";

interface ListingModalProps {
  item: InventoryItem;
  open: boolean;
  addToCart: (activeItem: InventoryItem, addToCartCount: number) => void;
  onClose: () => void;
}

export function ListingModal(props: ListingModalProps) {
  const isMobile = useIsMobile();
  const currentUser = useCurrentUser();

  const [count, setCount] = useState<number>(1);

  const cost = count * props.item.pricePerUnit || 0;

  const validCost = cost > 0;
  const enoughInInventory = count <= props.item.count;

  const tryAddToCart = () => {
    if (!validCost || !enoughInInventory) return;

    props.addToCart(props.item, count);
    props.onClose();
  };

  return (
    <PrettyModal width={!isMobile ? 1000 : "100%"} open={props.open} onClose={props.onClose}>
      <Stack direction={isMobile ? "column" : "row"} justifyContent={"space-between"} flexWrap={"wrap"} mb={"1em"}>
        <Box sx={{ maxWidth: 400, width: !isMobile ? "50%" : "100%" }}>
          <img src={makeCDNLink(props.item.image)} style={{ width: "100%" }} alt="RIT SHED Logo" />
        </Box>

        <Box width={!isMobile ? "50%" : "100%"}>
          <Typography variant="h4" fontWeight={500}>
            {props.item.name}
          </Typography>
          <Box mt={1}>
            <Typography variant="body1">
              {(props.item.description && props.item.description !== "") ? props.item.description : <i>No description.</i>}
            </Typography>
            {isStaff(currentUser) && props.item.notes !== "" &&
              <div>
                <Divider sx={{ my: "1em" }} textAlign="left">Internal Details</Divider>
                <Typography variant="body1">
                  {props.item.notes}
                </Typography>
              </div>
            }
          </Box>
        </Box>
      </Stack>

      <Stack
        direction={"column"}
        alignItems={"flex-end"}
        sx={{ float: "right" }}
      >
        <Stack
          alignSelf="flex-end"
          alignItems="center"
          justifyContent={"flex-end"}
          direction={"row"}
          mb={2}
          spacing={1}
          sx={{ width: "100%" }}
        >
          <TextField
            label="Count"
            size="small"
            sx={{ width: 100 }}
            type="number"
            slotProps={{ htmlInput: { min: 0, max: props.item.count } }}
            autoFocus
            value={count}
            onKeyDown={({ key }) => {
              if (key === "Enter") tryAddToCart();
            }}
            onChange={(e) => {
              setCount(parseInt(e.target.value));
            }}
          />
          <Typography variant="body1">{props.item.pluralUnit}</Typography>

          <Typography variant="body1" mt={1}>
            x ${props.item.pricePerUnit.toFixed(2)} per {props.item.unit}
          </Typography>

        </Stack>
        <Divider flexItem sx={{ my: 1 }} />
        <Typography variant="h6" component="div">
          ${cost.toFixed(2)}
        </Typography>
        <Stack direction={"column"} mt={1.5}>
          <Typography variant="body2" color={props.item.count > 0 ? (props.item.count < props.item.threshold ? "warning" : "success") : "error"}>
            {props.item.count > 0 ? <>{props.item.count} available</> : "Out of stock"}
          </Typography>
          {props.item.count > 0
            ? <Button size="small" variant="contained" color="primary" disabled={import.meta.env.VITE_DISABLE_STOREFRONT_CART === "true" || currentUser.visitor } onClick={() => tryAddToCart()}>Add to Cart</Button>
            : <Button size="small" variant="contained" color="error" disabled>Out of stock</Button>}
        </Stack>
      </Stack>

    </PrettyModal>
  )
}