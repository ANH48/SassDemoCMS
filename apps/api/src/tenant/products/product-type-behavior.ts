export interface ProductBehavior {
  hasInventory: boolean;
  canSell: boolean;
  canBuy: boolean;
}

const BEHAVIOR_MAP: Record<string, ProductBehavior> = {
  GOODS:            { hasInventory: true,  canSell: true,  canBuy: true  },
  SERVICE_PACKAGE:  { hasInventory: false, canSell: true,  canBuy: false },
  MATERIAL_TRACKED: { hasInventory: true,  canSell: true,  canBuy: true  },
  RAW_MATERIAL:     { hasInventory: true,  canSell: false, canBuy: true  },
  SERVICE:          { hasInventory: false, canSell: true,  canBuy: false },
};

export function getProductBehavior(productType: string): ProductBehavior {
  return BEHAVIOR_MAP[productType] ?? BEHAVIOR_MAP.GOODS;
}
