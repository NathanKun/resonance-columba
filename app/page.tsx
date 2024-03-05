import { CookiesProvider } from "next-client-cookies/server";
import NoSsr from "./components/nossr";
import PricesTable from "./components/prices-table";
import PriceProvider from "./price-provider";

export default function Home() {
  return (
    <NoSsr>
      <PriceProvider>
        <CookiesProvider>
          <PricesTable />
        </CookiesProvider>
      </PriceProvider>
    </NoSsr>
  );
}
