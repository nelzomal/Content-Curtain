import { TextBlock } from "../types";

const BLOCK_TAGS = new Set([
  "div",
  "p",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",
  "section",
  "article",
  "header",
  "footer",
  "nav",
  "aside",
  "main",
  "blockquote",
  "figure",
  "figcaption",
  "address",
  "table",
  "tr",
  "thead",
  "tbody",
  "tfoot",
  "form",
  "fieldset",
  "legend",
  "hr",
  "details",
  "summary",
]);

function isBlockElement(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return false;

  // Check if the element's tag is a known block tag
  if (BLOCK_TAGS.has(node.tagName.toLowerCase())) {
    return true;
  }

  // Fallback to checking the computed display style
  const display = window.getComputedStyle(node).display;
  return ["block", "flex", "grid", "table"].includes(display);
}

// Helper function to trace back recursively and find the first block-level element
function traceBackToBlockElement(node: Node): Node | null {
  if (!(node instanceof HTMLElement)) {
    return node.parentElement
      ? traceBackToBlockElement(node.parentElement)
      : null;
  }

  // Recursively trace back to the first block-level element
  // if (isBlockElement(node) && node.childNodes.length > 1) {
  if (isBlockElement(node)) {
    return node;
  }

  return node.parentElement
    ? traceBackToBlockElement(node.parentElement)
    : null;
}

function isFirstInlineElement(node: Node, blockElement: Node): boolean {
  if (!blockElement || !(blockElement instanceof HTMLElement)) {
    return false;
  }

  // Get all text and inline element nodes
  const inlineNodes = Array.from(blockElement.childNodes).filter(
    (child) =>
      child.nodeType === Node.TEXT_NODE ||
      (child instanceof HTMLElement &&
        window.getComputedStyle(child).display === "inline" &&
        child.textContent?.trim() !== "")
  );

  // Return true if our node is the first non-empty inline node
  return (
    inlineNodes.length > 0 &&
    inlineNodes[0].textContent !== null &&
    node.textContent !== null &&
    inlineNodes[0].textContent === node.textContent
  );
}

/**
 * Checks if a node or its ancestors match a filter function up to a specified depth
 * @param node The node to check
 * @param filterFunc Function that returns true if the node should be filtered
 * @param depth How many levels up the DOM tree to check
 * @returns boolean True if the node or any ancestor up to depth matches the filter
 */
function filterNode(
  node: Node,
  filterFunc: (node: Node) => boolean,
  depth: number = 1
): boolean {
  let currentNode: Node | null = node;
  let remainingDepth = depth;

  while (currentNode && remainingDepth > 0) {
    if (filterFunc(currentNode)) {
      return true;
    }
    remainingDepth--;
    currentNode = currentNode.parentNode;
  }
  return false;
}

type NodeFilter = (node: Node) => boolean;

// Add this new function near the other utility functions
function isNodeVisible(node: Node): boolean {
  if (!(node instanceof HTMLElement)) {
    return true; // Text nodes are visible by default
  }

  // Check display style
  const style = window.getComputedStyle(node);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }

  // Check hidden attribute
  if (node.hasAttribute("hidden")) {
    return false;
  }

  // Check aria-hidden (with special case for fallback-image)
  if (
    node.hasAttribute("aria-hidden") &&
    node.getAttribute("aria-hidden") === "true" &&
    (!node.className || !node.className.includes("fallback-image"))
  ) {
    return false;
  }

  return true;
}

// Add these filter functions before getTextNodeByWalker
function filterByTag(node: Node): boolean {
  const ignore_tags = ["SVG", "STYLE", "SCRIPT", "IFRAME", "DIALOG"];
  return ignore_tags.includes(node.nodeName);
}

function filterByDisplay(node: Node): boolean {
  if (node && node instanceof Element) {
    const style = window.getComputedStyle(node);
    return style.display === "none" || style.visibility === "hidden";
  }
  return false;
}

function filterByPosition(node: Node): boolean {
  if (node && node instanceof Element) {
    let boundingRect = node.getBoundingClientRect();
    const centerX = boundingRect.left + boundingRect.width / 2;
    const centerY = boundingRect.top + boundingRect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);
    if (
      topElement &&
      node !== topElement &&
      !node.contains(topElement) &&
      !topElement.contains(node)
    ) {
      return true;
    }
  }
  return false;
}

function filterBySize(node: Node): boolean {
  if (node && node.nodeType === Node.TEXT_NODE && node.parentElement) {
    let boundingRect = node.parentElement.getBoundingClientRect();
    return boundingRect.width <= 1 && boundingRect.height <= 1;
  }
  return false;
}

function filterByTextContent(node: Node): boolean {
  return (
    node.nodeType === Node.TEXT_NODE && node.textContent!.trim().length === 0
  );
}

/**
 * Walks through the document's text nodes and groups them into blocks
 * based on their containing block-level elements
 * @param filters Array of filter functions to exclude certain nodes
 * @returns Array of text node groups, where each group represents a block of content
 */
export function getVisibleTextNodeByWalker(
  filters: NodeFilter[] = []
): Node[][] {
  // Combine all default filters
  const defaultFilters = [
    (node: Node) => !isNodeVisible(node),
    filterByTag,
    filterByDisplay,
    filterByPosition,
    filterBySize,
    filterByTextContent,
  ];

  const allFilters = [...defaultFilters, ...filters];

  const textNodeBlocks: Node[][] = [];
  let inlineBlock: Node[] = [];

  let treeWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node: Node) => {
        for (let filter of allFilters) {
          if (filterNode(node, filter)) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let currentNode = treeWalker.nextNode();

  while (currentNode) {
    const blockElement = traceBackToBlockElement(currentNode);
    // Check if the current node is the first child of its block element
    if (blockElement && isFirstInlineElement(currentNode, blockElement)) {
      // If the current node is the first text node in a new block element, close the current block and start a new one
      if (inlineBlock.length > 0) {
        textNodeBlocks.push(inlineBlock); // Push the previous block to the array
        inlineBlock = []; // Start a new block
      }
    }

    inlineBlock.push(currentNode);
    currentNode = treeWalker.nextNode();
  }

  // Push the last block if it has any nodes
  if (inlineBlock.length > 0) {
    textNodeBlocks.push(inlineBlock);
  }
  return textNodeBlocks;
}

export function getVisbileTextBlocks(blocks: Node[][]): TextBlock[] {
  return blocks.map((block, index) => {
    return {
      text: block
        .map((node) => node.textContent)
        .join(" ")
        .trim()
        .replace(/\s+/g, " "),
      index: index,
      nodes: block,
    };
  });
}
