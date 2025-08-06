import { useCallback, useEffect, useState } from "react";
import { Divider, Stack, Switch } from "@mui/material";
import SearchBar from "../../../common/SearchBar";
import InventoryItem from "../../../types/InventoryItem";
import AddToCartModal from "./AddToCartModal";
import { useImmer } from "use-immer";
import ShoppingCart from "./ShoppingCart";
import { v4 as uuidv4 } from "uuid";
import { gql, useMutation, useQuery } from "@apollo/client";
import RequestWrapper from "../../../common/RequestWrapper";
import { GET_INVENTORY_ITEMS } from "../../../queries/inventoryQueries";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { isAdmin, isManager, isStaff } from "../../../common/PrivilegeUtils";
import Page from "../../Page";
import { ListingCard } from "./ListingCard";
import { ListingModal } from "./ListingModal";
import { useIsMobile } from "../../../common/IsMobileProvider";


const CHECKOUT_ITEMS = gql`
  mutation CheckoutItems($items: [CartItem], $notes: String, $recievingUserID: ID) {
    checkoutItems(items: $items, notes: $notes, recievingUserID: $recievingUserID)
  }
`;

export interface ShoppingCartEntry {
  id: string;
  item: InventoryItem;
  count: number;
  makerspace: number;
}

function updateLocalStorage(cart: ShoppingCartEntry[] | null) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export default function StorefrontPage() {
  const currentUser = useCurrentUser();
  const isMobile = useIsMobile();

  const { loading, error, data } = useQuery(GET_INVENTORY_ITEMS, {variables: {storefrontVisible: isStaff(currentUser) ? null : true}});

  const [checkoutItems] = useMutation(CHECKOUT_ITEMS, {
    refetchQueries: [{ query: GET_INVENTORY_ITEMS }],
  });

  const [searchText, setSearchText] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeItem, setActiveItem] = useState<InventoryItem | undefined>();
  const [addToCartCount, setAddToCartCount] = useState(0);
  const [shoppingCart, setShoppingCart] = useImmer<ShoppingCartEntry[]>([]);

  const [showInternalItems, setShowInternalItems] = useState(false);
  const [showStaffItems, setShowStaffItems] = useState(false);

  function handleShowInternalChange(e: any) {
    setShowInternalItems(!showInternalItems)
  }

  function handleShowStaffChange(e: any) {
    setShowStaffItems(!showStaffItems)
  }

  const getCartFromStorage = useCallback(() => {
    const storedCart = localStorage.getItem("cart");
    const parsedCart = storedCart && JSON.parse(storedCart);
    setShoppingCart(parsedCart || []);
  }, [setShoppingCart]);

  useEffect(() => {
    // Load the cart on page load
    getCartFromStorage();

    // Load the cart whenever localstorage changes
    window.addEventListener("storage", getCartFromStorage);
  }, [getCartFromStorage]);

  const addToShoppingCart = (item: InventoryItem, count: number) =>
    setShoppingCart((draft) => {
      const existing = shoppingCart.find((row) => row.item.id === item.id)
      if (!existing) {
        draft.push({
          id: uuidv4(),
          item,
          count,
          makerspace: 0
        });
      } else {
        existing.count += count;
      }

      updateLocalStorage(draft);
    });

  const removeFromShoppingCart = (id: string) =>
    setShoppingCart((draft) => {
      const index = draft.findIndex((e: ShoppingCartEntry) => e.id === id);
      draft.splice(index, 1);
      updateLocalStorage(draft);
    });

  const setEntryCount = (id: string, newCount: number) =>
    setShoppingCart((draft) => {
      const index = draft.findIndex((e: ShoppingCartEntry) => e.id === id);

      const valid = newCount > 0 && newCount <= draft[index].item.count;
      if (!valid) return;

      draft[index].count = newCount;

      updateLocalStorage(draft);
    });

  const handleCheckout = async (checkoutNotes: string, recievingUserID: number | undefined) => {
    const items: { id: number, count: number }[] = shoppingCart.map((cartItem) => ({ id: cartItem.item.id, count: cartItem.count }));

    await checkoutItems({
      variables: {
        items,
        notes: checkoutNotes,
        recievingUserID
      },
    });

    setShoppingCart(() => []);
    updateLocalStorage([]);
  };

  return (
    <RequestWrapper loading={loading} error={error}>
      <Page title={"Store"} noPadding={isMobile}>
        <ShoppingCart
          entries={shoppingCart}
          removeEntry={removeFromShoppingCart}
          setEntryCount={setEntryCount}
          emptyCart={handleCheckout}
          internal={showInternalItems || showStaffItems}
        />

        { isAdmin(currentUser) &&
        <Stack direction={"row"} sx={{ mb: 2, mt: 8, justifyContent: "space-between" }}>
          <Stack direction={"row"} spacing={2}>
            <Stack direction={"row"} alignItems={"center"}>
              <Switch color="warning" onChange={handleShowInternalChange}></Switch><span> Internal Use Items</span>
            </Stack>
            <Stack direction={"row"} alignItems={"center"}>
              <Switch color="warning" onChange={handleShowStaffChange} disabled={!isManager(currentUser)}></Switch><span> Staff Only Items</span>
            </Stack>
          </Stack>
        </Stack>
        }
        

        <SearchBar
          placeholder="Search inventory"
          sx={{ mb: 2, alignSelf: "flex-start" }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onClear={() => setSearchText("")}
        />

        <Stack direction={"row"} flexWrap={"wrap"} divider={<Divider flexItem />} sx={{ width: "100%" }}>
          {data?.InventoryItems?.filter((item: InventoryItem) =>
            item.name.toLowerCase().includes(searchText.toLowerCase())
            && (!showInternalItems ? item.storefrontVisible : true)
            && ((!isManager(currentUser) && showStaffItems) ? !item.staffOnly : true)
          ).map((item: InventoryItem) => (
            <ListingCard item={item} setActiveItem={(item) => {setActiveItem(item); setShowModal(true)}} openDetailsModal={(item) => {setActiveItem(item); setShowDetailsModal(true)}} />
          ))}
        </Stack>

        {activeItem && showModal && (
          <AddToCartModal
            open
            count={addToCartCount}
            setCount={setAddToCartCount}
            addToCart={() => addToShoppingCart(activeItem, addToCartCount)}
            onClose={() => setShowModal(false)}
            item={activeItem}
          />
        )}
        {activeItem && showDetailsModal && (
          <ListingModal 
            item={activeItem} 
            open
            addToCart={(activeItem: InventoryItem, addToCartCount: number) => addToShoppingCart(activeItem, addToCartCount)}
            onClose={() => setShowDetailsModal(false)} />
        )}
      </Page>
    </RequestWrapper>
  );
}
