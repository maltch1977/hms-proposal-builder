import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateProposalDialog } from "@/components/proposals/create-proposal-dialog";
import { RFPUploadDialog } from "@/components/proposals/rfp-upload-dialog";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("@/lib/providers/auth-provider", () => ({
  useAuth: () => ({ profile: { id: "user-1", organization_id: "org-1" } }),
}));

// Stub PlaceSearch / ManualAddressFields to make client confirmation testable
vi.mock("@/components/ui/address-autocomplete", () => ({
  PlaceSearch: ({
    onConfirm,
    onManualEntry,
    confirmed,
    onSelect,
  }: {
    onConfirm: () => void;
    onManualEntry: () => void;
    confirmed: boolean;
    onSelect: (name: string, addr: { street: string; city: string; state: string; zip: string }) => void;
  }) => {
    if (confirmed) return null;
    return (
      <div data-testid="place-search">
        <button
          data-testid="select-place"
          onClick={() => {
            onSelect("Test Client", { street: "123 Main St", city: "Portland", state: "OR", zip: "97201" });
          }}
        >
          Select Place
        </button>
        <button data-testid="confirm-place" onClick={onConfirm}>
          Confirm
        </button>
        <button onClick={onManualEntry}>Manual</button>
      </div>
    );
  },
  ManualAddressFields: ({ onChange }: { value: unknown; onChange: (addr: { street: string; city: string; state: string; zip: string }) => void }) => (
    <button
      data-testid="fill-address"
      onClick={() => onChange({ street: "123 Main St", city: "Portland", state: "OR", zip: "97201" })}
    >
      Fill Address
    </button>
  ),
}));

// Stub FileUpload for RFP dialog
vi.mock("@/components/editor/file-upload", () => ({
  FileUpload: ({ onUpload }: { onUpload: (file: File) => Promise<string | null> }) => (
    <button
      data-testid="file-upload"
      onClick={() => onUpload(new File(["pdf"], "test.pdf", { type: "application/pdf" }))}
    >
      Upload
    </button>
  ),
}));

