import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as vscode from "vscode";
import CNextCompletionProvider, {
  mapToCompletionKind,
  type TSymbolKind,
} from "../CompletionProvider";
import type { ISymbolInfo } from "../../server/CNextServerClient";
import WorkspaceIndex from "../../state/WorkspaceIndex";
import SymbolResolver from "../../state/SymbolResolver";

describe("CNextCompletionProvider", () => {
  it("should not write debug files to /tmp", () => {
    const source = fs.readFileSync(
      new URL("../CompletionProvider.ts", import.meta.url),
      "utf-8",
    );
    expect(source).not.toContain("/tmp/cnext-completions.txt");
    expect(source).not.toContain("/tmp/cnext-workspace-symbols.txt");
  });
});

describe("mapToCompletionKind", () => {
  it("maps namespace to Module", () => {
    expect(mapToCompletionKind("namespace")).toBe(
      vscode.CompletionItemKind.Module,
    );
  });

  it("maps scope to Module", () => {
    expect(mapToCompletionKind("scope")).toBe(vscode.CompletionItemKind.Module);
  });

  it("maps class to Module", () => {
    expect(mapToCompletionKind("class")).toBe(vscode.CompletionItemKind.Module);
  });

  it("maps struct to Struct", () => {
    expect(mapToCompletionKind("struct")).toBe(
      vscode.CompletionItemKind.Struct,
    );
  });

  it("maps register to Module", () => {
    expect(mapToCompletionKind("register")).toBe(
      vscode.CompletionItemKind.Module,
    );
  });

  it("maps function to Function", () => {
    expect(mapToCompletionKind("function")).toBe(
      vscode.CompletionItemKind.Function,
    );
  });

  it("maps method to Function", () => {
    expect(mapToCompletionKind("method")).toBe(
      vscode.CompletionItemKind.Function,
    );
  });

  it("maps variable to Variable", () => {
    expect(mapToCompletionKind("variable")).toBe(
      vscode.CompletionItemKind.Variable,
    );
  });

  it("maps field to Variable", () => {
    expect(mapToCompletionKind("field")).toBe(
      vscode.CompletionItemKind.Variable,
    );
  });

  it("maps enum to Enum", () => {
    expect(mapToCompletionKind("enum")).toBe(vscode.CompletionItemKind.Enum);
  });

  it("maps enumMember to EnumMember", () => {
    expect(mapToCompletionKind("enumMember")).toBe(
      vscode.CompletionItemKind.EnumMember,
    );
  });

  it("maps bitmap to Struct", () => {
    expect(mapToCompletionKind("bitmap")).toBe(
      vscode.CompletionItemKind.Struct,
    );
  });

  it("maps bitmapField to Field", () => {
    expect(mapToCompletionKind("bitmapField")).toBe(
      vscode.CompletionItemKind.Field,
    );
  });

  it("maps registerMember to Field", () => {
    expect(mapToCompletionKind("registerMember")).toBe(
      vscode.CompletionItemKind.Field,
    );
  });

  it("maps callback to Function", () => {
    expect(mapToCompletionKind("callback")).toBe(
      vscode.CompletionItemKind.Function,
    );
  });

  it("maps unknown kind to Text", () => {
    expect(mapToCompletionKind("unknown" as TSymbolKind)).toBe(
      vscode.CompletionItemKind.Text,
    );
  });
});

// Helper to access private getMemberCompletions
function callGetMemberCompletions(
  provider: CNextCompletionProvider,
  symbols: ISymbolInfo[],
  chain: string[],
  currentScope: string | null,
  currentFunction: string | null,
): vscode.CompletionItem[] {
  return (
    provider as unknown as {
      getMemberCompletions: (
        symbols: ISymbolInfo[],
        chain: string[],
        currentScope: string | null,
        currentFunction: string | null,
      ) => vscode.CompletionItem[];
    }
  ).getMemberCompletions(symbols, chain, currentScope, currentFunction);
}

function names(items: vscode.CompletionItem[]): string[] {
  return items.map((i) =>
    typeof i.label === "string" ? i.label : i.label.label,
  );
}

// Helper to access private filterCompletionsByPrefix
function callFilterCompletionsByPrefix(
  provider: CNextCompletionProvider,
  items: vscode.CompletionItem[] | undefined,
  prefix: string,
): vscode.CompletionItem[] {
  return (
    provider as unknown as {
      filterCompletionsByPrefix: (
        items: vscode.CompletionItem[] | undefined,
        prefix: string,
      ) => vscode.CompletionItem[];
    }
  ).filterCompletionsByPrefix(items, prefix);
}

