import { Loader } from "@googlemaps/js-api-loader";
import { getActiveScript } from "@taj-wf/utils";
import { debounce } from "es-toolkit";

const scriptElement = getActiveScript(import.meta.url);

if (!scriptElement) {
  throw new Error("Search Address script element was not found!");
}

const placesApiKey = scriptElement.getAttribute("data-places-key");

if (!placesApiKey) {
  throw new Error(
    "Places API key was not found in the script element! Please set data-places-key attribute in the script."
  );
}

const loader = new Loader({
  apiKey: placesApiKey,
  version: "weekly",
});

const getAutocompleteSuggestionsFunc = async () => {
  const { AutocompleteSuggestion } = await loader.importLibrary("places");

  const addressQueryCache: Map<string, string[]> = new Map();

  const fetchAddresses = async (query: string, callback: (result: string[]) => void) => {
    const cachedResult = addressQueryCache.get(query);
    if (cachedResult !== undefined) {
      callback(cachedResult);
      return;
    }

    try {
      const request: google.maps.places.AutocompleteRequest = {
        input: query,
        includedRegionCodes: ["ae"],
      };

      const suggestions = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      const result = suggestions.suggestions
        .filter((suggestion) => suggestion.placePrediction != null)
        .map((suggestion) => suggestion.placePrediction!.text.text);

      addressQueryCache.set(query, result);
      callback(result);
    } catch (error) {
      console.error("Something went wrong with places api:", error);
      // Return empty array on error and cache it to avoid repeated failed requests
      const emptyResult: string[] = [];
      addressQueryCache.set(query, emptyResult);
      callback(emptyResult);
    }
  };

  const debouncedFetchAddresses = debounce(fetchAddresses, 100);

  return { fetchAddresses: debouncedFetchAddresses };
};

export const fetchAddresses = getAutocompleteSuggestionsFunc();
