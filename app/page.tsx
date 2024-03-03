import PricesTable from "./components/prices-table";
import PriceProvider from "./price-provider";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <PriceProvider>
      <PricesTable />
    </PriceProvider>
  );
}