// Helper to access private addWorkspaceSymbols
function callAddWorkspaceSymbols(
  provider: CNextCompletionProvider,
  allItems: vscode.CompletionItem[],
  symbols: vscode.SymbolInformation[] | undefined,
  prefix: string,
): void {
  (
    provider as unknown as {
      addWorkspaceSymbols: (
        allItems: vscode.CompletionItem[],
        symbols: vscode.SymbolInformation[] | undefined,
        prefix: string,
      ) => void;
    }
  ).addWorkspaceSymbols(allItems, symbols, prefix);
}

// Helper to access private addArduinoFallbacks
function callAddArduinoFallbacks(
  provider: CNextCompletionProvider,
  allItems: vscode.CompletionItem[],
  prefix: string,
): void {
  (
    provider as unknown as {
      addArduinoFallbacks: (
        allItems: vscode.CompletionItem[],
        prefix: string,
      ) => void;
    }
  ).addArduinoFallbacks(allItems, prefix);
}

// Helper to access private getNamedMemberCompletions
function callGetNamedMemberCompletions(
  provider: CNextCompletionProvider,
  symbols: ISymbolInfo[],
  parentName: string,
): vscode.CompletionItem[] {
  return (
    provider as unknown as {
      getNamedMemberCompletions: (
        symbols: ISymbolInfo[],
        parentName: string,
      ) => vscode.CompletionItem[];
    }
  ).getNamedMemberCompletions(symbols, parentName);
}

describe("filterCompletionsByPrefix", () => {
  const resolver = new SymbolResolver(null);
  const provider = new CNextCompletionProvider(resolver);

  it("filters items by prefix", () => {
    const items = [
      new vscode.CompletionItem("Serial", vscode.CompletionItemKind.Variable),
      new vscode.CompletionItem("Serial1", vscode.CompletionItemKind.Variable),
      new vscode.CompletionItem("pinMode", vscode.CompletionItemKind.Function),
    ];

    const result = callFilterCompletionsByPrefix(provider, items, "ser");
    expect(result).toHaveLength(2);
    expect(names(result)).toContain("Serial");
    expect(names(result)).toContain("Serial1");
  });

  it("returns empty array for undefined items", () => {
    const result = callFilterCompletionsByPrefix(provider, undefined, "ser");
    expect(result).toHaveLength(0);
  });

  it("returns empty array when no items match prefix", () => {
    const items = [
      new vscode.CompletionItem(
        "digitalWrite",
        vscode.CompletionItemKind.Function,
      ),
    ];
    const result = callFilterCompletionsByPrefix(provider, items, "ser");
    expect(result).toHaveLength(0);
  });
});

describe("addWorkspaceSymbols", () => {
  const resolver = new SymbolResolver(null);
  const provider = new CNextCompletionProvider(resolver);

  it("adds workspace symbols not already in the list", () => {
    const allItems: vscode.CompletionItem[] = [
      new vscode.CompletionItem("Serial", vscode.CompletionItemKind.Variable),
    ];

    const symbols: vscode.SymbolInformation[] = [
      {
        name: "Serial",
        kind: vscode.SymbolKind.Variable,
        location: new vscode.Location(
          vscode.Uri.file("/test.cpp"),
          new vscode.Range(0, 0, 0, 0),
        ),
        containerName: "",
      },
      {
        name: "Serial1",
        kind: vscode.SymbolKind.Variable,
        location: new vscode.Location(
          vscode.Uri.file("/test.cpp"),
          new vscode.Range(0, 0, 0, 0),
        ),
        containerName: "",
      },
    ];

    callAddWorkspaceSymbols(provider, allItems, symbols, "ser");
    expect(allItems).toHaveLength(2);
    expect(names(allItems)).toContain("Serial1");
  });

  it("does nothing for undefined symbols", () => {
    const allItems: vscode.CompletionItem[] = [];
    callAddWorkspaceSymbols(provider, allItems, undefined, "ser");
    expect(allItems).toHaveLength(0);
  });
});

describe("addArduinoFallbacks", () => {
  const resolver = new SymbolResolver(null);
  const provider = new CNextCompletionProvider(resolver);

  it("adds Arduino globals matching prefix", () => {
    const allItems: vscode.CompletionItem[] = [];
    callAddArduinoFallbacks(provider, allItems, "ser");
    expect(allItems.length).toBeGreaterThan(0);
    expect(names(allItems).some((n) => n.startsWith("Serial"))).toBe(true);
  });

  it("skips items already in the list", () => {
    const allItems: vscode.CompletionItem[] = [
      new vscode.CompletionItem("Serial", vscode.CompletionItemKind.Variable),
    ];
    callAddArduinoFallbacks(provider, allItems, "ser");
    const serialCount = names(allItems).filter((n) => n === "Serial").length;
    expect(serialCount).toBe(1);
  });
});

