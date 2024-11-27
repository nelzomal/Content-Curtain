import { parseSafetyLevelResponse, parseSystemPromptResponse } from "../utils";

describe("parseSystemPromptMessage", () => {
  it("should extract rules and content correctly", () => {
    const input = `
      **Moderation Rule 1** This is the first rule content.
      **Moderation Rule 2** This is the second rule content.
      **General Information** This is not a moderation rule.
    `;

    const expectedOutput = [
      "This is the first rule content.",
      "This is the second rule content.",
      "General Information",
    ];

    const result = parseSystemPromptResponse(input);
    expect(result).toEqual(expectedOutput);
  });

  it("should return an empty array for no matches", () => {
    const input = "No rules here!";
    const result = parseSystemPromptResponse(input);
    expect(result).toEqual([]);
  });

  it("should handle empty input gracefully", () => {
    const input = "";
    const result = parseSystemPromptResponse(input);
    expect(result).toEqual([]);
  });

  it("should extract rules from story spoiler moderation message", () => {
    const input = `
      **Content Moderation Rules for "story spoiler 1":**
      **Content Moderation Rules for "story spoiler 2":**
      **Content Moderation Rules for "story spoiler 3":**
      **Content Moderation Rules for "story spoiler 4":**
      **Content Moderation Rules for "story spoiler 5":**
      **Content Moderation Rules for "story spoiler 6":**
      1. **No revealing major plot points or character deaths.**
      2. **Spoilers should be limited to minor details or plot twists that don't significantly impact the enjoyment of the story.**
      3. **Avoid mentioning character names before the point where they are revealed in the story.**
      4. **Do not discuss ending details unless they are clearly stated in the story.**
    `;

    const expectedOutput = [
      'Content Moderation Rules for "story spoiler 1":',
      'Content Moderation Rules for "story spoiler 2":',
      'Content Moderation Rules for "story spoiler 3":',
      'Content Moderation Rules for "story spoiler 4":',
      'Content Moderation Rules for "story spoiler 5":',
      'Content Moderation Rules for "story spoiler 6":',
      "No revealing major plot points or character deaths.",
      "Spoilers should be limited to minor details or plot twists that don't significantly impact the enjoyment of the story.",
      "Avoid mentioning character names before the point where they are revealed in the story.",
      "Do not discuss ending details unless they are clearly stated in the story.",
    ];

    const result = parseSystemPromptResponse(input);
    expect(result).toEqual(expectedOutput);
  });
});

describe("parseSafetyLevelResponse", () => {
  it("should extract rules and content correctly", () => {
    const input = `
      some message
      **0-2: No adult content or violence**
      **3-4: Mild references to adult themes or mild violence (like pushing)**
      **5-6: Moderate adult content or violence (fighting, mild gore)**
      **7-8: Strong adult content or violence**
      **9-10: Extreme adult content or extreme violence**
    `;

    const expectedOutput = [
      "0-2: No adult content or violence",
      "3-4: Mild references to adult themes or mild violence (like pushing)",
      "5-6: Moderate adult content or violence (fighting, mild gore)",
      "7-8: Strong adult content or violence",
      "9-10: Extreme adult content or extreme violence",
    ];

    const result = parseSafetyLevelResponse(input);
    expect(result).toEqual(expectedOutput);
  });
});
