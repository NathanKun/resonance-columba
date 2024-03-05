import NoSsr from "./components/nossr";
import PricesTable from "./components/prices-table/prices-table";
import PriceProvider from "./price-provider";

export default function Home() {
  return (
    <PriceProvider>
      <NoSsr>
        <PricesTable />
      </NoSsr>
    </PriceProvider>
  );
}
