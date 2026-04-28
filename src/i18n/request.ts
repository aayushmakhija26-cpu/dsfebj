import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // CREDAI portal is English-only for MVP.
  // Extend here when regional languages (Marathi, Hindi) are added.
  const locale = "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
