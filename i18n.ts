import { getRequestConfig } from "next-intl/server";

/**
 * next-intl configuration for App Router.
 * Locale detection and message loading.
 */
export default getRequestConfig(async () => {
  const locale = "en"; // CREDAI portal is English-only for MVP

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