describe("getNamedMemberCompletions — type resolution", () => {
  const resolver = new SymbolResolver(null);
  const provider = new CNextCompletionProvider(resolver);

  it("resolves typed variable to struct members", () => {
    const symbols: ISymbolInfo[] = [
      {
        name: "Sensor",
        fullName: "Sensor",
        id: "Sensor",
        kind: "namespace",
      },
      {
        name: "current",
        fullName: "Sensor.current",
        id: "Sensor.current",
        parentId: "Sensor",
        kind: "variable",
        type: "TSensorValue",
        parent: "Sensor",
      },
      {
        name: "TSensorValue",
        fullName: "TSensorValue",
        id: "TSensorValue",
        kind: "struct",
      },
      {
        name: "value",
        fullName: "TSensorValue.value",
        id: "TSensorValue.value",
        parentId: "TSensorValue",
        kind: "field",
        type: "f32",
        parent: "TSensorValue",
      },
      {
        name: "valid",
        fullName: "TSensorValue.valid",
        id: "TSensorValue.valid",
        parentId: "TSensorValue",
        kind: "field",
        type: "bool",
        parent: "TSensorValue",
      },
    ];

    // "current" is a typed variable — should resolve to TSensorValue members
    const items = callGetNamedMemberCompletions(provider, symbols, "current");
    const n = names(items);
    expect(n).toContain("value");
    expect(n).toContain("valid");
  });
});

