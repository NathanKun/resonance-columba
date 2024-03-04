"use client";

import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import { Trend, trends } from "@/interfaces/SellingPrice";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { MRT_Localization_ZH_HANS } from "material-react-table/locales/zh-Hans";
import { useCallback, useContext, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import { PriceContext } from "../price-provider";

interface ProductPrice {
  variation: number;
  trend: string; // up arrow, down arrow, or empty
  timeDiffInMin: string; // e.g. 5分钟前
  profit: number;
}

interface ProductRow {
  sourceCity: CityName;
  buyableCities: CityName[];
  productName: string;
  source?: ProductPrice;
  targetCity: {
    [key: CityName]: ProductPrice;
  };
}

const VariationCell = (props: any) => {
  const { renderedCellValue: value } = props;
  return (
    <span>
      {value}
      {value ? "%" : ""}
    </span>
  );
};

const VariationInput = (props: any) => {
  const { value: variation, save, cancel } = props;
  const [value, setValue] = useState(variation ?? 100);

  const onBlur = (event: any) => {
    const value = event.target.value;
    if (validate(value)) {
      save(parseInt(value));
    } else {
      cancel();
    }
  };

  const validate = (value: string) => {
    if (value.endsWith("%")) {
      value = value.slice(0, -1);
    }
    const newValue = parseInt(value);
    if (isNaN(newValue) || newValue < 70 || newValue > 130) {
      return false;
    }
    return true;
  };

  return (
    <OutlinedInput
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={onBlur}
      type="number"
      autoFocus
      size="small"
      inputProps={{
        min: 70,
        max: 130,
      }}
    />
  );
};

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

const TrendInput = (props: any) => {
  const { value: selected, save } = props;

  const onBlur = (event: any) => {
    save(selected);
  };

  return (
    <ToggleButtonGroup value={selected} exclusive aria-label="price trend" onBlur={onBlur} autoFocus size="small">
      {trends.map((trend) => (
        <ToggleButton
          key={"trend-input-toogle-button-" + trend}
          value={trend}
          aria-label="left aligned"
          onClick={() => save(trend)}
        >
          {trend === "up" ? <TrendingUpIcon /> : <TrendingDownIcon />}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

function MultipleSelect(props: any) {
  const { allOptions, selectedOptions, handleChange, label, name } = props;

  return (
    <FormControl sx={{ m: 1, width: "16rem" }}>
      <InputLabel
        id={"multiple-select-label-" + name}
        sx={{
          fontSize: "0.8rem",
        }}
      >
        {label}
      </InputLabel>
      <Select
        labelId={"multiple-select-label-" + name}
        id={"multiple-select-" + name}
        multiple
        value={selectedOptions}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        sx={{
          fontSize: "0.8rem",
          "& .MuiSelect-select": {
            padding: ".5rem",
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              "& li": {
                fontSize: "0.8rem",
              },
            },
          },
        }}
      >
        {allOptions.map((option: string) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function PricesTable() {
  const { prices, setPrice } = useContext(PriceContext);
  const [cookies, setCookie] = useCookies(["selectedCities"]);

  const setSourceCities = useCallback(
    (selected: CityName[]) => {
      setCookie("selectedCities", { sourceCities: selected, targetCities: cookies.selectedCities?.targetCities ?? [] });
    },
    [setCookie, cookies.selectedCities?.targetCities]
  );

  const setTargetCities = useCallback(
    (selected: CityName[]) => {
      setCookie("selectedCities", { sourceCities: cookies.selectedCities?.sourceCities ?? [], targetCities: selected });
    },
    [setCookie, cookies.selectedCities?.sourceCities]
  );

  // build table rows
  const data = useMemo<ProductRow[]>(() => {
    const result: ProductRow[] = [];

    PRODUCTS.map((product): void => {
      const buyableCities: CityName[] = product.buyPrices ? Object.keys(product.buyPrices) : [];

      for (const sourceCity of buyableCities) {
        if (!cookies.selectedCities?.sourceCities?.some((city: string) => buyableCities.includes(city))) {
          return;
        }

        const productName = product.name;
        let source;
        const targetCity: { [key: CityName]: ProductPrice } = {};

        CITIES.forEach((city) => {
          const productPrices = prices[product.name];
          if (!productPrices) {
            return;
          }

          const isBuyableCity = buyableCities.includes(city);

          const productPriceFromApi = isBuyableCity ? productPrices.buy?.[city] : productPrices.sell?.[city]; // sell/buy is player's perspective
          if (!productPriceFromApi) {
            return;
          }

          const { variation, trend, time } = productPriceFromApi;
          const timeDiffInMin = Math.ceil((Date.now() / 1000 - time._seconds) / 60);
          let profit = 0;
          if (!isBuyableCity) {
            // a product can have different buy prices in different cities, find the lowest one,
            // but the profile become unclear, we don't know which city to buy from.
            const productBuyPrice = Math.min(
              ...(Object.values(product.buyPrices).filter((price) => price !== null) as number[])
            );
            profit = Math.round((productBuyPrice * variation) / 100 - productBuyPrice);
          }
          const productPriceForTable: ProductPrice = {
            variation,
            trend,
            timeDiffInMin: timeDiffInMin + "分钟前",
            profit,
          };

          if (isBuyableCity) {
            source = productPriceForTable;
          } else {
            targetCity[city] = productPriceForTable;
          }
        });

        result.push({
          sourceCity,
          buyableCities,
          productName,
          source,
          targetCity,
        });
      }
    });

    return result;
  }, [prices, cookies.selectedCities?.sourceCities]);

  // build headers
  const columns = useMemo<MRT_ColumnDef<ProductRow>[]>(() => {
    const result: MRT_ColumnDef<ProductRow>[] =
      cookies.selectedCities?.targetCities.map((city: CityName) => {
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
              Edit: ({ cell, column, row, table }) => {
                const cancel = () => {
                  table.setEditingCell(null);
                };
                const rowData = row.original;
                const { productName, buyableCities } = rowData;
                if (buyableCities.includes(city)) {
                  cancel();
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
              Edit: ({ cell, column, row, table }) => {
                const rowData = row.original;
                const { productName, buyableCities } = rowData;
                if (buyableCities.includes(city)) {
                  table.setEditingCell(null);
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
              accessorFn: (row: ProductRow) => row.targetCity[city]?.timeDiffInMin,
              header: "更新",
              size: 50,
              enableEditing: false,
            },
            {
              id: `targetCity-${city}-profit`,
              accessorFn: (row: ProductRow) => row.targetCity[city]?.profit,
              header: "利润",
              size: 50,
              enableEditing: false,
            },
          ],
        } as MRT_ColumnDef<ProductRow>;
      }) ?? [];

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
            return <VariationInput value={cell.getValue()} save={save} cancel={cancel} />;
          },
        },
        {
          id: "source-trend",
          accessorFn: (row: ProductRow) => row.source?.trend,
          header: "趋势",
          size: 50,
          Cell: TrendCell,
          Edit: ({ cell, column, row, table }) => {
            const save = (newTrend: Trend) => {
              row._valuesCache[column.id] = newTrend;
              const rowData = row.original;
              const { productName, sourceCity } = rowData;
              setPrice({ product: productName, city: sourceCity, trend: newTrend, type: "buy" });
              table.setEditingCell(null);
            };

            return <TrendInput value={cell.getValue()} save={save} />;
          },
        },
        {
          id: "source-time",
          accessorFn: (row: ProductRow) => row.source?.timeDiffInMin,
          header: "更新",
          size: 50,
          enableEditing: false,
        },
      ],
    });

    return result;
  }, [cookies.selectedCities?.targetCities, setPrice]);

  const renderCitySelects = useCallback(() => {
    return (
      <div>
        <MultipleSelect
          label="原产地"
          name="sourceCities"
          allOptions={CITIES}
          selectedOptions={cookies.selectedCities?.sourceCities ?? []}
          handleChange={(event: any) => setSourceCities(event.target.value)}
        />
        <MultipleSelect
          label="目标城市"
          name="targetCities"
          allOptions={CITIES}
          selectedOptions={cookies.selectedCities?.targetCities ?? []}
          handleChange={(event: any) => setTargetCities(event.target.value)}
        />
      </div>
    );
  }, [cookies.selectedCities?.sourceCities, cookies.selectedCities?.targetCities, setSourceCities, setTargetCities]);

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
    muiTableHeadCellProps: {
      sx: {
        fontSize: "0.8rem",
      },
    },
    muiTableBodyCellProps: {
      sx: {
        fontSize: "0.8rem",
        lineHeight: "0.9rem",
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
