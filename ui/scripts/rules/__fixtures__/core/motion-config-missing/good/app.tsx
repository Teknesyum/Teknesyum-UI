import { MotionConfig, motion } from 'motion/react';

export const App = () => (
  <MotionConfig reducedMotion="user">
    <motion.div />
  </MotionConfig>
);
