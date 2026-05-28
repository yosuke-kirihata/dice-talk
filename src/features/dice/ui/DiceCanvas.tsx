import { useEffect, useRef } from 'react';
import { SceneManager, type SceneManagerConfig } from '@/features/dice/scene/SceneManager';
import type { PoseSource } from '@/shared/pose';

/** PoseSource に接続される Three.js サイコロ canvas の props。 */
export interface DiceCanvasProps {
  readonly poseSource: PoseSource;
  readonly className?: string;
  readonly sceneManagerFactory?: () => SceneManager;
  readonly sceneOptions?: SceneManagerConfig;
}

/** canvas に SceneManager を mount し、姿勢入力とデザイン設定に同期させる。 */
export const DiceCanvas = ({
  poseSource,
  className,
  sceneManagerFactory,
  sceneOptions,
}: DiceCanvasProps): React.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const sceneOptionsRef = useRef<SceneManagerConfig | undefined>(sceneOptions);
  const appliedSceneOptionsRef = useRef<SceneManagerConfig | undefined>(undefined);
  sceneOptionsRef.current = sceneOptions;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const sm = sceneManagerFactory
      ? sceneManagerFactory()
      : new SceneManager(sceneOptionsRef.current);
    sceneManagerRef.current = sm;
    appliedSceneOptionsRef.current = sceneOptionsRef.current;
    sm.attach(canvas);
    sm.start(poseSource);
    void poseSource.start();

    const resize = () => sm.resize();
    let cleanupResize = () => {};
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      cleanupResize = () => ro.disconnect();
    } else {
      window.addEventListener('resize', resize);
      cleanupResize = () => window.removeEventListener('resize', resize);
    }

    return () => {
      cleanupResize();
      void poseSource.stop();
      sm.detach();
      if (sceneManagerRef.current === sm) sceneManagerRef.current = null;
      appliedSceneOptionsRef.current = undefined;
    };
  }, [poseSource, sceneManagerFactory]);

  useEffect(() => {
    if (sceneOptions && sceneOptions !== appliedSceneOptionsRef.current) {
      sceneManagerRef.current?.configure(sceneOptions);
      appliedSceneOptionsRef.current = sceneOptions;
    }
  }, [sceneOptions]);

  return <canvas ref={canvasRef} className={className} />;
};
