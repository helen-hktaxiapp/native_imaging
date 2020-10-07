// Copyright (c) 2020 Famedly GmbH
// SPDX-License-Identifier: AGPL-3.0-or-later

this.Image = class Image {
  constructor(inst) {
    this._inst = inst;
  }

  loadRGBA(width, height, data) {
    const mem = m._malloc(width * height * 4);
    new Uint8ClampedArray(m.HEAPU8.buffer, mem, width * height * 4).set(data);
    this._inst = m._imageFromRGBA(width, height, mem);
  }

  free() {
    m._ImagingDelete(this._inst);
    this._inst = null;
  }

  mode() {
    return m.UTF8ToString(m._imageMode(_inst));
  }

  width() {
    return m._imageWidth(this._inst);
  }

  height() {
    return m._imageHeight(this._inst);
  }

  linesize() {
    return m._imageLinesize(this._inst);
  }

  block() {
    return new Uint8ClampedArray(m.HEAPU8.buffer, m._imageBlock(this._inst), this.height() * this.linesize());
  }

  copy() {
    return new Image(m._ImagingCopy(this._inst));
  }

  blend(other, alpha) {
    return new Image(m._ImagingBlend(this._inst, other._inst, alpha));
  }

  gaussianBlur(radius, passes) {
    const out = m._ImagingNewDirty(_mode(), width(), height());
    m._ImagingGaussianBlur(out, this._inst, radius, passes);
    return new Image(out);
  }

  rotate90() {
    const out = m._ImagingNewDirty(_mode(), height(), width());
    m._ImagingRotate90(out, this._inst);
    return new Image(out);
  }

  rotate180() {
    const out = m._ImagingNewDirty(_mode(), width(), height());
    m._ImagingRotate180(out, this._inst);
    return new Image(out);
  }

  rotate270() {
    const out = m._ImagingNewDirty(_mode(), height(), width());
    m._ImagingRotate270(out, this._inst);
    return new Image(out);
  }

  flipLeftRight() {
    const out = m._ImagingNewDirty(_mode(), width(), height());
    m._ImagingFlipLeftRight(out, this._inst);
    return new Image(out);
  }

  flipTopBottom() {
    const out = m._ImagingNewDirty(_mode(), width(), height());
    m._ImagingFlipTopBottom(out, this._inst);
    return new Image(out);
  }

  transpose() {
    const out = m._ImagingNewDirty(_mode(), height(), width());
    m._ImagingTranspose(out, this._inst);
    return new Image(out);
  }

  transverse() {
    const out = m._ImagingNewDirty(_mode(), height(), width());
    m._ImagingTransverse(out, this._inst);
    return new Image(out);
  }

  resample(width, height, mode) {
    const modeidx = ["nearest", "lanczos", "bilinear", "bicubic", "box", "hamming"].indexOf(mode.toString().split(".").slice(-1)[0]);
    const box = m._malloc(4 * 4);
    m.HEAPF32.set([0, 0, this.width(), this.height()], box / 4);
    var im = new Image(m._ImagingResample(this._inst, width, height, modeidx, box));
    return im;
  }

  toBlurhash(xComponents, yComponents) {
    return m.UTF8ToString(m._blurHashForImage(this._inst, xComponents, yComponents));
  }

  async loadEncodedPromise(bytes) {
    var url = URL.createObjectURL(new Blob([bytes]));
    try {
      var img = new window.Image();
      await new Promise(function(resolve, reject) {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      var canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      this.loadRGBA(data.width, data.height, data.data);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async toJpegPromise(quality) {
    const c = document.createElement("canvas");
    c.width = this.width();
    c.height = this.height();
    const im = new ImageData(this.block(), c.width, c.height);
    const ctx = c.getContext("2d");
    ctx.putImageData(im, 0, 0);
    const blob = await new Promise(function(resolve, reject) {
      c.toBlob(resolve, "image/jpeg", {quality: quality / 100});
    });
    const arraybuf = await blob.arrayBuffer();
    return new Uint8Array(arraybuf);
  }
}
