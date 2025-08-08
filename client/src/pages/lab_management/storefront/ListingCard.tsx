import { Button, Card, CardActions, CardContent, CardMedia, Typography } from "@mui/material";
import InventoryItem from "../../../types/InventoryItem";
import { Stack } from "@mui/system";
import { useIsMobile } from "../../../common/IsMobileProvider";

interface ListingCardProps {
  item: InventoryItem
  setActiveItem: (item: InventoryItem) => void;
  openDetailsModal: (item: InventoryItem) => void;
}

export function ListingCard(props: ListingCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card sx={{width: 400, m: 2}}>
      {!isMobile && <CardMedia
        sx={{ height: 140 }}
        image={(props.item.image && props.item.image != "") ? props.item.image : (process.env.PUBLIC_URL + "/shed_acronym_vert.jpg")}
      />}
      <CardContent sx={{minHeight: 125}}>
        <Typography gutterBottom variant="h5" component="div">{props.item.name}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{props.item.makerspace?.name}</Typography>
        <Typography variant="body1">${props.item.pricePerUnit.toFixed(2)} / {props.item.unit}</Typography>
      </CardContent>
      <CardActions>
        <Stack direction={"row"} justifyContent={"space-between"} width={"100%"}>
          <Button size="small" onClick={() => props.openDetailsModal(props.item)}>Details</Button>
          {props.item.count > 0
          ? <Button size="small" variant="contained" color="primary" onClick={() => props.setActiveItem(props.item)}>Add to Cart ({props.item.count} {props.item.count > 1 ? props.item.pluralUnit : props.item.unit} available)</Button>
          : <Button size="small" variant="contained" color="error" disabled>Out of stock</Button>}
        </Stack>
      </CardActions>
    </Card>
  );
}