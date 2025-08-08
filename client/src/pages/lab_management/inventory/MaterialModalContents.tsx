import { ChangeEvent, useEffect, useState } from "react";
import {
  Button,
  InputAdornment,
  Stack,
  TextareaAutosize,
  TextField,
  Typography,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import DeleteMaterialButton from "./DeleteMaterialButton";
import HelpTooltip from "../../../common/HelpTooltip";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import InventoryItem from "../../../types/InventoryItem";
import AdminPage from "../../AdminPage";

interface InputErrors {
  name?: boolean;
  unit?: boolean;
  pluralUnit?: boolean;
  pricePerUnit?: boolean;
  count?: boolean;
}

export interface InventoryItemInput {
  image: string;
  name: string;
  labels: string[];
  unit: string;
  pluralUnit: string;
  count: number;
  pricePerUnit: number;
  threshold: number;
  notes: string;
}

interface MaterialPageProps {
  isNewItem: boolean;
  itemDraft: Partial<InventoryItem>;
  setItemDraft: (i: Partial<InventoryItem>) => void;
  onSave: () => void;
  onDelete: () => void;
  loading: boolean;
}

export default function MaterialModalContents({
  isNewItem,
  itemDraft,
  setItemDraft,
  onSave,
  onDelete,
  loading,
}: MaterialPageProps) {
  const [inputErrors, setInputErrors] = useState<InputErrors>({});

  const handleStringChange =
    (property: keyof InventoryItemInput) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setItemDraft({ ...itemDraft, [property]: e.target.value });

  const handleIntChange =
    (property: keyof InventoryItemInput) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) {
        setItemDraft({ ...itemDraft, [property]: undefined });
        return;
      }
      const parsed = parseInt(e.target.value);
      setItemDraft({ ...itemDraft, [property]: Math.max(parsed, 0) });
    };

  const handleMoneyChange =
    (property: keyof InventoryItemInput) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) {
        setItemDraft({ ...itemDraft, [property]: undefined });
        return;
      }
      const parsed = parseFloat(e.target.value);
      const positive = Math.max(parsed, 0);
      const rounded = Math.round(positive * 100) / 100;
      setItemDraft({ ...itemDraft, [property]: rounded });
    };

    const handleNotesChanged = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setItemDraft({...itemDraft, notes: String(event.target.value)})
    };

  const handleSaveClick = async () => {
    const updatedInputErrors: InputErrors = {
      name: !itemDraft.name,
      unit: !itemDraft.unit,
      pluralUnit: !itemDraft.pluralUnit,
      pricePerUnit: itemDraft.pricePerUnit === undefined,
      count: itemDraft.count === undefined,
    };

    setInputErrors(updatedInputErrors);

    const hasInputErrors = Object.values(updatedInputErrors).some((e) => e);
    if (hasInputErrors) return;

    onSave();
  };

  const [width, setWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
      setWidth(window.innerWidth);
  }
  useEffect(() => {
      window.addEventListener('resize', handleWindowSizeChange);
      return () => {
          window.removeEventListener('resize', handleWindowSizeChange);
      }
  }, []);
  const isMobile = width <= 1100;


  const title = `${isNewItem ? "New" : "Edit"} Material`;

  return (
    <AdminPage title={""} maxWidth="1250px">
      <Typography variant="h5" mb={2}>
        {title}
      </Typography>
      <Stack direction="row" spacing={2}>
        <Stack spacing={2} flexGrow={1}>
          <TextField
            label="Name"
            value={itemDraft.name ?? ""}
            error={inputErrors.name}
            onChange={handleStringChange("name")}
          />
          <Stack direction={isMobile ? "column" : "row"} spacing={2}>
            <TextField
              label="Single unit"
              value={itemDraft.unit ?? ""}
              error={inputErrors.unit}
              onChange={handleStringChange("unit")}
            />
            <TextField
              label="Plural unit"
              value={itemDraft.pluralUnit ?? ""}
              error={inputErrors.pluralUnit}
              onChange={handleStringChange("pluralUnit")}
            />
            <TextField
              label="Price per unit"
              type="number"
              value={itemDraft.pricePerUnit ?? ""}
              error={inputErrors.pricePerUnit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              onChange={handleMoneyChange("pricePerUnit")}
            />
          </Stack>
          <Stack direction={isMobile ? "column" : "row"} spacing={2}>
            <TextField
              label="Count"
              sx={{ flex: 1 }}
              type="number"
              value={itemDraft.count ?? ""}
              error={inputErrors.count}
              onChange={handleIntChange("count")}
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ flex: 1 }}
            >
              <TextField
                label="Threshold"
                type="number"
                sx={{ flex: 1 }}
                value={itemDraft.threshold ?? ""}
                onChange={handleIntChange("threshold")}
              />
              <HelpTooltip
                title={
                  'If the count falls below this number, this item will appear in the "Running Low" section on the inventory page. Leave at 0 for no threshold.'
                }
              />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      <TextareaAutosize 
        style={{background: "none", fontFamily: "Roboto", fontSize: "1em", lineHeight: "2em", marginTop: "2em", marginBottom: "2em"}}
        aria-label="Notes" 
        defaultValue={itemDraft.notes ?? ""} 
        placeholder="Notes" 
        value={itemDraft.notes} 
        onChange={handleNotesChanged}></TextareaAutosize>

      <Stack direction={isMobile ? "column" : "row"} justifyContent="space-between" mt={4}>
        {!isNewItem && (
          <Stack direction="row" spacing={2}>
            <DeleteMaterialButton
              onDelete={onDelete}
            />

            <Button variant="outlined" startIcon={<HistoryIcon />}>
              View Logs
            </Button>
          </Stack>
        )}

        <LoadingButton
          loading={loading}
          size="large"
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{ ml: "auto" }}
          onClick={handleSaveClick}
        >
          Save
        </LoadingButton>
      </Stack>
    </AdminPage>
  );
}
