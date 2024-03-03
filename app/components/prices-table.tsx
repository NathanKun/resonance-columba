"use client";

import { CityName, cities } from "@/data/Cities";
import { products } from "@/data/Products";
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { MRT_Localization_ZH_HANS } from "material-react-table/locales/zh-Hans";
import { useContext, useMemo } from "react";
import { PriceContext } from "../price-provider";

interface ProductPrice {
  variation: number;
  trend: string;
  timeDiffInMin: string;
  profit: number;
}

interface ProductRow {
  sourceCity: CityName;
  productName: string;
  source: ProductPrice;
  targetCity: {
    [key: CityName]: ProductPrice;
  };
}

const TrendCell = (props: any) => {
  const { renderedCellValue: value } = props;
  let text,
    background = "";
  if (value === "up") {
    background = "lightgreen";
    text = "↑";
  } else if (value === "down") {
    background = "lightcoral";
    text = "↓";
  }
  return <span style={{ color: "white", background, padding: "5px 10px" }}>{text}</span>;
};

export default function PricesTable() {
  const { prices, setPrice } = useContext(PriceContext);

  // build table rows
  const data = useMemo<ProductRow[]>(() => {
    const result: ProductRow[] = [];

    products.map((product): void => {
      const sourceCity = product.city;
      const productName = product.name;
      let source: ProductPrice;
      const targetCity: { [key: CityName]: ProductPrice } = {};

      cities.forEach((city) => {
        const productPrices = prices[product.name];
        if (!productPrices) {
          return;
        }

        const productPriceFromApi = productPrices[city];
        if (!productPriceFromApi) {
          return;
        }

        const { variation, trend, time } = productPriceFromApi;
        const timeDiffInMin = Math.ceil((Date.now() / 1000 - time._seconds) / 60);
        const productPriceForTable: ProductPrice = {
          variation,
          trend,
          timeDiffInMin: timeDiffInMin + "分钟前",
          profit: Math.round((product.price * variation) / 100),
        };

        if (city === sourceCity) {
          source = productPriceForTable;
        } else {
          targetCity[city] = productPriceForTable;
        }
      });

      result.push({
        sourceCity,
        productName,
        source: source!,
        targetCity,
      });
    });

    return result;
  }, [prices]);

  // build headers
  const columns = useMemo<MRT_ColumnDef<ProductRow>[]>(() => {
    const result: MRT_ColumnDef<ProductRow>[] = cities.map((city) => {
      return {
        id: city + "-group",
        header: city,
        columns: [
          // variation, trend, lastUpdated, profit
          {
            id: `targetCity-${city}-variation`,
            accessorFn: (row: ProductRow) => row.targetCity[city]?.variation,
            header: "价位",
            size: 50,
          },
          {
            id: `targetCity-${city}-trend`,
            accessorFn: (row: ProductRow) => row.targetCity[city]?.trend,
            header: "趋势",
            size: 50,
            Cell: TrendCell,
          },
          {
            id: `targetCity-${city}-time`,
            accessorFn: (row: ProductRow) => row.targetCity[city]?.timeDiffInMin,
            header: "更新",
            size: 50,
          },
          {
            id: `targetCity-${city}-profit`,
            accessorFn: (row: ProductRow) => row.targetCity[city]?.profit,
            header: "利润",
            size: 50,
          },
        ],
      };
    });

    result.unshift({
      id: "source-city-group",
      header: "原产地",
      columns: [
        {
          id: "source-city",
          accessorFn: (row: ProductRow) => row.sourceCity,
          header: "城市",
          enableSorting: false,
          size: 150,
        },
        {
          id: "source-productName",
          accessorFn: (row: ProductRow) => row.productName,
          header: "产品",
          enableSorting: false,
          size: 150,
        },
        {
          id: "source-variation",
          accessorFn: (row: ProductRow) => row.source?.variation,
          header: "价位",
          size: 50,
        },
        {
          id: "source-trend",
          accessorFn: (row: ProductRow) => row.source?.trend,
          header: "趋势",
          size: 50,
          Cell: TrendCell,
        },
        {
          id: "source-time",
          accessorFn: (row: ProductRow) => row.source?.timeDiffInMin,
          header: "更新",
          size: 50,
        },
      ],
    });

    return result;
  }, []);

  const table = useMaterialReactTable({
    data,
    columns,
    enableColumnPinning: true,
    enableGrouping: true,
    enableColumnDragging: false,
    enablePagination: false,
    enableBottomToolbar: false,
    enableDensityToggle: false,
    enableStickyHeader: true,
    initialState: {
      expanded: true,
      grouping: ["source-city"],
      columnPinning: {
        left: ["source-city", "source-productName", "source-variation", "source-trend", "source-time"],
      },
      density: "compact",
    },
    muiTableHeadCellProps: {
      sx: {
        fontSize: "0.8rem",
      },
    },
    muiTableBodyCellProps: {
      sx: {
        fontSize: "0.8rem",
      },
    },
    muiTableHeadRowProps: {
      sx: {
        "&:nth-of-type(2)": {
          top: "35px",
        },
      },
    },
    muiTablePaperProps: {
      sx: {
        height: "calc(100vh - 52px)",
      },
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: "clamp(350px, calc(100vh - 64px - 52px), 9999px)", // minus extra 52px for website header
      },
    },
    localization: MRT_Localization_ZH_HANS,
  });

  return <MaterialReactTable table={table} />;
}