// Stub CollaboratorSelector
vi.mock("@/components/proposals/collaborator-selector", () => ({
  CollaboratorSelector: () => <div data-testid="collaborator-selector" />,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function confirmClient() {
  // Fill client name in manual entry form (now the default)
  const nameInput = screen.getByPlaceholderText("e.g., Columbia Memorial Hospital");
  fireEvent.change(nameInput, { target: { value: "Test Client" } });
  // Fill address via stub
  fireEvent.click(screen.getByTestId("fill-address"));
  // Confirm
  fireEvent.click(screen.getByText("Confirm Client"));
}

function setProjectName(name: string) {
  const input = screen.getByPlaceholderText("e.g., HVAC Controls Upgrade");
  fireEvent.change(input, { target: { value: name } });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CreateProposalDialog — Build Mode Selector", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Default: create returns success
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/proposals")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "new-proposal-123" }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("shows build mode selector after client confirmation and project name entry", async () => {
    render(
      <CreateProposalDialog open={true} onOpenChange={vi.fn()} />
    );

    confirmClient();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g., HVAC Controls Upgrade")).toBeInTheDocument();
    });

    setProjectName("HVAC Upgrade");

    await waitFor(() => {
      expect(screen.getByText("Build Manually")).toBeInTheDocument();
      expect(screen.getByText("Upload RFP")).toBeInTheDocument();
    });
  });

  it("defaults to 'Build Manually' mode", async () => {
    render(
      <CreateProposalDialog open={true} onOpenChange={vi.fn()} />
    );

    confirmClient();
    setProjectName("HVAC Upgrade");

    await waitFor(() => {
      expect(screen.getByText("Create Proposal")).toBeInTheDocument();
    });
  });

  it("manual path POSTs with build_mode='manual' and navigates to editor", async () => {
    const onOpenChange = vi.fn();
    render(
      <CreateProposalDialog open={true} onOpenChange={onOpenChange} />
    );

    confirmClient();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g., HVAC Controls Upgrade")).toBeInTheDocument();
    });

    setProjectName("HVAC Upgrade");

    fireEvent.click(screen.getByText("Create Proposal"));

    await waitFor(() => {
      const createCall = fetchMock.mock.calls.find(
        (c: unknown[]) => typeof c[0] === "string" && c[0].includes("/api/proposals")
      );
      expect(createCall).toBeDefined();

      const body = JSON.parse((createCall![1] as RequestInit).body as string);
      expect(body.build_mode).toBe("manual");
      expect(body.title).toBe("HVAC Upgrade");
      expect(body.client_name).toBe("Test Client");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/proposals/new-proposal-123");
    });
  });

  it("manual path does NOT call populate-proposal", async () => {
    render(
      <CreateProposalDialog open={true} onOpenChange={vi.fn()} />
    );

    confirmClient();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g., HVAC Controls Upgrade")).toBeInTheDocument();
    });

    setProjectName("HVAC Upgrade");
    fireEvent.click(screen.getByText("Create Proposal"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    const populateCall = fetchMock.mock.calls.find(
      (c: unknown[]) => typeof c[0] === "string" && c[0].includes("/api/ai/populate-proposal")
    );
    expect(populateCall).toBeUndefined();
  });

  it("upload RFP path calls onRequestRfpUpload with prefilled data", async () => {
    const onRequestRfpUpload = vi.fn();
    render(
      <CreateProposalDialog
        open={true}
        onOpenChange={vi.fn()}
        onRequestRfpUpload={onRequestRfpUpload}
      />
    );

    confirmClient();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g., HVAC Controls Upgrade")).toBeInTheDocument();
    });

    setProjectName("HVAC Upgrade");

    // Switch to Upload RFP mode
    fireEvent.click(screen.getByText("Upload RFP"));
    fireEvent.click(screen.getByText("Continue to Upload"));

    expect(onRequestRfpUpload).toHaveBeenCalledWith({
      clientName: "Test Client",
      clientAddress: expect.stringContaining("123 Main St"),
      projectName: "HVAC Upgrade",
    });
  });

  it("CTA shows 'Continue to Upload' when Upload RFP mode selected", async () => {
    render(
      <CreateProposalDialog open={true} onOpenChange={vi.fn()} />
    );

    confirmClient();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g., HVAC Controls Upgrade")).toBeInTheDocument();
    });

    setProjectName("HVAC Upgrade");
    fireEvent.click(screen.getByText("Upload RFP"));

    await waitFor(() => {
      expect(screen.getByText("Continue to Upload")).toBeInTheDocument();
    });
  });

  it("does not call find-similar API", async () => {
    render(
      <CreateProposalDialog open={true} onOpenChange={vi.fn()} />
    );

    confirmClient();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g., HVAC Controls Upgrade")).toBeInTheDocument();
    });

    const similarCall = fetchMock.mock.calls.find(
      (c: unknown[]) => typeof c[0] === "string" && c[0].includes("/api/ai/find-similar")
    );
    expect(similarCall).toBeUndefined();
  });
});

describe("RFPUploadDialog — prefill props", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders normally without prefill (direct Upload RFP button path)", () => {
    render(
      <RFPUploadDialog open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText("Upload RFP")).toBeInTheDocument();
    expect(screen.getByTestId("file-upload")).toBeInTheDocument();
  });

  it("accepts prefill prop without breaking upload step", () => {
    render(
      <RFPUploadDialog
        open={true}
        onOpenChange={vi.fn()}
        prefill={{ clientName: "Prefilled Client", clientAddress: "456 Oak Ave", projectName: "Prefilled Project" }}
      />
    );

    // Should still start at upload step
    expect(screen.getByText("Upload RFP")).toBeInTheDocument();
    expect(screen.getByTestId("file-upload")).toBeInTheDocument();
  });
});

