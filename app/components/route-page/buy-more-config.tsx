"use client";

import { CITIES, CityName } from "@/data/Cities";
import { PRODUCTS } from "@/data/Products";
import { PlayerConfig } from "@/interfaces/player-config";
import { Product } from "@/interfaces/product";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { useState } from "react";
import NumberInput from "./number-input";

const PRODUCT_BUY_MORE_LEVEL_MIN = 0;
const PRODUCT_BUY_MORE_LEVEL_MAX = 20;
const PRODUCT_BUY_MORE_PERCENT_PER_LEVEL = 5;

const BUYABLE_PRODUCTS = PRODUCTS.filter(
  (product) => product.type !== "Craft" && Object.values(product.buyLot ?? {}).some((lot) => (lot ?? 0) > 0)
);

interface CityProductGroup {
  city: CityName;
  products: Product[];
}

const CITY_PRODUCT_GROUPS: CityProductGroup[] = CITIES.map((city) => ({
  city,
  products: BUYABLE_PRODUCTS.filter((product) => (product.buyLot?.[city] ?? 0) > 0),
})).filter((group) => group.products.length > 0);

interface ProductGridProps {
  products: Product[];
  getProductLevel: (pdtName: string) => number;
  onProductLevelChange: (pdtName: string, level: number) => void;
}

interface ProductRowProps {
  product: Product;
  level: number;
  onLevelChange: (pdtName: string, level: number) => void;
}

function ProductRow(props: ProductRowProps) {
  const { product, level, onLevelChange } = props;

  return (
    <Box className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 py-2">
      <Typography variant="body2" noWrap title={product.name} className="min-w-0">
        {product.name}
      </Typography>
      <Box sx={{ "& .MuiFormControl-root": { width: "3.5rem !important", margin: "0 !important" } }}>
        <NumberInput
          label="等级"
          hiddenLabel
          hideSpinButton
          min={PRODUCT_BUY_MORE_LEVEL_MIN}
          max={PRODUCT_BUY_MORE_LEVEL_MAX}
          defaultValue={0}
          type="integer"
          value={level}
          inputProps={{ "aria-label": `${product.name}投资等级` }}
          setValue={(value) => onLevelChange(product.name, value)}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" className="w-10 shrink-0 text-right">
        +{level * PRODUCT_BUY_MORE_PERCENT_PER_LEVEL}%
      </Typography>
    </Box>
  );
}

function ProductGrid(props: ProductGridProps) {
  const { products, getProductLevel, onProductLevelChange } = props;

  const rows: Product[][] = [];
  for (let index = 0; index < products.length; index += 2) {
    rows.push(products.slice(index, index + 2));
  }

  return (
    <Box className="flex flex-col">
      {rows.map(([left, right]) => (
        <Box key={left.name} className="flex items-stretch">
          <Box className="min-w-0 flex-1 pl-4 pr-4 md:pr-8">
            <ProductRow product={left} level={getProductLevel(left.name)} onLevelChange={onProductLevelChange} />
          </Box>
          {right && <Box className="my-1 w-0.5 shrink-0 bg-gray-300 dark:bg-gray-600" />}
          <Box className="min-w-0 flex-1 pl-4 pr-4 md:pl-8">
            {right && (
              <ProductRow product={right} level={getProductLevel(right.name)} onLevelChange={onProductLevelChange} />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

interface BuyMoreConfigProps {
  playerConfig: PlayerConfig;
  onPlayerConfigChange: (field: string, value: any) => void;
}

export default function BuyMoreConfig(props: BuyMoreConfigProps) {
  const { playerConfig, onPlayerConfigChange } = props;
  const [productExpanded, setProductExpanded] = useState(false);
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({});

  const getProductLevel = (pdtName: string) => {
    const percent = playerConfig.productsBuyMorePercent?.[pdtName] ?? 0;
    return Math.round(percent / PRODUCT_BUY_MORE_PERCENT_PER_LEVEL);
  };

  const onProductLevelChange = (pdtName: string, level: number) => {
    const constrainedLevel = Math.max(PRODUCT_BUY_MORE_LEVEL_MIN, Math.min(PRODUCT_BUY_MORE_LEVEL_MAX, level));
    onPlayerConfigChange("productsBuyMorePercent", {
      ...playerConfig.productsBuyMorePercent,
      [pdtName]: constrainedLevel * PRODUCT_BUY_MORE_PERCENT_PER_LEVEL,
    });
  };

  return (
    <Box className="flex flex-col items-center">
      <Box className="flex flex-col items-center py-2">
        <NumberInput
          label="全交易所加成 (%)"
          min={0}
          max={60}
          defaultValue={0}
          type="integer"
          value={playerConfig.allExchangesBuyMorePercent}
          setValue={(value) => onPlayerConfigChange("allExchangesBuyMorePercent", value)}
        />
        <Typography variant="caption" color="text.secondary">
          该加成对所有交易所生效，范围 0-60%。
        </Typography>
      </Box>

      <Box className="w-full pt-4">
        <Accordion
          expanded={productExpanded}
          onChange={(_event, isExpanded) => setProductExpanded(isExpanded)}
          elevation={0}
          disableGutters
          sx={{ border: 1, borderColor: "divider", "&:before": { display: "none" } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box className="flex w-full items-center justify-between gap-2 pr-1">
              <Typography>商品投资加成（每级 +5%，最高 20 级）</Typography>
              <Typography variant="caption" color="text.secondary">
                {CITY_PRODUCT_GROUPS.length} 个城市
              </Typography>
            </Box>
          </AccordionSummary>
          {productExpanded && (
            <AccordionDetails className="p-0">
              <Typography variant="caption" color="text.secondary" className="block px-4 pt-2">
                按城市分组；同一商品在多个城市可购买时共用投资等级。
              </Typography>
              <Box className="flex w-full flex-col px-2 pb-2">
                {CITY_PRODUCT_GROUPS.map((group) => {
                  const cityExpanded = !!expandedCities[group.city];
                  return (
                    <Accordion
                      key={group.city}
                      expanded={cityExpanded}
                      onChange={(_event, isExpanded) =>
                        setExpandedCities((prev) => ({ ...prev, [group.city]: isExpanded }))
                      }
                      elevation={0}
                      disableGutters
                      sx={{
                        background: "transparent",
                        borderBottom: 1,
                        borderColor: "divider",
                        "&:before": { display: "none" },
                        "&:last-of-type": { borderBottom: 0 },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box className="flex w-full items-center justify-between gap-2 pr-1">
                          <Typography>{group.city}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {group.products.length} 种商品
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      {cityExpanded && (
                        <AccordionDetails className="p-0">
                          <ProductGrid
                            products={group.products}
                            getProductLevel={getProductLevel}
                            onProductLevelChange={onProductLevelChange}
                          />
                        </AccordionDetails>
                      )}
                    </Accordion>
                  );
                })}
              </Box>
            </AccordionDetails>
          )}
        </Accordion>
      </Box>
    </Box>
  );
}
