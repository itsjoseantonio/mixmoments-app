declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}

// Enables TypeScript autocomplete for all useTranslations/getTranslations keys
type Messages = typeof import('../languages/en.json');
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare interface IntlMessages extends Messages {}
