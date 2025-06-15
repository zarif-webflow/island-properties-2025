import { autoUpdate, computePosition, flip, offset, shift, size } from "@floating-ui/dom";
import { getHtmlElement, setStyle } from "@taj-wf/utils";
import { trackInteractOutside } from "@zag-js/interact-outside";

import { fetchAddresses } from "@/fetchers/autocomplete-suggestion";

const initSearchAddress = () => {
  /*
   * Addressing primary elements
   */
  const addressInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("[data-address-input]")
  );

  if (addressInputs.length === 0) {
    throw new Error(`Address input element([data-address-input]) was not found!`);
  }

  for (const addressInput of addressInputs) {
    const addressResultContainer = addressInput
      .closest("[data-address-container]")
      ?.querySelector<HTMLDivElement>("[data-address-result]");

    if (!addressResultContainer) {
      console.error(`Address result container([data-address-result]) was not found!`);
      continue;
    }

    const addressResultList = getHtmlElement({
      selector: "[data-address-list]",
      parent: addressResultContainer,
    });

    if (!addressResultList) continue;

    const addressResultItem = getHtmlElement({
      selector: "[data-address-item]",
      parent: addressResultList,
    });

    if (!addressResultItem) continue;

    /*
     * UI States
     */
    const modalFragment = document.createDocumentFragment();
    let resultItems: HTMLLIElement[] = [];
    let highlightedIndex = 0;
    // const position: "top" | "bottom" | undefined = undefined;
    // let isModalOpen = false;
    const optionListId = addressResultList.id || "address-result-options";

    let cleanupAutoUpdate: (() => void) | undefined = undefined;
    let cleanupOutsideInteraction: (() => void) | undefined = undefined;

    modalFragment.appendChild(addressResultContainer);
    addressResultContainer.dataset.initialized = "";

    /*
     * State changer callbacks
     */

    const setupInitialAttributes = () => {
      addressInput.type = "search";
      addressInput.ariaAutoComplete = "both";
      addressInput.setAttribute("autocomplete", "off");
      addressInput.setAttribute("autocorrect", "off");
      addressInput.setAttribute("autocapitalize", "off");
      addressInput.setAttribute("spellcheck", "false");
      addressInput.setAttribute("aria-controls", optionListId);

      addressResultList.role = "listbox";
      addressResultList.id = optionListId;

      addressResultContainer.setAttribute("data-initialized", "");
    };

    const setModalPosition = () => {
      computePosition(addressInput, addressResultContainer, {
        placement: "bottom-start",
        middleware: [
          offset(),
          flip(),
          shift(),
          size({
            apply: ({ rects }) => {
              setStyle(addressResultContainer, { width: `${rects.reference.width}px` });
            },
          }),
        ],
      }).then(({ x, y }) => {
        setStyle(addressResultContainer, { left: `${x}px`, top: `${y}px` });
      });
    };

    const setResultItems = (items: HTMLLIElement[]) => {
      resultItems = items;
    };

    const setHighlightedIndex = (index: number) => {
      const prevItem = resultItems[highlightedIndex];
      const currItem = resultItems[index];

      if (prevItem) {
        prevItem.classList.remove("focused");
        prevItem.ariaSelected = "false";
      }

      if (currItem) {
        currItem.classList.add("focused");
        currItem.ariaSelected = "true";
        addressInput.setAttribute("aria-activedescendant", currItem.id);
      }

      highlightedIndex = index;
    };

    let keyboardNavigationCallback: ((e: KeyboardEvent) => void) | undefined = undefined;

    const selectResultItem = (index: number) => {
      const selectedItem = resultItems[index];

      const textElement = getHtmlElement({ selector: "p", parent: selectedItem });

      if (!textElement) return;

      const text = textElement.textContent?.trim();

      if (!text) {
        console.error("Selected result item does not have valid text content!");
        return;
      }

      addressInput.value = text;
      addressInput.focus();
    };

    const closeResultModal = () => {
      modalFragment.appendChild(addressResultContainer);
      addressInput.removeAttribute("aria-activedescendant");

      if (keyboardNavigationCallback !== undefined) {
        document.removeEventListener("keydown", keyboardNavigationCallback);
      }

      //   isModalOpen = false;

      cleanupAutoUpdate?.();
      cleanupOutsideInteraction?.();
    };

    const setupEventListeners = () => {
      /*
       * Click and hover effects
       */
      for (let i = 0; i < resultItems.length; i++) {
        const resultItem = resultItems[i]!;

        resultItem.role = "option";
        resultItem.ariaSelected = "false";
        resultItem.id = `address-suggestion-${i}`;

        resultItem.addEventListener("mouseenter", () => {
          setHighlightedIndex(i);
        });

        resultItem.addEventListener("click", () => {
          selectResultItem(i);
          closeResultModal();
        });
      }

      /*
       * Keyboard navigation
       */

      if (keyboardNavigationCallback !== undefined) {
        document.removeEventListener("keydown", keyboardNavigationCallback);
      }

      keyboardNavigationCallback = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          addressInput.blur();
          selectResultItem(highlightedIndex);
          addressInput.focus();
          closeResultModal();
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex(
            highlightedIndex >= resultItems.length - 1 ? 0 : highlightedIndex + 1
          );
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex(
            highlightedIndex <= 0 ? resultItems.length - 1 : highlightedIndex - 1
          );
        }

        if (e.key === "Escape") {
          e.preventDefault();
          closeResultModal();
        }
      };

      document.addEventListener("keydown", keyboardNavigationCallback);
    };

    const openResultModal = () => {
      document.body.appendChild(addressResultContainer);
      setModalPosition();
      //   isModalOpen = true;

      cleanupAutoUpdate = autoUpdate(addressInput, addressResultContainer, setModalPosition);
      cleanupOutsideInteraction = trackInteractOutside(addressResultContainer, {
        onPointerDownOutside: closeResultModal,
        onInteractOutside: closeResultModal,
        onFocusOutside: closeResultModal,
      });
    };

    const renderAddressList = (addresses: string[]) => {
      addressResultList.innerHTML = "";
      setHighlightedIndex(0);

      if (addresses.length === 0) {
        setResultItems([]);
        return;
      }

      const resultItems: HTMLLIElement[] = [];
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < addresses.length; i++) {
        const listItem = addressResultItem.cloneNode(true) as HTMLLIElement;

        const textElement = getHtmlElement({ selector: "p", parent: listItem });

        if (!textElement) continue;

        textElement.textContent = addresses[i]!;
        textElement.dataset.index = i.toString();

        if (i === 0) {
          listItem.classList.add("focused");
        }

        fragment.appendChild(listItem);
        resultItems.push(listItem);
      }

      addressResultList.appendChild(fragment);

      setResultItems(resultItems);
      setupEventListeners();
    };

    /*
     * Main search event init
     */

    fetchAddresses.then(({ fetchAddresses }) => {
      let mostRecentInputTimestamp: number | undefined = undefined;

      addressInput.addEventListener("input", (e) => {
        const event = e as InputEvent;
        const inputElement = event.target as HTMLInputElement;

        const value = inputElement.value;

        const currentTimestamp = Date.now();
        mostRecentInputTimestamp = currentTimestamp;

        if (value === "") {
          renderAddressList([]);
          closeResultModal();
          return;
        }

        fetchAddresses(value, (result: string[]) => {
          if (
            mostRecentInputTimestamp !== undefined &&
            mostRecentInputTimestamp !== currentTimestamp
          )
            return;
          renderAddressList(result);

          if (result.length === 0) {
            closeResultModal();
            return;
          }

          openResultModal();
        });
      });
    });

    /*
     * Initial render
     */

    setupInitialAttributes();
    renderAddressList([]);
  }
};

initSearchAddress();
