import { Component } from '@angular/core';
import * as bodyPix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // https://github.com/tensorflow/tfjs-models/tree/master/body-pix
  image: any;
  private net!: bodyPix.BodyPix;
  personeData = undefined;
  imageData = undefined;

  constructor() {
    // https://stackoverflow.com/a/63536254/1175623
    console.log('Using TensorFlow backend: ', tf.getBackend());
    this.loadModel();
  }

  /**
   * loadImage
   */
  public loadImage(event: any) {
    /*
        https://static01.nyt.com/images/2020/05/20/dining/15virus-dinesafe1/15virus-dinesafe1-mediumSquareAt3X-v3.jpg
    
        https://thumbs.dreamstime.com/b/old-man-digging-garden-10230161.jpg
        
        https://images.unsplash.com/photo-1581578405037-bac01f785aac?ixid=MXwxMjA3fDB8MHxzZWFyY2h8Mnx8bWFuJTIwaW4lMjBnYXJkZW58ZW58MHx8MHw%3D&ixlib=rb-1.2.1&w=1000&q=80    
        */
    this.Reset();
    setTimeout(() => {
      const img = document.getElementById('imageid') as HTMLImageElement;
      img.crossOrigin = '';
      img.src = event.value;
    }, 1000);
  }

  async loadModel() {
    if (!this.net) {
      this.net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
      });
    }
  }

  /**
   * getImage
   */
  public getImage(event: any) {
    const files = event.target.files;
    if (files.length === 0)
      return;

    const mimeType = files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }

    const reader = new FileReader();
    // this.imagePath = files;
    reader.readAsDataURL(files[0]);
    reader.onload = (_event) => {
      this.Reset();
      this.image = reader.result;
    }
    event.target.value = null;
  }

  /**
   * Reset
   */
  public Reset() {
    this.image = undefined;
    const img = document.getElementById('imageid') as HTMLImageElement;
    img.crossOrigin = '';
    img.src = undefined;
    this.personeData = undefined;
    this.imageData = undefined;
    this.clearCanvas();
  }

  private clearCanvas() {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * GrayImage
   */
  public async GrayImage() {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    await this.processImage(canvas, ctx);
    // Create new empty image
    const emptyImage = ctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < this.imageData.data.length; i += 4) {
      const [r, g, b] = [this.imageData.data[i], this.imageData.data[i + 1], this.imageData.data[i + 2], this.imageData.data[i + 3]];

      // https://tannerhelland.com/2011/10/01/grayscale-image-algorithm-vb6.html
      const gray = ((0.3 * r) + (0.59 * g) + (0.11 * b));

      [
        emptyImage.data[i],
        emptyImage.data[i + 1],
        emptyImage.data[i + 2],
        emptyImage.data[i + 3]
      ] = [gray, gray, gray, 255];
    }

    // update the canvas with processed new empty image
    ctx.putImageData(emptyImage, 0, 0);
  }

  /**
   * CropImage
   */
  public async CropImage() {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    await this.processImage(canvas, ctx);
    // Create new empty image
    const emptyImage = ctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < this.imageData.data.length; i += 4) {
      const [r, g, b, a] = [this.imageData.data[i], this.imageData.data[i + 1], this.imageData.data[i + 2], this.imageData.data[i + 3]];
      [
        emptyImage.data[i],
        emptyImage.data[i + 1],
        emptyImage.data[i + 2],
        emptyImage.data[i + 3]
      ] = !this.personeData.data[i / 4] ? [0, 0, 0, 0] : [r, g, b, a];
    }

    // update the canvas with processed new empty image
    ctx.putImageData(emptyImage, 0, 0);
  }

  /**
   * process
   */
  public async ColorPop() {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    await this.processImage(canvas, ctx);
    // Create new empty image
    const emptyImage = ctx.createImageData(canvas.width, canvas.height);

    for (let i = 0; i < this.imageData.data.length; i += 4) {
      const [r, g, b, a] = [this.imageData.data[i], this.imageData.data[i + 1], this.imageData.data[i + 2], this.imageData.data[i + 3]];

      // https://tannerhelland.com/2011/10/01/grayscale-image-algorithm-vb6.html
      const gray = ((0.3 * r) + (0.59 * g) + (0.11 * b));

      [
        emptyImage.data[i],
        emptyImage.data[i + 1],
        emptyImage.data[i + 2],
        emptyImage.data[i + 3]
      ] = !this.personeData.data[i / 4] ? [gray, gray, gray, 255] : [r, g, b, a];
    }

    // update the canvas with processed new empty image
    ctx.putImageData(emptyImage, 0, 0);
  }

  async processImage(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const img = document.getElementById('imageid') as HTMLImageElement;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    if (this.personeData != undefined) return;
    // https://www.npmjs.com/package/@tensorflow-models/body-pix
    this.personeData = await this.net.segmentPerson(img, {
      internalResolution: 'low',
    });

    if (this.imageData != undefined) return;
    // get existing image data
    this.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}
