import { useMutation, useQuery } from "@apollo/client";
import { CANCEL_CART, COMPLETE_CART, GET_CART } from "../../../../queries/cartQueries";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Button, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { CartItem } from "../../../../types/InventoryCart";
import { useEffect, useState } from "react";
import Page from "../../../Page";
import RequestWrapper from "../../../../common/RequestWrapper";
import { RefundModal } from "./RefundModal";
import { ConfirmPickupModal } from "./ConfirmPickupModal";
import { CancelCartModal } from "./CancelCartModal";
import { useNavigate, useParams } from "react-router-dom";
import { useMakeTheme } from "../../../../common/MakeThemeProvider";

export interface CartItemCountState extends CartItem {
  newCartcount: number;
}

export function CartPage() {
  const navigate = useNavigate();
  const { makerspaceID, cartID } = useParams<{ makerspaceID: string, cartID: string }>();
  if (!makerspaceID || !cartID) throw new Error("Makerspace ID and Cart ID are required");
  const makeTheme = useMakeTheme();

  const cartResult = useQuery(GET_CART, { variables: { id: cartID } });

  const [completeCartMutation] = useMutation(COMPLETE_CART);
  const [cancelCartMutation] = useMutation(CANCEL_CART);

  const staticRows: CartItem[] = cartResult.data?.cart?.items || [];

  const [rows, setRows] = useState<CartItemCountState[]>(staticRows.map(item => ({ ...item, newCartcount: item.cartcount })));

  useEffect(() => {
    setRows(staticRows.map(item => ({ ...item, newCartcount: item.cartcount })));
  }, [staticRows]);

  const [refundModalItem, setRefundModalItem] = useState<CartItemCountState | null>(null);
  const [refundSuccessSnackbarOpen, setRefundSuccessSnackbarOpen] = useState(false);
  const [refundErrorSnackbarOpen, setRefundErrorSnackbarOpen] = useState(false);

  const [confirmPickupModalOpen, setConfirmPickupModalOpen] = useState(false);
  const [pickupSuccessSnackbarOpen, setPickupSuccessSnackbarOpen] = useState(false);
  const [pickupErrorSnackbarOpen, setPickupErrorSnackbarOpen] = useState(false);

  const [cancelCartModalOpen, setCancelCartModalOpen] = useState(false);
  const [cancelSuccessSnackbarOpen, setCancelSuccessSnackbarOpen] = useState(false);
  const [cancelErrorSnackbarOpen, setCancelErrorSnackbarOpen] = useState(false);

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: "image", headerName: "Image", width: 160,
      renderCell: (params) => (<img src={(params.row.image && params.row.image != "") ? params.row.image : (import.meta.env.BASE_URL + "/shed_acronym_vert.jpg")} alt="Product" style={{ width: "100%" }} />),
    },
    { field: "name", headerName: "Name", width: 300 },
    {
      field: "quantity", headerName: "Quantity", width: 600,
      renderCell: (params) =>
        <Stack direction={"row"} alignItems={"center"} sx={{ textDecoration: params.row.cartcount > 0 ? "none" : "line-through" }}>
          <TextField
            value={params.row.newCartcount}
            onChange={(e) => {
              const newCount = parseInt(e.target.value);
              setRows((prevRows) =>
                prevRows.map((row) =>
                  row.id === params.row.id ? { ...row, newCartcount: newCount } : row
                )
              );
            }}
            type="number"
            slotProps={{ htmlInput: { min: 0, max: params.row.cartcount } }}
          />
          <Typography>{params.row.newCartcount == 1 ? params.row.unit : params.row.pluralUnit}</Typography>
          <Button variant="outlined" color="primary" size="small" disabled={params.row.cartcount - params.row.newCartcount <= 0} sx={{ ml: 4 }} onClick={() => {
            setRefundModalItem(params.row);
          }}>Subtract {params.row.cartcount - params.row.newCartcount} & Refund</Button>
        </Stack>,
    },

  ];

  return (
    <RequestWrapper loading={cartResult.loading} error={cartResult.error}>
      <Page title={""} topRightAddons={
        <Stack direction={"row"}>
          <Button variant="contained" color="error" onClick={() => setCancelCartModalOpen(true)}>
            Cancel Cart
          </Button>
          <Button variant="contained" color="success" onClick={() => setConfirmPickupModalOpen(true)}>
            Confirm item Pickup
          </Button>
        </Stack>
      }>
        <title>{`Carts | ${makeTheme.title}`}</title>
        <DataGrid
          rows={rows}
          columns={columns}
          rowHeight={100}
        />

        <RefundModal
          open={!!refundModalItem}
          onClose={(failure?: boolean) => {
            setRefundModalItem(null)
            if (failure) {
              setRefundErrorSnackbarOpen(true);
            } else {
              setRefundSuccessSnackbarOpen(true);
            }
          }}
          cartId={parseInt(cartID)}
          statedItem={refundModalItem}
        />

        <Snackbar
          open={refundSuccessSnackbarOpen}
          color="success"
          onClose={() => setRefundSuccessSnackbarOpen(false)}
          message="Refund process successful"
          autoHideDuration={5000}
        />
        <Snackbar
          open={refundErrorSnackbarOpen}
          color="error"
          onClose={() => setRefundErrorSnackbarOpen(false)}
          message="Refund process failed. Please contact an administrator."
          autoHideDuration={5000}
        />


        <ConfirmPickupModal
          open={confirmPickupModalOpen}
          onClose={() => setConfirmPickupModalOpen(false)}
          onConfirm={() => {
            setConfirmPickupModalOpen(false);
            completeCartMutation({
              variables: {
                cartID: cartID,
              }
            }).then(() => {
              setPickupSuccessSnackbarOpen(true);
            }).catch(() => {
              setPickupErrorSnackbarOpen(true);
            });
          }}
        />

        <Snackbar
          open={pickupSuccessSnackbarOpen}
          color="success"
          onClose={() => {
            setPickupSuccessSnackbarOpen(false);
            navigate(`/makerspace/${makerspaceID}/storefront/carts`);
          }}
          message="Pickup process successful. Redirecting back to Cart List..."
          autoHideDuration={5000}
        />
        <Snackbar
          open={pickupErrorSnackbarOpen}
          color="error"
          onClose={() => setPickupErrorSnackbarOpen(false)}
          message="Pickup process failed. Please contact an administrator."
          autoHideDuration={5000}
        />


        <CancelCartModal
          open={cancelCartModalOpen}
          onClose={() => setCancelCartModalOpen(false)}
          onConfirm={() => {
            setCancelCartModalOpen(false);
            cancelCartMutation({
              variables: {
                cartID: cartID,
              }
            }).then(() => {
              setCancelSuccessSnackbarOpen(true);
            }).catch(() => {
              setCancelErrorSnackbarOpen(true);
            });
          }}
        />

        <Snackbar
          open={cancelSuccessSnackbarOpen}
          color="success"
          onClose={() => {
            setCancelSuccessSnackbarOpen(false);
            navigate(`/makerspace/${makerspaceID}/storefront/carts`);
          }}
          message="Cancel process successful. Redirecting back to Cart List..."
          autoHideDuration={5000}
        />
        <Snackbar
          open={cancelErrorSnackbarOpen}
          color="error"
          onClose={() => setCancelErrorSnackbarOpen(false)}
          message="Cancel process failed. Please contact an administrator."
          autoHideDuration={5000}
        />
      </Page>
    </RequestWrapper>
  )
}