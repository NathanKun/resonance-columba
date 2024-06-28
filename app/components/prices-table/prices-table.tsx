"use client";

import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import useColumnVisibilityOverride from "@/hooks/useColumnVisibilityOverride";
import useSelectedCities from "@/hooks/useSelectedCities";
import { ProductRow, ProductRowCityPrice } from "@/interfaces/prices-table";
import { Trend } from "@/interfaces/trend";
import { calculateProfit, highestProfitCity, isCraftOnlyProduct } from "@/utils/price-utils";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import PaletteIcon from "@mui/icons-material/Palette";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { IconButton, alpha, darken, lighten, useTheme } from "@mui/material";
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
import TrendCell, { getTrendIcon } from "./trend-cell";
import TrendInput from "./trend-input";
import VariationCell from "./variation-cell";
import VariationInput from "./variation-input";

export default function PricesTable() {
  const { prices, setPrice } = useContext(PriceContext);
  const { selectedCities, setSourceCities, setTargetCities, switchSourceAndTargetCities, copySourceToTargetCities } =
    useSelectedCities({
      localStorageKey: "selectedCities",
    });
  const theme = useTheme();

  const baseBackgroundColor =
    theme.palette.mode === "dark" ? lighten(theme.palette.background.default, 0.05) : theme.palette.background.default;
  const cellBorderStyle =
    theme.palette.mode === "dark" ? "1px solid rgba(31, 41, 55, 1)" : "1px solid rgba(224, 224, 224, 1)";

  const [trendCellColorDisabled, setTrendCellColorDisabled] = useState(false);
  const onTrendCellColorButtonClick = useCallback(() => {
    setTrendCellColorDisabled(!trendCellColorDisabled);
  }, [trendCellColorDisabled]);

  // build table rows
  const data = useMemo<ProductRow[]>(() => {
    const result: ProductRow[] = [];

    PRODUCTS.map((product): void => {
      const productName = product.name;
      const buyableCities: CityName[] = product.buyPrices ? Object.keys(product.buyPrices) : [];
      const craftable = isCraftOnlyProduct(productName);

      for (const sourceCity of buyableCities) {
        if (!selectedCities.sourceCities.includes(sourceCity)) {
          continue;
        }

        let source;
        const targetCity: { [key: CityName]: ProductRowCityPrice } = {};

        CITIES.forEach((currentColumnCity) => {
          const productPrices = prices[product.name];
          if (!productPrices) {
            return;
          }

          const isBuyableCity = sourceCity === currentColumnCity;

          const productPriceFromApi =
            isBuyableCity && !craftable // in case of cratable, is has no buy price in it's source city but it can be sold in it's source city
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

          // calculate profit
          const profit = calculateProfit(product, currentColumnCity, sourceCity, isBuyableCity, prices);

          const productPriceForTable: ProductRowCityPrice = {
            variation,
            trend,
            timeDiff,
            singleProfit: profit,
            price: price!,
          };

          if (isBuyableCity && !craftable) {
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
          craftable,
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

      if (trendCellColorDisabled) {
        return null;
      }

      const value = cell.getValue();
      let background = "";
      if (Number.isInteger(value)) {
        if ((value as number) > 100) {
          background = theme.palette.variationHigh[theme.palette.mode];
        } else if (value === 100) {
          background = theme.palette.variationMedium[theme.palette.mode];
        } else {
          background = theme.palette.variationLow[theme.palette.mode];
        }
      }

      return background;
    },
    [
      theme.palette.mode,
      theme.palette.variationHigh,
      theme.palette.variationLow,
      theme.palette.variationMedium,
      trendCellColorDisabled,
    ]
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
            // variation, trend, price, lastUpdated, profit
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

                // won't sell the product in its buyable city, so no need to edit variation, except craftable product
                if (buyableCities.includes(city) && !rowData.craftable) {
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

                // won't sell the product in its buyable city, so no need to edit trend, except craftable product
                if (buyableCities.includes(city) && !rowData.craftable) {
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
              header: "利润",
              size: 50,
              enableEditing: false,
              muiTableBodyCellProps: {
                sx: {
                  textAlign: "right",
                },
              },
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

    // highest profit group
    result.unshift({
      id: "highest-profit-group",
      header: "最高利润",

      columns: [
        {
          id: "highest-profit-single",
          accessorFn: (row: ProductRow) => highestProfitCity(row),
          header: "利润",
          size: 50,
          enableEditing: false,
          Cell: (props) => {
            const { renderedCellValue, row } = props;
            const city = renderedCellValue as CityName;
            const profit = row.original.targetCity?.[city]?.singleProfit;
            const trend = row.original.targetCity?.[city]?.trend;
            if (!city || !profit) {
              return null;
            }
            const trendIcon = getTrendIcon(trend);
            return (
              <div className="flex items-center">
                {trendIcon}
                <span className="pl-2">
                  {profit} {city}
                </span>
              </div>
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

  const { columnVisibility, onColumnVisibilityChange } = useColumnVisibilityOverride(selectedCities.targetCities);

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
        <IconButton onClick={copySourceToTargetCities} size="small">
          <ArrowRightAltIcon />
        </IconButton>
        <IconButton onClick={onTrendCellColorButtonClick} size="small">
          <PaletteIcon />
        </IconButton>
      </div>
    );
  }, [
    onTrendCellColorButtonClick,
    selectedCities.sourceCities,
    selectedCities.targetCities,
    setSourceCities,
    setTargetCities,
    switchSourceAndTargetCities,
    copySourceToTargetCities,
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
    muiTopToolbarProps: {
      sx: {
        marginTop: "10px",
      },
    },
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
        maxHeight: "clamp(350px, calc(100vh - 66px - 52px), 9999px)", // 52px website header, 66px table toolbar + margin
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

  return <MaterialReactTable table={table} />;
}

interface MRT_EditFunctionProps {
  cell: MRT_Cell<ProductRow, unknown>;
  column: MRT_Column<ProductRow, unknown>;
  row: MRT_Row<ProductRow>;
  table: MRT_TableInstance<ProductRow>;
}