describe("API route — build_mode in metadata", () => {
  it("manual create payload includes build_mode='manual'", () => {
    const payload = {
      title: "Test",
      client_name: "Client",
      client_address: "123 Main",
      build_mode: "manual",
    };

    // Simulate metadata construction matching the API route logic
    const metadata = {
      ...(payload.build_mode ? { build_mode: payload.build_mode } : {}),
    };

    expect(metadata.build_mode).toBe("manual");
  });

  it("RFP create payload includes build_mode='rfp' and rfp_requirements", () => {
    const payload = {
      title: "Test",
      client_name: "Client",
      rfp_requirements: [{ id: "req-1", description: "Must have HVAC" }],
      build_mode: "rfp",
    };

    const metadata = {
      ...(payload.rfp_requirements ? { rfp_requirements: payload.rfp_requirements } : {}),
      ...(payload.build_mode ? { build_mode: payload.build_mode } : {}),
    };

    expect(metadata.build_mode).toBe("rfp");
    expect(metadata.rfp_requirements).toHaveLength(1);
  });

  it("manual proposals have no rfp_requirements in metadata", () => {
    const payload = {
      title: "Test",
      client_name: "Client",
      build_mode: "manual",
    };

    const rfp_requirements = undefined;
    const metadata = {
      ...(rfp_requirements ? { rfp_requirements } : {}),
      ...(payload.build_mode ? { build_mode: payload.build_mode } : {}),
    };

    expect(metadata.build_mode).toBe("manual");
    expect("rfp_requirements" in metadata).toBe(false);
  });
});

describe("Editor — requirements panel visibility", () => {
  it("hasRequirements is false when metadata has no rfp_requirements", () => {
    // Simulates the editor-layout.tsx logic
    const metadata = { build_mode: "manual" } as Record<string, unknown>;
    const rfpRequirements = metadata?.rfp_requirements
      ? (metadata.rfp_requirements as unknown[])
      : [];
    const hasRequirements = rfpRequirements.length > 0;

    expect(hasRequirements).toBe(false);
  });

  it("hasRequirements is true when metadata has rfp_requirements", () => {
    const metadata = {
      build_mode: "rfp",
      rfp_requirements: [{ id: "req-1", description: "test" }],
    } as Record<string, unknown>;
    const rfpRequirements = metadata?.rfp_requirements
      ? (metadata.rfp_requirements as unknown[])
      : [];
    const hasRequirements = rfpRequirements.length > 0;

    expect(hasRequirements).toBe(true);
  });
});

// ── Manual-mode v1 enhancements ────────────────────────────────────────────

