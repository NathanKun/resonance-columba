"use client";

import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import { ProductRow, ProductRowCityPrice, SelectedCities } from "@/interfaces/prices-table";
import { Trend } from "@/interfaces/trend";
import { calculateProfit, highestProfitCity, isCraftableProduct } from "@/utils/price-utils";
import { MRT_Cell, MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { MRT_Localization_ZH_HANS } from "material-react-table/locales/zh-Hans";
import { useCallback, useContext, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import { PriceContext } from "../../price-provider";
import MultipleSelect from "./multiple-select";
import TrendCell from "./trend-cell";
import TrendInput from "./trend-input";
import VariationCell from "./variation-cell";
import VariationInput from "./variation-input";

export default function PricesTable() {
  const { prices, setPrice } = useContext(PriceContext);
  const [cookie, setCookie] = useCookies(["selectedCities"]);
  const [selectedCities, setSelectedCities] = useState<SelectedCities>(
    cookie.selectedCities ?? { sourceCities: [CITIES[0]], targetCities: [CITIES[1]] }
  );

  const updateSelectedCitiesCookieAndState = useCallback(
    (newSelectedCities: SelectedCities) => {
      const newStr = JSON.stringify(newSelectedCities);
      setCookie("selectedCities", newStr);
      setSelectedCities(newSelectedCities);
    },
    [setCookie]
  );

  const setSourceCities = useCallback(
    (selected: CityName[]) => {
      const newSelectedCities = { ...selectedCities, sourceCities: selected };
      updateSelectedCitiesCookieAndState(newSelectedCities);
    },
    [selectedCities, updateSelectedCitiesCookieAndState]
  );

  const setTargetCities = useCallback(
    (selected: CityName[]) => {
      const newSelectedCities = { ...selectedCities, targetCities: selected };
      updateSelectedCitiesCookieAndState(newSelectedCities);
    },
    [selectedCities, updateSelectedCitiesCookieAndState]
  );

  // build table rows
  const data = useMemo<ProductRow[]>(() => {
    const result: ProductRow[] = [];

    PRODUCTS.map((product): void => {
      const buyableCities: CityName[] = product.buyPrices ? Object.keys(product.buyPrices) : [];

      for (const sourceCity of buyableCities) {
        if (!selectedCities.sourceCities.includes(sourceCity)) {
          return;
        }

        const productName = product.name;
        let source;
        const targetCity: { [key: CityName]: ProductRowCityPrice } = {};

        CITIES.forEach((currentColumnCity) => {
          const productPrices = prices[product.name];
          if (!productPrices) {
            return;
          }

          const isBuyableCity = sourceCity === currentColumnCity;

          const productPriceFromApi = isBuyableCity
            ? productPrices.buy?.[currentColumnCity]
            : productPrices.sell?.[currentColumnCity]; // sell/buy is player's perspective
          if (!productPriceFromApi) {
            return;
          }

          const { variation, trend, time } = productPriceFromApi;
          let timeDiffNum = Math.ceil((Date.now() / 1000 - time._seconds) / 60); // in minutes
          let timeDiff: string;
          if (timeDiffNum >= 60) {
            timeDiffNum = timeDiffNum / 60;
            timeDiff = timeDiffNum.toFixed(1) + "小时前";
          } else {
            timeDiff = timeDiffNum + "分钟前";
          }

          // calculate profit
          const profit = calculateProfit(product, currentColumnCity, sourceCity, isBuyableCity, prices);

          const productPriceForTable: ProductRowCityPrice = {
            variation,
            trend,
            timeDiff,
            singleProfit: profit,
            lotProfit: profit * (product.buyLot?.[sourceCity] ?? 0),
          };

          if (isBuyableCity) {
            source = productPriceForTable;
          } else {
            targetCity[currentColumnCity] = productPriceForTable;
          }
        });

        result.push({
          sourceCity,
          buyableCities,
          productName,
          source,
          targetCity,
          craftable: isCraftableProduct(productName),
        });
      }
    });

    return result;
  }, [selectedCities.sourceCities, prices]);

  const getVariationCellColor = (cell: MRT_Cell<ProductRow, unknown>) => {
    if (cell.getIsAggregated()) {
      return null;
    }

    const value = cell.getValue();
    let background = "";
    if (Number.isInteger(value)) {
      if ((value as number) > 100) {
        background = "lightgreen";
      } else if (value === 100) {
        background = "lightgray";
      } else {
        background = "lightcoral";
      }
    }

    return background;
  };

  const getVariationCellMuiProps = useCallback((props: { cell: MRT_Cell<ProductRow, unknown> }) => {
    const cell = props.cell;
    const color = getVariationCellColor(cell);
    return {
      sx: {
        backgroundColor: color,
        "&:before": {
          backgroundColor: `${color} !important`,
        },
        fontSize: "0.7rem",
        textAlign: "center",
        padding: "0",
      },
    };
  }, []);

  // build headers
  const columns = useMemo<MRT_ColumnDef<ProductRow>[]>(() => {
    const result: MRT_ColumnDef<ProductRow>[] =
      CITIES.map((city: CityName) => {
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
              Cell: VariationCell,
              muiTableBodyCellProps: getVariationCellMuiProps,
              Edit: ({ cell, column, row, table }) => {
                const cancel = () => {
                  table.setEditingCell(null);
                };
                const rowData = row.original;
                const { productName, buyableCities } = rowData;

                // won't sell the product in its buyable city, so no need to edit variation
                if (buyableCities.includes(city)) {
                  return null;
                }

                const save = (newVaraition: number) => {
                  row._valuesCache[column.id] = newVaraition;
                  setPrice({ product: productName, city, variation: newVaraition, type: "sell" });
                  table.setEditingCell(null);
                };
                return <VariationInput value={cell.getValue()} save={save} cancel={cancel} />;
              },
            },
            {
              id: `targetCity-${city}-trend`,
              accessorFn: (row: ProductRow) => row.targetCity[city]?.trend,
              header: "趋势",
              size: 50,
              Cell: TrendCell,
              muiTableBodyCellProps: {
                sx: {
                  padding: "0",
                  textAlign: "center",
                },
              },
              Edit: ({ cell, column, row, table }) => {
                const rowData = row.original;
                const { productName, buyableCities } = rowData;

                // won't sell the product in its buyable city, so no need to edit trend
                if (buyableCities.includes(city)) {
                  return null;
                }

                const save = (newTrend: Trend) => {
                  row._valuesCache[column.id] = newTrend;
                  setPrice({ product: productName, city, trend: newTrend, type: "sell" });
                  table.setEditingCell(null);
                };

                return <TrendInput value={cell.getValue()} save={save} />;
              },
            },
            {
              id: `targetCity-${city}-time`,
              accessorFn: (row: ProductRow) => row.targetCity[city]?.timeDiff,
              header: "更新",
              size: 50,
              enableEditing: false,
            },
            {
              id: `targetCity-${city}-singleprofit`,
              accessorFn: (row: ProductRow) => row.targetCity[city]?.singleProfit,
              header: "单个利润",
              size: 50,
              enableEditing: false,
            },
            {
              id: `targetCity-${city}-lotprofit`,
              accessorFn: (row: ProductRow) => row.targetCity[city]?.lotProfit,
              header: "单批利润",
              size: 50,
              enableEditing: false,
            },
          ],
        } as MRT_ColumnDef<ProductRow>;
      }) ?? [];

    // highest profit group
    result.unshift({
      id: "highest-profit-group",
      header: "最高利润",

      columns: [
        {
          id: "highest-profit-single",
          accessorFn: (row: ProductRow) => highestProfitCity(row),
          header: "单个",
          size: 50,
          enableEditing: false,
          Cell: (props: any) => {
            const { renderedCellValue: city, row } = props;
            const profit = row.original.targetCity?.[city]?.singleProfit;
            if (!city || !profit) {
              return null;
            }
            return (
              <span>
                {profit} {city}
              </span>
            );
          },
          sortingFn: (rowA, rowB, columnId) => {
            const productRow1 = rowA.original;
            const productRow2 = rowB.original;
            const city1 = highestProfitCity(productRow1);
            const city2 = highestProfitCity(productRow2);
            const profit1 = productRow1.targetCity[city1]?.singleProfit ?? 0;
            const profit2 = productRow2.targetCity[city2]?.singleProfit ?? 0;
            return profit1 - profit2;
          },
        },
        {
          id: "highest-profit-lot",
          accessorFn: (row: ProductRow) => {
            const city = highestProfitCity(row);
            return city;
          },
          header: "单批",
          size: 50,
          enableEditing: false,
          Cell: (props: any) => {
            const { renderedCellValue: city, row } = props;
            const profit = row.original.targetCity?.[city]?.lotProfit;
            if (!city || !profit) {
              return null;
            }
            return (
              <span>
                {profit} {city}
              </span>
            );
          },
          sortingFn: (rowA, rowB, columnId) => {
            const productRow1 = rowA.original;
            const productRow2 = rowB.original;
            const city1 = highestProfitCity(productRow1);
            const city2 = highestProfitCity(productRow2);
            const profit1 = productRow1.targetCity[city1]?.lotProfit ?? 0;
            const profit2 = productRow2.targetCity[city2]?.lotProfit ?? 0;
            return profit1 - profit2;
          },
        },
      ],
    });

    // source city group
    result.unshift({
      id: "source-city-group",
      header: "原产地",
      columns: [
        {
          id: "source-city",
          accessorFn: (row: ProductRow) => row.sourceCity,
          header: "城市",
          enableSorting: false,
          size: 50,
          enableEditing: false,
        },
        {
          id: "source-productName",
          accessorFn: (row: ProductRow) => row.productName,
          header: "产品",
          enableSorting: false,
          size: 50,
          enableEditing: false,
        },
        {
          id: "source-variation",
          accessorFn: (row: ProductRow) => row.source?.variation,
          header: "价位",
          size: 50,
          Cell: VariationCell,
          muiTableBodyCellProps: getVariationCellMuiProps,
          Edit: ({ cell, column, row, table }) => {
            const save = (newVaraition: number) => {
              row._valuesCache[column.id] = newVaraition;
              const rowData = row.original;
              const { productName, sourceCity } = rowData;
              setPrice({ product: productName, city: sourceCity, variation: newVaraition, type: "buy" });
              table.setEditingCell(null);
            };
            const cancel = () => {
              table.setEditingCell(null);
            };

            // craftable product don't have variation
            if (row.original.craftable) {
              cancel();
              return null;
            }

            return <VariationInput value={cell.getValue()} save={save} cancel={cancel} />;
          },
        },
        {
          id: "source-trend",
          accessorFn: (row: ProductRow) => row.source?.trend,
          header: "趋势",
          size: 50,
          Cell: TrendCell,
          muiTableBodyCellProps: {
            sx: {
              padding: "0",
              textAlign: "center",
            },
          },
          Edit: ({ cell, column, row, table }) => {
            const save = (newTrend: Trend) => {
              row._valuesCache[column.id] = newTrend;
              const rowData = row.original;
              const { productName, sourceCity } = rowData;
              setPrice({ product: productName, city: sourceCity, trend: newTrend, type: "buy" });
              table.setEditingCell(null);
            };

            // craftable product don't have trend
            if (row.original.craftable) {
              table.setEditingCell(null);
              return;
            }

            return <TrendInput value={cell.getValue()} save={save} />;
          },
        },
        {
          id: "source-time",
          accessorFn: (row: ProductRow) => row.source?.timeDiff,
          header: "更新",
          size: 50,
          enableEditing: false,
        },
      ],
    });

    return result;
  }, [getVariationCellMuiProps, setPrice]);

  const columnVisibility = useMemo(() => {
    const visibleCities = selectedCities.targetCities;
    const invisibleCities = CITIES.filter((city) => !visibleCities?.includes(city));
    const result: { [key: string]: boolean } = {};
    invisibleCities.forEach((city) => {
      result[city + "-group"] = false;
      result[`targetCity-${city}-variation`] = false;
      result[`targetCity-${city}-trend`] = false;
      result[`targetCity-${city}-time`] = false;
      result[`targetCity-${city}-singleprofit`] = false;
      result[`targetCity-${city}-lotprofit`] = false;
    });
    return result;
  }, [selectedCities.targetCities]);

  const renderCitySelects = useCallback(() => {
    return (
      <div>
        <MultipleSelect
          label="原产地"
          name="sourceCities"
          allOptions={CITIES}
          selectedOptions={selectedCities.sourceCities}
          handleChange={(event: any) => setSourceCities(event.target.value)}
        />
        <MultipleSelect
          label="目标城市"
          name="targetCities"
          allOptions={CITIES}
          selectedOptions={selectedCities.targetCities}
          handleChange={(event: any) => setTargetCities(event.target.value)}
        />
      </div>
    );
  }, [selectedCities.sourceCities, selectedCities.targetCities, setSourceCities, setTargetCities]);

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
    enableColumnFilters: false,
    enableEditing: true,
    editDisplayMode: "cell",
    positionToolbarAlertBanner: "none",
    renderTopToolbarCustomActions: renderCitySelects,
    initialState: {
      expanded: true,
      grouping: ["source-city"],
      columnPinning: {
        left: ["source-city", "source-productName", "source-variation", "source-trend", "source-time"],
      },
      density: "compact",
    },
    state: {
      columnVisibility,
    },

    displayColumnDefOptions: {
      "mrt-row-expand": {
        size: 50,
      },
    },
    muiTableHeadCellProps: ({ column }) => ({
      sx: {
        fontSize: "0.7rem",
        backgroundColor: column.getIsPinned() ? "#f5f5f5" : "inherit",
        borderLeft: "1px solid rgba(224, 224, 224, 1)",
        borderRight: "1px solid rgba(224, 224, 224, 1)",
        "& .MuiBadge-root": {
          display: "none",
        },
      },
    }),
    muiTableBodyCellProps: {
      sx: {
        fontSize: "0.7rem",
        lineHeight: "0.8rem",
        borderLeft: "1px solid rgba(224, 224, 224, 1)",
        borderRight: "1px solid rgba(224, 224, 224, 1)",
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
