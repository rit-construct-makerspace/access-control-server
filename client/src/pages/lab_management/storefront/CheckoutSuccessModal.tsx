import PrettyModal from "../../../common/PrettyModal";
import { Typography, Divider, Card, CardHeader, CardContent } from "@mui/material";
import { Stack } from "@mui/system";
import { ShoppingCartEntry } from "./StorefrontPage";
import { useIsMobile } from "../../../common/IsMobileProvider";

interface CheckoutSuccessModalProps {
  open: boolean;
  groupedEntries: Record<string, ShoppingCartEntry[]>;
  onClose: () => void;
}

enum PickupInstructions {
  A_LEVEL = "Stop at the front desk of the Atrium Level Makerspace and state that you're here for pickup.",
  GENERAL = "Stop at the front desk of the General Makerspace on the 1st floor and tell an employee that you're here for pickup.",
  T_AND_E = "Stop at the front desk of the Textiles & Electronics Makerspace on the 2nd floor and tell an employee that you're here for pickup."
}

export default function CheckoutSuccessModal({
  open,
  onClose,
  groupedEntries,
}: CheckoutSuccessModalProps) {
  const isMobile = useIsMobile();



  return (
    <PrettyModal open={open} onClose={onClose} width={isMobile ? "100%" : 540}>
      <Typography variant="h5">Purchase Successful</Typography>
      <Divider />
      <Typography variant="body1">Thank you for your purchase! A receipt will be sent to your RIT Email shortly.</Typography>
      <Typography variant="body1">Please review the pickup instructions for each of your items:</Typography>
      {Object.entries(groupedEntries).map(([makerspaceID, entries]) => (
        <Card key={makerspaceID}>
          <CardHeader title={entries[0].item.makerspace?.name || "Unknown Makerspace"} subheader={(<Typography variant="body2">{entries[0].item.makerspace?.id == 36 && PickupInstructions.A_LEVEL}
              {entries[0].item.makerspace?.id == 37 && PickupInstructions.GENERAL}
              {entries[0].item.makerspace?.id == 38 && PickupInstructions.T_AND_E}</Typography>)} />
              
          <CardContent>

            <Divider />

            {entries.map((entry) => (
              <Stack direction={"row"} justifyContent={"space-between"} key={entry.id}>
                <Typography variant="body1">{entry.item.name}</Typography>
                <Typography variant="body2">(x {entry.count})</Typography>
              </Stack>
            ))}
          </CardContent>
        </Card>
      ))}
    </PrettyModal>
  )
}