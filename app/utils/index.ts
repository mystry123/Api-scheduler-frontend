import LogHelper from "~/data/axios/config/logger";


export const isNilCheck = (value: string) => {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined &&
    !Number.isNaN(value) &&
    !(Array.isArray(value) && value.length === 0)
  );
};
export const customOmitBy = <T extends Record<string, any>>(
  object: T,
  predicate: (value: any, key: string) => boolean
): T => {
  const result: Partial<T> = {};
  for (const key in object) {
    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      predicate(object[key], key)
    ) {
      result[key] = object[key];
    }
  }

  return result as T;
};

export const logger = new LogHelper();


