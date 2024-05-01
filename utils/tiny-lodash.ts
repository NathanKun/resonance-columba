// Simply implement some commonly used [lodash](https://www.npmjs.com/package/lodash-es) methods.
// I'm not sure if this package should be installed (considering that it is not small and tree-shaking requires plugins), so I will implement it simply here for now.
// If it needs to be installed in the future, it can directly replace this file.
// By @Tsuk1ko

export const pickBy = <T extends Record<string, any>, U extends keyof T>(obj: T, keys: readonly U[]): Pick<T, U> => {
  const keySet = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([key]) => keySet.has(key as any))) as any;
};

export const without = <T = any>(array: T[], ...values: T[]) => {
  const valueSet = new Set(values);
  return array.filter((item) => !valueSet.has(item));
};