describe("getMemberCompletions", () => {
  const resolver = new SymbolResolver(null);
  const provider = new CNextCompletionProvider(resolver);

  const scopeSymbols: ISymbolInfo[] = [
    { name: "LED", fullName: "LED", id: "LED", kind: "namespace" },
    {
      name: "pin",
      fullName: "LED.pin",
      id: "LED.pin",
      parentId: "LED",
      kind: "variable",
      parent: "LED",
    },
    {
      name: "state",
      fullName: "LED.state",
      id: "LED.state",
      parentId: "LED",
      kind: "variable",
      parent: "LED",
    },
    {
      name: "on",
      fullName: "LED.on",
      id: "LED.on",
      parentId: "LED",
      kind: "function",
      parent: "LED",
    },
    {
      name: "off",
      fullName: "LED.off",
      id: "LED.off",
      parentId: "LED",
      kind: "function",
      parent: "LED",
    },
    {
      name: "toggle",
      fullName: "LED.toggle",
      id: "LED.toggle",
      parentId: "LED",
      kind: "function",
      parent: "LED",
    },
  ];

  const enumSymbols: ISymbolInfo[] = [
    { name: "Color", fullName: "Color", id: "Color", kind: "enum" },
    {
      name: "Red",
      fullName: "Color.Red",
      id: "Color.Red",
      parentId: "Color",
      kind: "enumMember",
      parent: "Color",
    },
    {
      name: "Green",
      fullName: "Color.Green",
      id: "Color.Green",
      parentId: "Color",
      kind: "enumMember",
      parent: "Color",
    },
    {
      name: "Blue",
      fullName: "Color.Blue",
      id: "Color.Blue",
      parentId: "Color",
      kind: "enumMember",
      parent: "Color",
    },
    { name: "Display", fullName: "Display", id: "Display", kind: "namespace" },
    {
      name: "currentColor",
      fullName: "Display.currentColor",
      id: "Display.currentColor",
      parentId: "Display",
      kind: "variable",
      parent: "Display",
      type: "Color",
    },
    {
      name: "setColor",
      fullName: "Display.setColor",
      id: "Display.setColor",
      parentId: "Display",
      kind: "function",
      parent: "Display",
    },
  ];

  const globalSymbols: ISymbolInfo[] = [
    { name: "Driver", fullName: "Driver", id: "Driver", kind: "namespace" },
    {
      name: "init",
      fullName: "Driver.init",
      id: "Driver.init",
      parentId: "Driver",
      kind: "function",
      parent: "Driver",
    },
    {
      name: "driverVersion",
      fullName: "driverVersion",
      id: "driverVersion",
      kind: "variable",
    },
    {
      name: "driverHelper",
      fullName: "driverHelper",
      id: "driverHelper",
      kind: "function",
    },
  ];

  it("returns empty for empty chain", () => {
    const items = callGetMemberCompletions(
      provider,
      scopeSymbols,
      [],
      null,
      null,
    );
    expect(items).toHaveLength(0);
  });

  describe("this. completions", () => {
    it("shows scope members for this.", () => {
      const items = callGetMemberCompletions(
        provider,
        scopeSymbols,
        ["this"],
        "LED",
        "toggle",
      );
      const n = names(items);
      expect(n).toContain("pin");
      expect(n).toContain("state");
      expect(n).toContain("on");
      expect(n).toContain("off");
      expect(n).not.toContain("toggle"); // current function filtered
    });

    it("returns empty outside a scope", () => {
      const items = callGetMemberCompletions(
        provider,
        scopeSymbols,
        ["this"],
        null,
        null,
      );
      expect(items).toHaveLength(0);
    });

    it("resolves this.field. chain via type", () => {
      const items = callGetMemberCompletions(
        provider,
        enumSymbols,
        ["this", "currentColor"],
        "Display",
        "setColor",
      );
      const n = names(items);
      expect(n).toContain("Red");
      expect(n).toContain("Green");
      expect(n).toContain("Blue");
    });
  });

  describe("ScopeName. completions", () => {
    it("shows members for named scope", () => {
      const items = callGetMemberCompletions(
        provider,
        scopeSymbols,
        ["LED"],
        null,
        null,
      );
      const n = names(items);
      expect(n).toContain("pin");
      expect(n).toContain("on");
      expect(n).toContain("toggle");
    });

    it("shows enum members for enum name", () => {
      const items = callGetMemberCompletions(
        provider,
        enumSymbols,
        ["Color"],
        null,
        null,
      );
      const n = names(items);
      expect(n).toContain("Red");
      expect(n).toContain("Green");
      expect(n).toContain("Blue");
    });

    it("returns empty for unknown parent", () => {
      const items = callGetMemberCompletions(
        provider,
        scopeSymbols,
        ["Unknown"],
        null,
        null,
      );
      expect(items).toHaveLength(0);
    });
  });

  describe("global. completions", () => {
    it("shows top-level symbols", () => {
      const items = callGetMemberCompletions(
        provider,
        globalSymbols,
        ["global"],
        "Driver",
        "init",
      );
      const n = names(items);
      expect(n).toContain("driverVersion");
      expect(n).toContain("driverHelper");
      expect(n).not.toContain("Driver"); // namespace excluded
    });

    it("filters out current function at global level", () => {
      const items = callGetMemberCompletions(
        provider,
        globalSymbols,
        ["global"],
        null,
        "driverHelper",
      );
      const n = names(items);
      expect(n).toContain("driverVersion");
      expect(n).not.toContain("driverHelper");
    });
  });

  describe("cross-file include merge", () => {
    it("merges included symbols from WorkspaceIndex", () => {
      // Set up a WorkspaceIndex with cached included symbols
      const existing = WorkspaceIndex.getInstance();
      existing.dispose();
      const index = WorkspaceIndex.getInstance();

      const mainUri = vscode.Uri.file("/project/main.cnx");
      const driverUri = vscode.Uri.file("/project/driver.cnx");

      // Populate cache and include dependencies
      const raw = index as unknown as {
        cache: {
          set: (
            uri: typeof vscode.Uri.prototype,
            symbols: ISymbolInfo[],
            mtime: number,
            hasErrors: boolean,
          ) => void;
        };
        scanner: {
          includeDependencies: Map<string, string[]>;
        };
      };
      const internals = {
        cache: raw.cache,
        includeDependencies: raw.scanner.includeDependencies,
      };

      internals.cache.set(
        driverUri,
        [
          {
            name: "Motor",
            fullName: "Motor",
            id: "Motor",
            kind: "namespace",
            parent: undefined,
          },
          {
            name: "spin",
            fullName: "Motor.spin",
            id: "Motor.spin",
            parentId: "Motor",
            kind: "function",
            parent: "Motor",
          },
        ],
        Date.now(),
        false,
      );
      internals.includeDependencies.set(mainUri.fsPath, [driverUri.fsPath]);

      // Create provider with the workspaceIndex
      const resolverWithIndex = new SymbolResolver(index);
      const providerWithIndex = new CNextCompletionProvider(
        resolverWithIndex,
        index,
      );

      // Call getMemberCompletions with documentUri — should merge included symbols
      const items = (
        providerWithIndex as unknown as {
          getMemberCompletions: (
            symbols: ISymbolInfo[],
            chain: string[],
            currentScope: string | null,
            currentFunction: string | null,
            documentUri?: typeof vscode.Uri.prototype,
          ) => vscode.CompletionItem[];
        }
      ).getMemberCompletions([], ["Motor"], null, null, mainUri);

      const n = names(items);
      expect(n).toContain("spin");

      index.dispose();
    });
  });
});