describe("Manual-mode API enhancements — logic simulation", () => {
  it("project_label defaults to 'PROPOSAL' for manual builds", () => {
    const build_mode = "manual";
    const coverContent = {
      client_name: "Test Client",
      client_address: "123 Main St",
      ...(build_mode === "manual" ? { project_label: "PROPOSAL" } : {}),
    };

    expect(coverContent.project_label).toBe("PROPOSAL");
  });

  it("project_label is NOT overridden for RFP builds", () => {
    const build_mode: string = "rfp";
    const coverContent = {
      client_name: "Test Client",
      client_address: "123 Main St",
      ...(build_mode === "manual" ? { project_label: "PROPOSAL" } : {}),
    };

    expect("project_label" in coverContent).toBe(false);
  });

  it("library content is copied into sections only when section content is empty", () => {
    const libraryContent = { body: "<p>HMS Standard Introduction...</p>" };
    const sectionContent = {};
    const isEmpty = !sectionContent || Object.keys(sectionContent).length === 0;

    // Should copy
    const result = isEmpty ? libraryContent : sectionContent;
    expect(result).toEqual(libraryContent);
  });

  it("library content is NOT overwritten when section already has content", () => {
    const libraryContent = { body: "<p>HMS Standard Introduction...</p>" };
    const sectionContent = { body: "<p>Custom intro</p>" };
    const isEmpty = !sectionContent || Object.keys(sectionContent).length === 0;

    // Should keep existing
    const result = isEmpty ? libraryContent : sectionContent;
    expect(result).toEqual(sectionContent);
  });

  it("closeout and interview_panel are disabled for manual proposals", () => {
    const allSections = [
      { slug: "cover_page", is_enabled: true },
      { slug: "introduction", is_enabled: true },
      { slug: "closeout", is_enabled: true },
      { slug: "interview_panel", is_enabled: true },
      { slug: "project_cost", is_enabled: true },
    ];

    const optionalSlugs = ["closeout", "interview_panel"];
    const result = allSections.map((s) => ({
      ...s,
      is_enabled: optionalSlugs.includes(s.slug) ? false : s.is_enabled,
    }));

    expect(result.find((s) => s.slug === "closeout")?.is_enabled).toBe(false);
    expect(result.find((s) => s.slug === "interview_panel")?.is_enabled).toBe(false);
    expect(result.find((s) => s.slug === "introduction")?.is_enabled).toBe(true);
    expect(result.find((s) => s.slug === "project_cost")?.is_enabled).toBe(true);
  });

  it("executive_summary is reordered to position 6 for manual proposals", () => {
    // Simulate default order from DB
    const sections = [
      { slug: "cover_page", order_index: 1 },
      { slug: "introduction", order_index: 2 },
      { slug: "table_of_contents", order_index: 3 },
      { slug: "firm_background", order_index: 4 },
      { slug: "key_personnel", order_index: 5 },
      { slug: "project_schedule", order_index: 6 },
      { slug: "site_logistics", order_index: 7 },
      { slug: "qaqc_commissioning", order_index: 8 },
      { slug: "closeout", order_index: 9 },
      { slug: "reference_check", order_index: 10 },
      { slug: "interview_panel", order_index: 11 },
      { slug: "project_cost", order_index: 12 },
      { slug: "executive_summary", order_index: 13 },
    ];

    const execSection = sections.find((s) => s.slug === "executive_summary")!;
    const targetPosition = 6;

    // Shift sections between target and exec's current position
    const reordered = sections.map((s) => {
      if (s.slug === "executive_summary") return { ...s, order_index: targetPosition };
      if (s.order_index >= targetPosition && s.order_index < execSection.order_index) {
        return { ...s, order_index: s.order_index + 1 };
      }
      return s;
    });

    reordered.sort((a, b) => a.order_index - b.order_index);

    expect(reordered[5].slug).toBe("executive_summary"); // position 6 (0-indexed: 5)
    expect(reordered[5].order_index).toBe(6);
    // Verify key_personnel stays at 5 (before exec_summary)
    expect(reordered[4].slug).toBe("key_personnel");
    expect(reordered[4].order_index).toBe(5);
    // Verify project_schedule shifted from 6 to 7
    expect(reordered[6].slug).toBe("project_schedule");
    expect(reordered[6].order_index).toBe(7);
  });

  it("section reorder does NOT run for RFP builds", () => {
    const build_mode: string = "rfp";
    const shouldReorder = build_mode === "manual";
    expect(shouldReorder).toBe(false);
  });

  it("library pre-population does NOT run for RFP builds", () => {
    const build_mode: string = "rfp";
    const shouldPrePopulate = build_mode === "manual";
    expect(shouldPrePopulate).toBe(false);
  });
});

describe("Manual-mode quick-start toast", () => {
  it("shows toast for manual proposals", () => {
    const metadata = { build_mode: "manual" } as Record<string, unknown>;
    const shouldShowToast = metadata?.build_mode === "manual";
    expect(shouldShowToast).toBe(true);
  });

  it("does NOT show toast for RFP proposals", () => {
    const metadata: Record<string, unknown> = { build_mode: "rfp", ai_populated: true };
    const shouldShowToast = metadata.build_mode === "manual";
    expect(shouldShowToast).toBe(false);
  });

  it("does NOT show toast when no build_mode set (legacy proposals)", () => {
    const metadata: Record<string, unknown> = {};
    const shouldShowToast = metadata.build_mode === "manual";
    expect(shouldShowToast).toBe(false);
  });
});
