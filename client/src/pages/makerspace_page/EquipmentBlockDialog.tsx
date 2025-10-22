import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, List, ListItem, ListItemText, Typography } from "@mui/material";

export default function EquipmentBlockDialog(
  { open, onClose, equipmentList, makerspaceID }: 
  { open: boolean; onClose: () => void; equipmentList: { id: number; name: string}[]; makerspaceID: number }
) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Equipment Blocking Deletion</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          There is still equipment associated with this room. 
          Please delete them or reassign them to a different room before deleting this room.
        </Typography>
        <List>
          {equipmentList.map((equipment) => (
            <ListItem>
              <ListItemText primary={
                <Link href={`/app/makerspace/${makerspaceID}/equipment/${equipment.id}`} target="_blank" rel="noopener">
                  {equipment.name}
                </Link>
                } 
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}