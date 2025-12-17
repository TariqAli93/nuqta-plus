import pos88mm from './88mm.vue';
import pos88mmCss from './88mm.css?inline';

const stringifyCss = (cssContent) => {
  return JSON.stringify(cssContent);
};

const printCss = stringifyCss(pos88mmCss);

export { pos88mm, printCss };
