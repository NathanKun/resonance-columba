"use client";

import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import useSelectedCities from "@/hooks/useSelectedCities";
import { ProductRow, ProductRowCityPrice } from "@/interfaces/prices-table";
import { Trend } from "@/interfaces/trend";
import { isCraftableProduct } from "@/utils/price-utils";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { IconButton, ThemeProvider, alpha, darken, lighten, useTheme } from "@mui/material";
import {
  MRT_Cell,
  MRT_Column,
  MRT_Row,
  MRT_TableInstance,
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { MRT_Localization_ZH_HANS } from "material-react-table/locales/zh-Hans";
import { useCallback, useContext, useMemo, useState } from "react";
import { PriceContext } from "../../price-provider";
import MultipleSelect from "./multiple-select";
import TrendCell from "./trend-cell";
import TrendInput from "./trend-input";
import VariationCell from "./variation-cell";
import VariationInput from "./variation-input";

export default function PricesTable() {
  const { prices, setPrice } = useContext(PriceContext);
  const { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities } = useSelectedCities({
    localStorageKey: "selectedCities",
  });
  const theme = useTheme();

  const baseBackgroundColor =
    theme.palette.mode === "dark" ? lighten(theme.palette.background.default, 0.05) : theme.palette.background.default;
  const cellBorderStyle =
    theme.palette.mode === "dark" ? "1px solid rgba(31, 41, 55, 1)" : "1px solid rgba(224, 224, 224, 1)";

  // build table rows
  const data = useMemo<ProductRow[]>(() => {
    const result: ProductRow[] = [];

    PRODUCTS.map((product): void => {
      const buyableCities: CityName[] = product.buyPrices ? Object.keys(product.buyPrices) : [];

      for (const sourceCity of buyableCities) {
        if (!selectedCities.sourceCities.includes(sourceCity)) {
          continue;
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

          const { variation, trend, time, price } = productPriceFromApi;
          let timeDiffNum = Math.ceil((Date.now() / 1000 - time) / 60); // in minutes
          let timeDiff: string;
          if (timeDiffNum >= 60) {
            timeDiffNum = timeDiffNum / 60;
            timeDiff = timeDiffNum.toFixed(1) + "小时";
          } else {
            timeDiff = timeDiffNum + "分钟";
          }

          const productPriceForTable: ProductRowCityPrice = {
            variation,
            trend,
            timeDiff,
            price: price!,
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

  const getVariationCellColor = useCallback(
    (cell: MRT_Cell<ProductRow, unknown>) => {
      if (cell.getIsAggregated()) {
        return null;
      }

      const value = cell.getValue();
      let background = "";
      if (Number.isInteger(value)) {
        if ((value as number) > 100) {
          background = theme.palette.mode === "dark" ? "darkgreen" : "lightgreen";
        } else if (value === 100) {
          background = theme.palette.mode === "dark" ? "darkgrey" : "lightgrey";
        } else {
          background = theme.palette.mode === "dark" ? "darkred" : "lightcoral";
        }
      }

      return background;
    },
    [theme.palette.mode]
  );

  const getVariationCellMuiProps = useCallback(
    (props: { cell: MRT_Cell<ProductRow, unknown> }) => {
      const cell = props.cell;
      const color = getVariationCellColor(cell);
      return {
        sx: {
          backgroundColor: color,
          "&:before": {
            backgroundColor: `${color} !important`,
          },
          textAlign: "center",
          padding: "0",
        },
      };
    },
    [getVariationCellColor]
  );

  // build headers
  const columns = useMemo<MRT_ColumnDef<ProductRow>[]>(() => {
    const result: MRT_ColumnDef<ProductRow>[] =
      CITIES.map((city: CityName) => {
        return {
          id: city + "-group",
          header: city,
          columns: [
            // variation, trend, price, lastUpdated
            {
              id: `targetCity-${city}-variation`,
              accessorFn: (row: ProductRow) => row.targetCity[city]?.variation,
              header: "价位",
              size: 50,
              Cell: VariationCell,
              muiTableBodyCellProps: getVariationCellMuiProps,
              Edit: ({ cell, column, row, table }: MRT_EditFunctionProps) => {
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
              Edit: ({ cell, column, row, table }: MRT_EditFunctionProps) => {
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
              id: `targetCity-${city}-price`,
              accessorFn: (row: ProductRow) => row.targetCity[city]?.price,
              header: "价格",
              size: 50,
              enableEditing: false,
              muiTableBodyCellProps: {
                sx: {
                  textAlign: "right",
                },
              },
            },
          ],
        } as MRT_ColumnDef<ProductRow>;
      }) ?? [];

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
          Edit: ({ cell, column, row, table }: MRT_EditFunctionProps) => {
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
              return <>制造</>;
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
          Edit: ({ cell, column, row, table }: MRT_EditFunctionProps) => {
            const save = (newTrend: Trend) => {
              row._valuesCache[column.id] = newTrend;
              const rowData = row.original;
              const { productName, sourceCity } = rowData;
              setPrice({ product: productName, city: sourceCity, trend: newTrend, type: "buy" });
              table.setEditingCell(null);
            };

            // craftable product don't have trend
            if (row.original.craftable) {
              return null;
            }

            return <TrendInput value={cell.getValue()} save={save} />;
          },
        },
        {
          id: "source-price",
          accessorFn: (row: ProductRow) => row.source?.price,
          header: "价格",
          size: 50,
          enableEditing: false,
          muiTableBodyCellProps: {
            sx: {
              textAlign: "right",
            },
          },
        },
        {
          id: "source-time",
          accessorFn: (row: ProductRow) => row.source?.timeDiff,
          header: "更新",
          size: 50,
          enableEditing: false,
          muiTableBodyCellProps: {
            sx: {
              textAlign: "right",
            },
          },
        },
      ],
    });

    return result;
  }, [getVariationCellMuiProps, setPrice]);

  const baseColumnVisibility = useMemo(() => {
    const visibleCities = selectedCities.targetCities;
    const invisibleCities = CITIES.filter((city) => !visibleCities?.includes(city));
    const result: { [key: string]: boolean } = {};
    invisibleCities.forEach((city) => {
      result[city + "-group"] = false;
      result[`targetCity-${city}-variation`] = false;
      result[`targetCity-${city}-trend`] = false;
      result[`targetCity-${city}-time`] = false;
      result[`targetCity-${city}-price`] = false;
    });
    return result;
  }, [selectedCities.targetCities]);

  const [manualVisibilityOverride, setManualVisibilityOverride] = useState<{ [key: string]: boolean }>({});
  const onColumnVisibilityChange = (updater: any): void => {
    const newSettings = updater();
    setManualVisibilityOverride({ ...manualVisibilityOverride, ...newSettings });
  };

  const columnVisibility = useMemo(() => {
    // merge base visibility with manual override
    // except if a column is already false in base, don't allow it to be true
    const result = { ...baseColumnVisibility };
    Object.keys(manualVisibilityOverride).forEach((key) => {
      if (baseColumnVisibility[key] === false) {
        return;
      }
      result[key] = manualVisibilityOverride[key];
    });
    return result;
  }, [baseColumnVisibility, manualVisibilityOverride]);

  const renderCitySelects = useCallback(() => {
    return (
      <div>
        <MultipleSelect
          label="原产地"
          name="sourceCities"
          allOptions={CITIES}
          selectedOptions={selectedCities.sourceCities}
          handleChange={(selected: CityName[]) => setSourceCities(selected)}
        />
        <MultipleSelect
          label="目标城市"
          name="targetCities"
          allOptions={CITIES}
          selectedOptions={selectedCities.targetCities}
          handleChange={(selected: CityName[]) => setTargetCities(selected)}
        />
        <IconButton onClick={switchSourceAndTargetCities} size="small">
          <SyncAltIcon />
        </IconButton>
      </div>
    );
  }, [
    selectedCities.sourceCities,
    selectedCities.targetCities,
    setSourceCities,
    setTargetCities,
    switchSourceAndTargetCities,
  ]);

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
        left: ["source-city", "source-productName", "source-variation", "source-trend", "source-price", "source-time"],
      },
      density: "compact",
    },
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange,

    displayColumnDefOptions: {
      "mrt-row-expand": {
        size: 50,
      },
    },
    muiTableHeadCellProps: () => ({
      sx: {
        borderLeft: cellBorderStyle,
        borderRight: cellBorderStyle,
        "& .MuiBadge-root": {
          display: "none",
        },
      },
    }),
    muiTableBodyCellProps: {
      sx: {
        lineHeight: "0.8rem",
        borderLeft: cellBorderStyle,
        borderRight: cellBorderStyle,
      },
    },
    muiTableHeadRowProps: {
      sx: {
        "&:nth-of-type(2)": {
          top: "31px",
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
    mrtTheme: {
      baseBackgroundColor,
      draggingBorderColor: theme.palette.primary.main,
      matchHighlightColor:
        theme.palette.mode === "dark"
          ? darken(theme.palette.warning.dark, 0.25)
          : lighten(theme.palette.warning.light, 0.5),
      menuBackgroundColor: lighten(baseBackgroundColor, 0.07),
      pinnedRowBackgroundColor: alpha(theme.palette.primary.main, 0.1),
      selectedRowBackgroundColor: alpha(theme.palette.primary.main, 0.2),
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <MaterialReactTable table={table} />
    </ThemeProvider>
  );
}

interface MRT_EditFunctionProps {
  cell: MRT_Cell<ProductRow, unknown>;
  column: MRT_Column<ProductRow, unknown>;
  row: MRT_Row<ProductRow>;
  table: MRT_TableInstance<ProductRow>;
}
