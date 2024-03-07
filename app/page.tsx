import NoSsr from "./components/nossr";
import PricesTable from "./components/prices-table/prices-table";

export default function Home() {
  return (
    <NoSsr>
      <PricesTable />
    </NoSsr>
  );
}
