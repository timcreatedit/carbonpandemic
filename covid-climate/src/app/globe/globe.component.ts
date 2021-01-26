import {
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef, Input,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as THREE from 'three';
import {Color} from 'three';
import ThreeGlobe from 'three-globe';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-globe',
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class GlobeComponent implements AfterViewInit {

  @ViewChild('scene') threeScene: ElementRef<HTMLDivElement>;

  @Input() relativeScroll: number = 0;
  @Input() active: boolean;

  camera: THREE.PerspectiveCamera;
  globe: ThreeGlobe;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;

  constructor(private readonly http: HttpClient) {
  }

  ngAfterViewInit(): void {
    this.setupGlobe();
  }

  async setupGlobe(): Promise<void> {

    const response: any = await this.http.get('https://www.trackcorona.live/api/countries').toPromise();
    const data = response.data.map(dp => ({...dp, height: Math.max(dp.confirmed / 100_000_000, 0.005), color: '#ff5889'}));
    console.log(data);

    this.globe = new ThreeGlobe({animateIn: false})
      .globeImageUrl('assets/earth-dark.jpg')
      .showAtmosphere(false)
      .pointsData(data)
      .labelsData(data)
      .pointLat('latitude')
      .pointLng('longitude')
      .pointAltitude('height')
      .pointColor('color')
      .labelLat('latitude')
      .labelLng('longitude')
      .labelText('confirmed')
      .labelSize('height')
      .labelColor('color')
      .labelAltitude('height');

    this.camera = new THREE.PerspectiveCamera(10);
    this.camera.position.x = -100;
    this.camera.position.z = 700;

    this.scene = new THREE.Scene();
    this.scene.background = new Color('#110F19');

    this.scene.add(this.globe);

    this.scene.add(new THREE.AmbientLight('#ffffff', 1));

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setAnimationLoop(time => this.animation(time));
    this.threeScene.nativeElement.appendChild(this.renderer.domElement);
    this.setSize();
  }

  setSize(): void {
    this.camera.aspect = this.threeScene.nativeElement.offsetWidth / this.threeScene.nativeElement.offsetHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.threeScene.nativeElement.offsetWidth, this.threeScene.nativeElement.offsetHeight);
  }

  animation(time: number): void {
    this.setSize();
    this.globe.rotation.y = time / 10000;
    this.camera.position.y = 70 - this.relativeScroll * 1800;
    this.renderer.render(this.scene, this.camera);
  }
}
