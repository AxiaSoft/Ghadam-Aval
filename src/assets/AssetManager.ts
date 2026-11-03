import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildFallbackCharacterTemplate } from '../characters/CharacterBuilder';

export type AssetKey =
  | 'female_character'
  | 'male_character'
  | 'student_npc'
  | 'mission_props';

const ASSET_URLS: Record<AssetKey, string> = {
  female_character: './models/female_character.glb?v=3',
  male_character: './models/male_character.glb?v=3',
  student_npc: './models/student_npc.glb?v=3',
  mission_props: './models/mission_props.glb?v=3',
};

class AssetManagerImpl {
  private loader = new GLTFLoader();
  private cache = new Map<AssetKey, THREE.Object3D>();
  private inFlight = new Map<AssetKey, Promise<THREE.Object3D>>();

  public getCached(key: AssetKey): THREE.Object3D | undefined {
    return this.cache.get(key);
  }

  public async loadAsset(
    key: AssetKey,
    onProgress?: (fraction: number) => void
  ): Promise<THREE.Object3D> {
    const existing = this.cache.get(key);
    if (existing) {
      onProgress?.(1);
      return existing;
    }

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const url = ASSET_URLS[key];
    const promise = new Promise<THREE.Object3D>((resolve) => {
      this.loader.load(
        url,
        (gltf) => {
          const root = gltf.scene;
          this.cache.set(key, root);
          this.inFlight.delete(key);
          onProgress?.(1);
          resolve(root);
        },
        (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            onProgress?.(evt.loaded / evt.total);
          }
        },
        (err) => {
          console.warn(`[AssetManager] Fallback activated for ${key}:`, err);
          const fallback =
            key === 'female_character'
              ? buildFallbackCharacterTemplate('female')
              : key === 'male_character'
                ? buildFallbackCharacterTemplate('male')
                : key === 'student_npc'
                  ? buildFallbackCharacterTemplate('student')
                  : new THREE.Group();
          this.cache.set(key, fallback);
          this.inFlight.delete(key);
          onProgress?.(1);
          resolve(fallback);
        }
      );
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Progressive Phase 1: Loads essential character rigs before showing Intro
   */
  public async preloadEssentials(
    onStatus: (progress: number, label: string) => void
  ): Promise<void> {
    onStatus(10, 'در حال بارگذاری مدل شخصیت اصلی و جزئیات چهره...');
    await this.loadAsset('female_character', (f) => {
      onStatus(10 + Math.round(f * 45), 'در حال بارگذاری مدل شخصیت اصلی و جزئیات چهره...');
    });

    onStatus(58, 'در حال آماده‌سازی کاراکترها و انیمیشن‌های سه‌بعدی...');
    await this.loadAsset('male_character', (f) => {
      onStatus(58 + Math.round(f * 35), 'در حال آماده‌سازی کاراکترها و انیمیشن‌های سه‌بعدی...');
    });

    onStatus(100, 'آماده‌ی شروع');
  }

  /**
   * Progressive Phase 2: Lazily preloads secondary scene assets when needed
   */
  public preloadSecondaryAssets(): void {
    this.loadAsset('mission_props').catch(() => {});
    this.loadAsset('student_npc').catch(() => {});
  }
}

export const assetManager = new AssetManagerImpl();

/**
 * Safely disposes transient scene geometries & materials to keep mobile GPU memory lean
 */
export function disposeSceneResources(root: THREE.Object3D | null): void {
  if (!root) return;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    }
  });
}
