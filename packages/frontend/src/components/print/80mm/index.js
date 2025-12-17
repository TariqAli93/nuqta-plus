import pos80mm from './80mm.vue';
import pos80mmCss from './80mm.css?inline';

const stringifyCss = (cssContent) => {
  return JSON.stringify(cssContent);
};

const printCss = stringifyCss(pos80mmCss);

export { pos80mm, printCss };
