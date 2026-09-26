import { describe, expect, it } from "vitest";

import { EMPTY_ADMINISTRATIVE_ADDRESS, formatAdministrativeAddress } from "./administrative";

describe("formatAdministrativeAddress", () => {
  it("formats the current province and ward hierarchy without duplicate separators", () => {
    expect(
      formatAdministrativeAddress({
        ...EMPTY_ADMINISTRATIVE_ADDRESS,
        detail: "12 Lê Lợi",
        wardName: "Phường Sài Gòn",
        provinceName: "Thành phố Hồ Chí Minh",
      }),
    ).toBe("12 Lê Lợi, Phường Sài Gòn, Thành phố Hồ Chí Minh");
  });

  it("keeps legacy district data readable for previously saved addresses", () => {
    expect(
      formatAdministrativeAddress({
        ...EMPTY_ADMINISTRATIVE_ADDRESS,
        detail: "1 Tràng Tiền",
        wardName: "Phường Hoàn Kiếm",
        districtName: "Quận Hoàn Kiếm",
        provinceName: "Thành phố Hà Nội",
      }),
    ).toBe("1 Tràng Tiền, Phường Hoàn Kiếm, Quận Hoàn Kiếm, Thành phố Hà Nội");
  });
});
