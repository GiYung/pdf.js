class TESTPanel {
  /**
   * @param {TESTPanel} options
   */
  constructor({ elements, eventBus }) {
    this.isInitialViewSet = false;

    this.eventBus = eventBus;

    this.insertSquareButton = elements.insertSquare;

    this._addEventListeners();
  }

  reset() {
    this.isInitialViewSet = false;
  }

  /**
   * @private
   */
  _addEventListeners() {
    this.insertSquareButton.addEventListener("click", () => {
      const testRect = {
        left: 100,
        top: 100,
        right: 200,
        bottom: 200,
      };

      this.eventBus.dispatch("addAnnotation", {
        subtype: "Square",
        contents: "TEST입니다",
        rect: testRect,
      });
    });

    // Update the thumbnailViewer, if visible, when exiting presentation mode.
    this.eventBus._on("presentationmodechanged", evt => {});
  }
}

export { TESTPanel };
