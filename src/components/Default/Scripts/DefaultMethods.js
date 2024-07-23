import { i18n } from "boot/i18n";

export function translate(store, value, type) {
  if (i18n.global.te(store + "." + type + "." + value))
    return i18n.global.t(store + "." + type + "." + value);
  else if (i18n.global.te("default." + type + "." + value))
    return i18n.global.t("default." + type + "." + value);
  else return i18n.global.t(store + "." + type + "." + value);
}

export function copyObject(obj) {
  if (obj === null || !(obj instanceof Object)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    const newArray = obj.map((item) => copyObject(item));
    return newArray;
  }

  if (obj instanceof Function) {
    return obj;
  }

  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] = copyObject(obj[key]);
    }
  }

  return newObj || {};
}
