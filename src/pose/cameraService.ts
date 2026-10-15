export class CameraService {
  private epoch = 0;
  private stream: MediaStream | null = null;
  constructor(private readonly video: HTMLVideoElement,
    private readonly getMedia = (constraints: MediaStreamConstraints) => navigator.mediaDevices.getUserMedia(constraints)) {}
  async start(): Promise<HTMLVideoElement> {
    this.stop();
    const epoch = this.epoch;
    const stream = await this.getMedia({ audio: false, video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } });
    if (epoch !== this.epoch) {
      stream.getTracks().forEach(track => track.stop());
      throw new DOMException('Camera initialization cancelled', 'AbortError');
    }
    this.stream = stream;
    this.video.srcObject = stream;
    try {
      await this.video.play();
      if (epoch !== this.epoch) throw new DOMException('Camera initialization cancelled', 'AbortError');
      return this.video;
    } catch (error) {
      if (epoch === this.epoch) this.stop();
      throw error;
    }
  }
  stop(): void {
    this.epoch++;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
  }
}
