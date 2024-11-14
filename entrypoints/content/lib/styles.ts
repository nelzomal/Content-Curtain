export const BLUR_OVERLAY_STYLES = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.5);
  z-index: 2147483647;
  transition: opacity 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const MESSAGE_BOX_STYLES = `
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  text-align: center;
`;

// Sensitivity class mappings
export const SENSITIVITY_CLASSES = {
  0: "bg-green-100 text-green-800",
  1: "bg-orange-100 text-orange-800",
  2: "bg-red-100 text-red-800",
  3: "bg-orange-100 text-orange-800",
  4: "bg-red-100 text-red-800",
};
