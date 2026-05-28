export type {
  PoseListener,
  PoseSnapshot,
  PoseSource,
  Quat,
  Unsubscribe,
} from '@/shared/pose';
export type { YawPitchRoll } from './lib/quaternion';
export {
  fromAxisAngle,
  identity,
  multiply,
  normalize,
  slerp,
  toYawPitchRoll,
} from './lib/quaternion';
export { ScriptedPoseSource } from './sources/scriptedPoseSource';
export {
  DEFAULT_SPIN_CONFIG,
  getFrontMostPip,
  getTargetQuatForPip,
  interpolateSpinSpeed,
  pickTargetPip,
  type SpinKeyframe,
  type SpinMotionConfig,
  type SpinMotionState,
  startSpinMotion,
  stepSpinMotion,
} from './sources/spinMotion';
export { TouchPoseSource } from './sources/touchPoseSource';
export type { PoseHudProps } from './ui/PoseHud';
export { PoseHud } from './ui/PoseHud';
export type { TouchInputLayerProps } from './ui/TouchInputLayer';
export { TouchInputLayer } from './ui/TouchInputLayer';
