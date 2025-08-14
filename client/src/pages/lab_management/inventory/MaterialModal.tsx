import EditMaterial from "./EditMaterial";
import NewMaterial from "./NewMaterial";
import PrettyModal from "../../../common/PrettyModal";
import { useIsMobile } from "../../../common/IsMobileProvider";

interface MaterialModalProps {
  itemId: string;
  onClose: () => void;
}

export default function MaterialModal({ onClose, itemId }: MaterialModalProps) {
  const isNewItem = itemId.toLocaleLowerCase() === "new";
  const isMobile = useIsMobile();

  return (
    <PrettyModal width={isMobile ? 250 : 800} open={!!itemId} onClose={onClose}>
      {isNewItem ? (
        <NewMaterial onClose={onClose} />
      ) : (
        <EditMaterial itemId={itemId} onClose={onClose} />
      )}
    </PrettyModal>
  );
}
