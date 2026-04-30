import { useQuery } from "@apollo/client/react";
import { GET_TOOL_ITEM_INSTANCE } from "../../../queries/toolItemQueries";
import { ToolItemType } from "../../../types/ToolItem";
import { ToolItemInstanceModal } from "./ToolItemInstanceModal";


export function EditToolItemInstanceModal({itemID, type}: {itemID: number, type: ToolItemType}) {
    const getInstance = useQuery(GET_TOOL_ITEM_INSTANCE, {variables: {id: itemID}});

    if (getInstance.loading || getInstance.error || !getInstance.data) return (<></>);
    return (
        <ToolItemInstanceModal item={getInstance.data.toolItemInstance} type={type} />
    );
}

export function CreateToolItemInstanceModal({type}: {type: ToolItemType}) {
    return (
        <ToolItemInstanceModal item={undefined} type={type} />
    );
}