// ADR-072: a register member's completions come from the block the cursor is
// in -- a register body, one of its offset groups, or neither
describe("register member completions", () => {
  const MODIFIERS = ["rw", "ro", "wo", "w1c", "w1s"];

  const itemsAt = async (
    content: string,
    symbols: object[] = [],
    workspaceIndex?: WorkspaceIndex,
  ): Promise<vscode.CompletionItem[]> => {
    const document = vscode.createMockTextDocument({ content });
    const lines = content.split("\n");
    const provider = new CNextCompletionProvider(
      new SymbolResolver(workspaceIndex ?? null),
      workspaceIndex,
      {
        debug: () => {},
        serverClient: { parseSymbols: async () => ({ symbols }) },
      } as never,
    );
    return provider.provideCompletionItems(
      document,
      new vscode.Position(lines.length - 1, lines.at(-1)!.length),
      vscode.createMockCancellationToken(),
      vscode.createMockCompletionContext(),
    );
  };

  const labelsAt = async (
    content: string,
    symbols: object[] = [],
  ): Promise<string[]> =>
    (await itemsAt(content, symbols)).map((item) => String(item.label));

  it.each([
    ["a literal offset", "register R {\n    0x00 "],
    ["a named offset", "register R {\n    CTRL_OFFSET "],
    ["an 0X offset", "register R {\n    0X10 "],
    ["an offset expression", "register R {\n    BASE + 4 "],
    ["a group member's start", "register R {\n    0x00 {\n        "],
    ["a partly typed modifier", "register R {\n    0x00 r"],
    ["a group member on the brace's line", "register R {\n    0x00 { "],
    ["a ternary offset", "register R {\n    (mode = 1) ? 0x10 : 0x20 "],
    [
      "a ternary offset wrapped before its ':'",
      "register R {\n    (mode = 1) ? 0x10\n        : 0x20 ",
    ],
    [
      "an offset wrapped inside its parentheses",
      "register R {\n    (base +\n        4) ",
    ],
    [
      "an offset wrapped before an operator",
      "register R {\n    (base\n        + 4) ",
    ],
    ["an offset and a comment", "register R {\n    0x00 /* status */ "],
    [
      "an offset below a comment holding a brace",
      "register R {\n    // 0x00 {\n    0x04 ",
    ],
    [
      "an offset in a register below a #pragma line",
      "#pragma target cortex-m7\nregister R {\n    0x00 ",
    ],
    ["a member after another on one line", "register R { 0x00 rw u8 A, 0x04 "],
    [
      "a member after a group",
      "register R {\n    0x00 {\n        ro u8 A,\n    },\n    0x04 ",
    ],
  ])("offers access modifiers after %s", async (_name, content) => {
    expect(await labelsAt(content)).toEqual(MODIFIERS);
  });

  it("offers types after an access modifier, in a register and in a group", async () => {
    const types = await labelsAt("register R {\n    0x00 rw ");
    expect(types).toContain("u32");
    expect(await labelsAt("register R {\n    0x00 rw u")).toEqual(types);
    expect(types).not.toContain("rw");
    expect(await labelsAt("register R {\n    0x00 {\n        ro ")).toEqual(
      types,
    );
  });

  it("offers neither outside a register", async () => {
    const types = await labelsAt("register R {\n    0x00 rw ");
    const continuation = await labelsAt(
      "void f() {\n    u32 x <- 1 +\n        5 ",
    );
    expect(continuation).not.toEqual(MODIFIERS);
    expect(continuation).not.toEqual(types);
    expect(
      await labelsAt("register R {\n    0x00 rw u8 A,\n}\n0x00 "),
    ).not.toEqual(MODIFIERS);
    expect(await labelsAt("Point p <- {x: ")).not.toEqual(types);
  });

  it.each([
    ["a member's name", "register R {\n    0x00 rw u32 "],
    ["a group member's name", "register R {\n    0x00 {\n        ro u8 "],
    ["a blank line in a register", "register R {\n    "],
    ["an offset with no space after it", "register R {\n    (BASE)"],
    [
      "a group's closing brace",
      "register R {\n    0x00 {\n        ro u8 A,\n    } ",
    ],
  ])("offers no access modifiers at %s", async (_name, content) => {
    expect(await labelsAt(content)).not.toEqual(MODIFIERS);
  });

  it("offers no types on a blank line in a register", async () => {
    const types = await labelsAt("void f() {\n    ");
    expect(await labelsAt("register R {\n    ")).not.toEqual(types);
  });

  it("offers the file's bitmaps, enums and structs after an access modifier", async () => {
    const types = await labelsAt("register R {\n    0x00 rw ", [
      { name: "Flags", fullName: "Flags", id: "Flags", kind: "bitmap" },
      { name: "Mode", fullName: "Mode", id: "Mode", kind: "enum" },
      { name: "Pair", fullName: "Pair", id: "Pair", kind: "struct" },
      { name: "Port", fullName: "Port", id: "Port", kind: "register" },
    ]);
    expect(types).toEqual(
      expect.arrayContaining(["u32", "Flags", "Mode", "Pair"]),
    );
    expect(types).not.toContain("bitmap8");
    expect(types).not.toContain("Port");
    const inScope = await labelsAt(
      "scope Gpio {\n    register Port {\n        0x00 rw ",
      [
        { name: "Gpio", fullName: "Gpio", id: "Gpio", kind: "namespace" },
        {
          name: "Pins",
          fullName: "Gpio__Pins",
          id: "Gpio.Pins",
          parentId: "Gpio",
          kind: "bitmap",
        },
        {
          name: "Flags",
          fullName: "Other__Flags",
          id: "Other.Flags",
          parentId: "Other",
          kind: "bitmap",
        },
      ],
    );
    expect(inScope).toContain("Pins");
    expect(inScope).not.toContain("Flags");
  });

  it("offers an included header's types after an access modifier, once each", async () => {
    WorkspaceIndex.getInstance().dispose();
    const index = WorkspaceIndex.getInstance();
    const raw = index as unknown as {
      headerCache: {
        set: (
          uri: vscode.Uri,
          symbols: object[],
          mtime: number,
          hasErrors: boolean,
        ) => void;
      };
      scanner: { includeDependencies: Map<string, string[]> };
    };
    // What parseCHeader sends for `typedef struct { ... } Pair;`,
    // `typedef enum { ... } Mode;` and `void init(void);`, in the shape
    // WorkspaceScanner.indexHeaderFile stores it
    const header = "/test/hw.h";
    raw.headerCache.set(
      vscode.Uri.file(header),
      [
        { name: "Pair", fullName: "Pair", kind: "struct", sourceFile: header },
        { name: "Pair", fullName: "Pair", kind: "type", sourceFile: header },
        { name: "Mode", fullName: "Mode", kind: "type", sourceFile: header },
        {
          name: "init",
          fullName: "init",
          kind: "function",
          sourceFile: header,
        },
      ],
      Date.now(),
      false,
    );
    raw.scanner.includeDependencies.set("/test/file.cnx", [header]);
    try {
      const items = await itemsAt("register R {\n    0x00 rw ", [], index);
      expect(
        items
          .filter((item) =>
            ["Pair", "Mode", "init"].includes(String(item.label)),
          )
          .map((item) => `${String(item.label)}: ${item.detail}`),
      ).toEqual(["Pair: struct (hw.h)", "Mode: type (hw.h)"]);
      // the global list names the header the same way
      const global = await itemsAt("u32 x <- ", [], index);
      expect(
        global
          .filter((item) => item.label === "Mode")
          .map((item) => item.detail),
      ).toEqual(["type (hw.h)"]);
    } finally {
      index.dispose();
    }
  });

  it("offers neither while an offset expression is unfinished", async () => {
    expect(await labelsAt("register R {\n    (mode = 1) ? ")).not.toEqual(
      MODIFIERS,
    );
    expect(await labelsAt("register R {\n    (mode = 1) ? 0x10 ")).not.toEqual(
      MODIFIERS,
    );
    expect(
      await labelsAt("register R {\n    (mode = 1) ? 0x10 : "),
    ).not.toEqual(MODIFIERS);
    expect(await labelsAt("register R {\n    BASE + ")).not.toEqual(MODIFIERS);
    expect(await labelsAt("register R {\n    BASE + O")).not.toEqual(MODIFIERS);
    expect(await labelsAt("register R {\n    (BASE ")).not.toEqual(MODIFIERS);
  });
});
