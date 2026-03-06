export const formatVnd = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return new Intl.NumberFormat("vi-VN").format(Math.round(amount));
};

export const getNumericString = (value = "") => value.replace(/\D/g, "");

export const formatThousandsInput = (value = "") => {
  const digits = getNumericString(value);

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN").format(Number(digits));
};
