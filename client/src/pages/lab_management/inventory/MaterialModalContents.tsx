import { ChangeEvent, useState } from "react";
import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import DeleteMaterialButton from "./DeleteMaterialButton";
import HelpTooltip from "../../../common/HelpTooltip";
import SaveIcon from "@mui/icons-material/Save";
import InventoryItem from "../../../types/InventoryItem";
import { useQuery } from "@apollo/client/react";
import { GET_MAKERSPACES } from "../../../queries/makerspaceQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import { useIsMobile } from "../../../common/IsMobileProvider";
import FileUploadButton from "../../../common/FileUploadButton";

interface InputErrors {
  name?: boolean;
  unit?: boolean;
  pluralUnit?: boolean;
  pricePerUnit?: boolean;
  count?: boolean;
  makerspaceID?: boolean;
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
  makerspaceID: number;
  notes: string;
  description: string;
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

  const makerspacesResult = useQuery(GET_MAKERSPACES);

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
    setItemDraft({ ...itemDraft, notes: String(event.target.value) })
  };

  function handleDescriptionChanged(event: ChangeEvent<HTMLTextAreaElement>): void {
    setItemDraft({ ...itemDraft, description: event.target.value });
  }

  const handleSaveClick = async () => {
    const updatedInputErrors: InputErrors = {
      name: !itemDraft.name,
      unit: !itemDraft.unit,
      pluralUnit: !itemDraft.pluralUnit,
      pricePerUnit: itemDraft.pricePerUnit === undefined,
      count: itemDraft.count === undefined,
      makerspaceID: itemDraft.makerspaceID === undefined,
    };

    setInputErrors(updatedInputErrors);

    const hasInputErrors = Object.values(updatedInputErrors).some((e) => e);
    if (hasInputErrors) return;

    onSave();
  };

  const isMobile = useIsMobile();

  const title = `${isNewItem ? "New" : "Edit"} Material`;

  return (
    <Stack spacing={2}>
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
          <Stack direction={isMobile ? "column" : "row"} justifyContent={isMobile ? "unset" : "space-between"}>
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
          <Stack direction={isMobile ? "column" : "row"} justifyContent={isMobile ? "unset" : "space-between"}>
            <TextField
              label="Count"
              sx={{ width: isMobile ? "100%" : "49%" }}
              type="number"
              value={itemDraft.count ?? ""}
              error={inputErrors.count}
              onChange={handleIntChange("count")}
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ width: isMobile ? "100%" : "49%" }}
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

      {(isNewItem || itemDraft.makerspaceID) &&
        //itemDraft is sometimes empty for a moment during intialization which causes the Select to be empty even after. This prevents such conditions.
        <RequestWrapper loading={makerspacesResult.loading} error={makerspacesResult.error}>
          <Stack direction="row" spacing={2} mt={2}>
            <FormControl fullWidth>
              <InputLabel id="makerspace-select-label">Makerspace</InputLabel>
              <Select labelId="makerspace-select-label" value={itemDraft.makerspaceID} onChange={(e) => setItemDraft({ ...itemDraft, makerspaceID: e.target.value })} error={inputErrors.makerspaceID} label="Makerspace">
                {makerspacesResult.data?.makerspaces.map((space: { id: number, name: string }) => (
                  <MenuItem key={space.id} value={space.id}>{space.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </RequestWrapper>
      }

      <TextField
        aria-label="Notes (Internal)"
        label="Notes (Internal)"
        defaultValue={itemDraft.notes ?? ""}
        value={itemDraft.notes}
        onChange={handleNotesChanged}
      />

      <TextField
        aria-label="Description (Public)"
        label="Description (Public)"
        defaultValue={itemDraft.description ?? ""}
        value={itemDraft.description}
        onChange={handleDescriptionChanged}
      />

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

        <Stack direction={"row"} spacing={2}>
          <FileUploadButton
            variant="contained"
            color="info"
            onUpload={(name: string) => setItemDraft({ ...itemDraft, image: name })}
          />
          <Button
            loading={loading}
            size="large"
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            sx={{ ml: "auto" }}
            onClick={handleSaveClick}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </Stack >
  );
}
