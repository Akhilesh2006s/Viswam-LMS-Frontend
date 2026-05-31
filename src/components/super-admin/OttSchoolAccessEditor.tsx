import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EyeOff, Eye, Plus, Trash2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type OttRestrictionsPayload,
  type OttRestrictionRule,
  newRuleId,
  isVideoHidden,
  isClassHidden,
  toggleInList,
  groupVideosByClass,
  type VideoForAccess,
} from "@/lib/ott-restrictions";

type Props = {
  restrictions: OttRestrictionsPayload;
  videos: VideoForAccess[];
  onChange: (next: OttRestrictionsPayload) => void;
};

export function OttSchoolAccessEditor({ restrictions, videos, onChange }: Props) {
  const ca = restrictions.contentAccess || {};
  const rules = restrictions.rules || [];

  const sections = useMemo(() => groupVideosByClass(videos), [videos]);

  const patchContentAccess = (patch: Partial<typeof ca>) => {
    onChange({
      ...restrictions,
      contentAccess: { ...ca, mode: ca.mode || "blocklist", ...patch },
    });
  };

  const patchRules = (nextRules: OttRestrictionRule[]) => {
    onChange({ ...restrictions, rules: nextRules });
  };

  const toggleVideo = (videoId: string, hide: boolean) => {
    patchContentAccess({
      hiddenVideos: toggleInList(ca.hiddenVideos || [], videoId, hide),
    });
  };

  const toggleClass = (classKey: string, hide: boolean) => {
    const list = toggleInList(ca.hiddenClasses || [], classKey, hide);
    const section = sections.find((s) => s.classKey === classKey);
    let hiddenVideos = [...(ca.hiddenVideos || [])];
    if (section) {
      for (const v of section.videos) {
        hiddenVideos = toggleInList(hiddenVideos, v._id, hide);
      }
    }
    if (!hide && section) {
      hiddenVideos = hiddenVideos.filter(
        (id) => !section.videos.some((v) => String(v._id) === String(id)),
      );
    }
    patchContentAccess({ hiddenClasses: list, hiddenVideos });
  };

  const addRule = () => {
    patchRules([
      ...rules,
      {
        id: newRuleId(),
        name: `Restriction ${rules.length + 1}`,
        enabled: true,
        hiddenVideoIds: [],
        hiddenClassNumbers: [],
        hiddenSubjectIds: [],
      },
    ]);
  };

  const updateRule = (id: string, patch: Partial<OttRestrictionRule>) => {
    patchRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRule = (id: string) => {
    patchRules(rules.filter((r) => r.id !== id));
  };

  const toggleRuleVideo = (ruleId: string, videoId: string, hide: boolean) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, {
      hiddenVideoIds: toggleInList(rule.hiddenVideoIds || [], videoId, hide),
    });
  };

  const hiddenCount =
    (ca.hiddenVideos?.length || 0) +
    rules.filter((r) => r.enabled).reduce((n, r) => n + (r.hiddenVideoIds?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-900">Hide content from this school</p>
        <p className="text-xs text-emerald-800/80 mt-1">
          Tap <strong>Hide</strong> on a class section or individual video. Students at this school will not
          see hidden items. Add multiple named rules for different policies.
        </p>
        <p className="text-xs text-slate-600 mt-2">
          {hiddenCount} hidden video slot(s) across global + active rules
        </p>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">Upload OTT videos first to configure hiding.</p>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const classHidden = isClassHidden(section.classKey, ca, rules);
            const visibleCount = section.videos.filter(
              (v) => !isVideoHidden(v._id, ca, rules) && !classHidden,
            ).length;
            return (
              <div
                key={section.classKey}
                className="rounded-xl border border-slate-200/80 bg-white/90 overflow-hidden shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50/80 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-700" />
                    <span className="font-semibold text-slate-900">{section.label}</span>
                    <Badge variant="outline" className="text-emerald-800 border-emerald-200">
                      {visibleCount}/{section.videos.length} visible
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={classHidden ? "default" : "outline"}
                    className={cn(
                      classHidden
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "border-emerald-300 text-emerald-800 hover:bg-emerald-100",
                    )}
                    onClick={() => toggleClass(section.classKey, !classHidden)}
                  >
                    {classHidden ? (
                      <>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Unhide class
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide entire class
                      </>
                    )}
                  </Button>
                </div>
                <ul className="divide-y divide-slate-100">
                  {section.videos.map((v) => {
                    const hidden =
                      classHidden || isVideoHidden(v._id, ca, rules);
                    return (
                      <li
                        key={v._id}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-2.5",
                          hidden && "bg-rose-50/50",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm font-medium truncate", hidden ? "text-rose-800 line-through" : "text-slate-800")}>
                            {v.title}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={hidden ? "default" : "outline"}
                          className={cn(
                            "shrink-0 h-8",
                            hidden
                              ? "bg-rose-600 hover:bg-rose-700"
                              : "border-slate-200",
                          )}
                          onClick={() => toggleVideo(v._id, !hidden)}
                          disabled={classHidden}
                        >
                          {hidden ? "Hidden" : "Visible"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-800">Additional restriction rules</Label>
          <Button type="button" size="sm" variant="outline" className="border-emerald-300" onClick={addRule}>
            <Plus className="h-4 w-4 mr-1" />
            Add rule
          </Button>
        </div>
        {rules.length === 0 ? (
          <p className="text-xs text-slate-500">Optional: stack extra hide lists (e.g. exam week, pilot class).</p>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={rule.name}
                  onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                  className="max-w-[200px] h-9"
                  placeholder="Rule name"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(c) => updateRule(rule.id, { enabled: c })}
                  />
                  <span className="text-xs text-slate-600">{rule.enabled ? "Active" : "Off"}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-600"
                  onClick={() => removeRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">Hide specific videos under this rule only:</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {videos.slice(0, 40).map((v) => {
                  const hid = (rule.hiddenVideoIds || []).map(String).includes(String(v._id));
                  return (
                    <button
                      key={`${rule.id}-${v._id}`}
                      type="button"
                      onClick={() => toggleRuleVideo(rule.id, v._id, !hid)}
                      className={cn(
                        "text-[11px] px-2 py-1 rounded-full border transition-colors",
                        hid
                          ? "bg-rose-100 border-rose-300 text-rose-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300",
                      )}
                    >
                      {hid ? "✕ " : ""}
                      {v.title.slice(0, 28)}
                      {v.title.length > 28 ? "…" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
