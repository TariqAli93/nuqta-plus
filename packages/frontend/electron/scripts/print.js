class Printer {
  constructor(
    silent = false,
    paperSize = 'A4',
    orientation = 'portrait',
    margin = '1cm',
    copies = 1,
    printer = null
  ) {
    this.silent = silent;
    this.paperSize = paperSize;
    this.orientation = orientation;
    this.margin = margin;
    this.copies = copies;
    this.printer = printer;
  }

  buildHtml(html, css) {
    const base = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Print Document</title>
        <style>
          @page {
            size: ${this.paperSize} ${this.orientation};
            margin: ${this.margin};
          }
          ${css}
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
    `;
    return base;
  }

  print(html = '<h1>طباعة</h1>', css = '') {
    const document = this.buildHtml(html, css);
    console.log('Printing document:');
    console.log(document);
    return 'Print job initiated';
  }

  cutPaper() {
    console.log('cutPaper called from Printer class');
  }

  kickDrawer() {
    console.log('kickDrawer called from Printer class');
  }
}

export default Printer;
