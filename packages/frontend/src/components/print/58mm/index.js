import pos58mm from './58mm.vue';
import pos58mmCss from './58mm.css?inline';

const stringifyCss = (cssContent) => {
  return JSON.stringify(cssContent);
};

const printCss = stringifyCss(pos58mmCss);

export { pos58mm, printCss };
