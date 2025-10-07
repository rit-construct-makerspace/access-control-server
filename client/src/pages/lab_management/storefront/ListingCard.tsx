import { Button, Card, CardActionArea, CardActions, CardContent, CardMedia, Typography } from "@mui/material";
import InventoryItem from "../../../types/InventoryItem";
import { Stack } from "@mui/system";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { useCurrentUser } from "../../../common/CurrentUserProvider";

interface ListingCardProps {
  item: InventoryItem
  setActiveItem: (item: InventoryItem) => void;
  openDetailsModal: (item: InventoryItem) => void;
}

export function ListingCard(props: ListingCardProps) {
  const currentUser = useCurrentUser();
  const isMobile = useIsMobile();

  return (
    <Card sx={{ width: 400, m: 2 }}>
      <CardActionArea onClick= {() => props.openDetailsModal(props.item)}>
      {!isMobile && <CardMedia
        sx={{ height: 140 }}
        image={(props.item.image && props.item.image != "") ? import.meta.env.VITE_CDN_URL + "user-uploads/" + props.item.image : (import.meta.env.BASE_URL + "/shed_acronym_vert.jpg")}
      />}
      <CardContent sx={{ minHeight: 125 }}>
        <Typography gutterBottom variant="h5" component="div">{props.item.name}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{props.item.makerspace?.name}</Typography>
        <Stack direction={"row"} justifyContent={"space-between"}>
          <Typography variant="body1">${props.item.pricePerUnit.toFixed(2)} / {props.item.unit}</Typography>
          <Typography variant="body1">{props.item.count} {props.item.count == 1 ? props.item.unit : props.item.pluralUnit}</Typography>
        </Stack>
      </CardContent>
      <CardActions>
        <Stack direction={"row"} justifyContent={"space-between"} width={"100%"}>
          <Button size="small" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => {e.stopPropagation(); props.openDetailsModal(props.item)}}>Details</Button>
          {props.item.count > 0
            ? <Button
              size="small"
              variant="contained"
              color="primary"
              disabled={import.meta.env.VITE_DISABLE_STOREFRONT_CART === "true" || currentUser.visitor}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {e.stopPropagation(); props.setActiveItem(props.item)}}>
              Add to Cart
            </Button>
            : <Button
              size="small"
              variant="contained"
              color="error"
              disabled>
              Out of stock
            </Button>}
        </Stack>
      </CardActions>
      </CardActionArea>
    </Card>
  );
}