export const BLUR_OVERLAY_STYLES = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 999;
  opacity: 1;
  transition: opacity 0.3s ease;
`;

export const MESSAGE_BOX_STYLES = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  z-index: 1000;
  text-align: center;
  min-width: 300px;
  opacity: 1;
  transition: opacity 0.3s ease;
`;

export const SPINNER_STYLES = `
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #e11d48;
  border-radius: 50%;
  margin: 0 auto 16px auto;
  animation: spin 1s linear infinite;
`;

// Add keyframes for the spin animation
export const GLOBAL_STYLES = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Sensitivity class mappings
export const SENSITIVITY_CLASSES = {
  0: "bg-green-100 text-green-800",
  1: "bg-orange-100 text-orange-800",
  2: "bg-red-100 text-red-800",
  3: "bg-orange-100 text-orange-800",
  4: "bg-red-100 text-red-800",
};
