import React from "react";
import { FloatingShapes, FloatingDocuments, ParticleSystem } from "../../../components/motions";

export const LoginBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <FloatingShapes />
      <FloatingDocuments />
      <ParticleSystem />
    </div>
  );
};
