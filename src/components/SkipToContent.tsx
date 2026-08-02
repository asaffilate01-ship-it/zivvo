import { useTranslation } from "react-i18next";

const SkipToContent = () => {
  const { t } = useTranslation();
  return <a href="#main-content" className="fixed left-3 top-3 z-[200] -translate-y-24 rounded-md bg-background px-4 py-2 font-medium text-foreground shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary">{t("productionV2.accessibility.skip")}</a>;
};

export default SkipToContent;
