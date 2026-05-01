declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}

// Enables TypeScript autocomplete for all useTranslations/getTranslations keys
type Messages = typeof import('../languages/en.json');
declare interface IntlMessages extends Messages {}
