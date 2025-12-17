import a5 from './a5.vue';
import a5Css from './a5.css?inline';

const stringifyCss = (cssContent) => {
  return JSON.stringify(cssContent);
};

const printCss = stringifyCss(a5Css);

export { a5, printCss };
