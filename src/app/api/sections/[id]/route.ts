import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasContentChanged, generateChangeSummary } from "@/lib/utils/diff";

const SECTION_CONTENT_FIELDS: Record<string, string[]> = {
  introduction: ["body"],
  firm_background: ["narrative"],
  site_logistics: ["body"],
  qaqc_commissioning: ["quality_assurance", "quality_control", "commissioning"],
  closeout: ["body"],
  executive_summary: ["body"],
};

const COALESCE_WINDOW_MS = 30_000; // 30 seconds

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Extract change tracking metadata before saving
  const changeType = body._changeType || "human";
  const { _changeType, ...updates } = body;

  // If content is being updated, record changes
  if (updates.content) {
    try {
      // Fetch current section with its slug and proposal_id
      const { data: section } = await supabase
        .from("proposal_sections")
        .select("content, proposal_id, section_type_id, section_types!inner(slug)")
        .eq("id", id)
        .single();

      if (section) {
        const slug = (section as unknown as { section_types: { slug: string } }).section_types.slug;
        const fields = SECTION_CONTENT_FIELDS[slug];
        if (fields) {
          const oldContent = (section.content || {}) as Record<string, unknown>;
          const newContent = updates.content as Record<string, unknown>;
          const changedFields = hasContentChanged(oldContent, newContent, fields);

          for (const field of changedFields) {
            const oldVal = (oldContent[field] as string) || "";
            const newVal = (newContent[field] as string) || "";
            const summary = generateChangeSummary(oldVal, newVal);

            // Check for coalescing: same author, same field, within 30 seconds
            const coalesceThreshold = new Date(Date.now() - COALESCE_WINDOW_MS).toISOString();
            const { data: recentChange } = await supabase
              .from("proposal_changes")
              .select("id")
              .eq("section_id", id)
              .eq("field", field)
              .eq("author_id", user.id)
              .gte("created_at", coalesceThreshold)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            if (recentChange) {
              // Coalesce: update the existing change record's new_value
              await supabase
                .from("proposal_changes")
                .update({ new_value: newVal, summary })
                .eq("id", recentChange.id);
            } else {
              // Insert new change record
              await supabase.from("proposal_changes").insert({
                proposal_id: section.proposal_id,
                section_id: id,
                author_id: changeType === "ai" ? null : user.id,
                field,
                old_value: oldVal,
                new_value: newVal,
                change_type: changeType,
                summary,
              });
            }
          }
        }
      }
    } catch (err) {
      // Don't fail the save if change tracking fails
      console.error("Change tracking error:", err);
    }
  }

  const { error } = await supabase
    .from("proposal_sections")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete related change records first
  await supabase
    .from("proposal_changes")
    .delete()
    .eq("section_id", id);

  // Delete the section
  const { error } = await supabase
    .from("proposal_sections")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
