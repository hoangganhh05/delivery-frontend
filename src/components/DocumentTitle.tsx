import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BRAND_NAME, BRAND_TITLE } from "../config/brand";
import { useTranslation, type TranslationKey } from "../i18n/I18nProvider";

const pageTitles: Record<string, TranslationKey> = {
  "/login": "login.signIn",
  "/": "nav.overview",
  "/orders": "nav.orders",
  "/dispatch": "nav.dispatch",
  "/tracking": "nav.tracking",
  "/shippers": "nav.shippers",
  "/users": "nav.users",
  "/permissions": "nav.permissions",
  "/payments": "nav.payments",
  "/vouchers": "nav.vouchers",
  "/notifications": "common.notifications",
  "/reports": "nav.reports",
  "/settings": "common.settings",
  "/account": "common.account",
  "/customer": "nav.orders",
  "/shipper-mobile": "nav.orders",
};

export default function DocumentTitle() {
  const { pathname } = useLocation();
  const { t, language } = useTranslation();

  useEffect(() => {
    const match = Object.entries(pageTitles)
      .sort(([a], [b]) => b.length - a.length)
      .find(([path]) => path === "/" ? pathname === "/" : pathname.startsWith(path));
    document.title = match ? `${t(match[1])} | ${BRAND_NAME}` : BRAND_TITLE;
  }, [language, pathname, t]);

  return null;
}
