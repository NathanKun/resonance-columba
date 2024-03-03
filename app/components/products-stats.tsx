import { products } from "@/data/Products";
import ProductStats from "./product-stats";

export default function ProductsStats(props: any) {
  return (
    <>
      {products.map((p) => {
        const product = p.name;
        return <ProductStats key={product} product={product} />;
      })}
    </>
  );
}
