import a4 from './a4.vue';
import a4Css from './a4.css?inline';

const stringifyCss = (cssContent) => {
  return JSON.stringify(cssContent);
};

const printCss = stringifyCss(a4Css);

export { a4, printCss };
