class POPDFEditor {
  constructor({ pdfViewer, eventBus }) {
    this.pdfViewer = pdfViewer;
    this.eventBus = eventBus;
    this.PDFLib = window.PDFLib;
    this.PDFDocument = this.PDFLib ? window.PDFLib.PDFDocument : null;

    this.pdfLibDocument = null;
    this.pdfViewports = {};
    // this.PDFViewports: { [key: number]: PDFPageViewport } = {};

    this.reset();
    // event Handler
    eventBus._on("addAnnotation", this.beginAddAnnotation.bind(this));
  }

  reset() {
    this.pdfLibDocument = null;
    this.pdfViewports = {};
  }

  async open(fileName) {
    const url = new URL(fileName, window.location).href;
    const arrayBuffer = await fetch(url).then(res => res.arrayBuffer());
    this.pdfLibDocument = await this.PDFDocument.load(arrayBuffer);
    return arrayBuffer;
  }

  setViewport(pageIndex, viewPort) {
    this.pdfViewports[pageIndex] = viewPort;
  }

  getViewport(pageIndex) {
    return this.pdfViewports[pageIndex];
  }

  // private

  /**
   * @param {string} subtype
   * @param {string} contents
   * @param {Object} rect
   */
  beginAddAnnotation({ subtype, contents, rect }) {
    switch (subtype) {
      case "Square":
        this.insertSquare({ rect });
        break;
      default:
        break;
    }
  }

  insertSquare({ rect }) {
    const pageIndex = 0;
    const now = window.moment();
    const currentDate =
      "D:" + now.format("YYYYMMDDHHmmssZ").replace(":", "'") + "'";

    const rectOperator = this.PDFLib.drawRectangle({
      x: rect.left,
      y: rect.top,
      width: Math.abs(rect.left - rect.right),
      height: Math.abs(rect.top - rect.bottom),
      borderWidth: 1.5,
      color: this.PDFLib.rgb(1, 1, 0),
      borderColor: this.PDFLib.rgb(1, 0, 0),
      rotate: this.PDFLib.radians(0),
      xSkew: this.PDFLib.radians(0),
      ySkew: this.PDFLib.radians(0),
    });

    const apDict = this.pdfLibDocument.context.obj({
      Type: "XObject",
      Subtype: "Form",
      FormType: 1,
      BBox: [rect.left, rect.bottom, rect.right, rect.top],
      Matrix: [1, 0, 0, 1, -rect.left, -rect.bottom],
      Resources: {
        ProcSet: this.PDFLib.PDFString.of("PDF"),
      },
    });

    const rect_ap_stream = this.PDFLib.PDFContentStream.of(
      apDict,
      rectOperator
    );
    const apObj = this.PDFLib.PDFRawStream.of(
      apDict,
      rect_ap_stream.computeContents()
    );
    const apRef = this.pdfLibDocument.context.register(apObj);

    const annotationObj = this.pdfLibDocument.context.obj({
      Type: "Annot",
      Subtype: "Square",
      Rect: [rect.left, rect.bottom, rect.right, rect.top],
      M: currentDate,
      Contents: this.PDFLib.PDFHexString.fromText("adfadfasdf ㅎ하하하하핳ㅇ"),
      F: 0, // annotation Flag

      // square or circle
      BS: {
        Type: "Border",
        S: "S",
      },
      IC: [1.0, 0, 0], // color
      BE: {},
      RD: [rect.left, rect.bottom, rect.right, rect.top],

      AP: {
        N: apRef,
      },
    });
    const annotationRef = this.pdfLibDocument.context.register(annotationObj);
    this.addAnnotation(this.pdfLibDocument, pageIndex, annotationRef);
  }

  /**
   * @param {PDFDocument} pdfLibDocument
   * @param {number} pageIndex
   * @param {PDFRef} annotationRef
   */
  async addAnnotation(pdfLibDocument, pageIndex, annotationRef) {
    console.log("addAnnotation begin");

    const page = pdfLibDocument.getPage(pageIndex);
    const annotsName = this.PDFLib.PDFName.of("Annots");
    // get prev annotation
    const annots = page.node.Annots();
    if (annots) {
      annots.push(annotationRef);
      page.node.set(annotsName, annots);
    } else {
      page.node.set(annotsName, pdfLibDocument.context.obj([annotationRef]));
    }

    const byteArray = await pdfLibDocument.save();
    this.eventBus.dispatch("testReopenViewer", { byteArray });
  }

  /**
   * @param {PDFOutlineViewerRenderParameters} params
   */
  render({ outline }) {}
}

export { POPDFEditor };
