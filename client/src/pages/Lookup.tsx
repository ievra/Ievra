import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { usePageMeta, CANONICAL_BASE_URL } from "@/hooks/use-page-meta";
import { createPortal } from "react-dom";
import { Search, ArrowRight, Clock, ChevronLeft, ChevronRight, X, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface LookupPhase {
  id: string;
  value: string;
  labelVi: string;
  labelEn: string;
}

interface LookupInteraction {
  id: string;
  type: string;
  title: string;
  description: string | null;
  date: string;
  outcome: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  phase: string | null;
  attachments: string[] | null;
  assignedTo: string | null;
  category: string | null;
}

interface LookupTransaction {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  type: string;
  status: string;
  paymentDate: string;
  category: string | null;
}

interface LookupWarrantyLog {
  id: string;
  title: string;
  description: string | null;
  date: string;
  assignedTo: string | null;
  status: string | null;
  attachments: string[] | null;
}

interface LookupCrmLabel {
  value: string;
  labelVi: string;
  labelEn: string;
  color: string | null;
}

interface LookupResult {
  client: {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    company: string | null;
    address: string | null;
    stage: string;
    tier: string;
    status: string;
    intakeDate: string | null;
    warrantyStatus: string | null;
    warrantyExpiry: string | null;
    designTimeline: number | null;
    constructionTimeline: number | null;
    designPhaseTargets: Record<string, number> | null;
    constructionPhaseTargets: Record<string, number> | null;
    hiddenDesignPhases: string[] | null;
    hiddenConstructionPhases: string[] | null;
  };
  interactions: LookupInteraction[];
  transactions: LookupTransaction[];
  warrantyLogs: LookupWarrantyLog[];
  designPhases: LookupPhase[];
  constructionPhases: LookupPhase[];
  crmStages: LookupCrmLabel[];
  crmTiers: LookupCrmLabel[];
  crmStatuses: LookupCrmLabel[];
}

export default function Lookup() {
  const { language } = useLanguage();
  const [location] = useLocation();
  usePageMeta({
    canonical: `${CANONICAL_BASE_URL}${location}`,
    hreflang: [
      { lang: "vi", href: `${CANONICAL_BASE_URL}/tra-cuu` },
      { lang: "en", href: `${CANONICAL_BASE_URL}/lookup` },
      { lang: "x-default", href: `${CANONICAL_BASE_URL}/tra-cuu` },
    ],
  });
  const isVi = language === "vi";
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "construction" | "warranty">("design");
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [viewingLog, setViewingLog] = useState<LookupWarrantyLog | null>(null);
  const [viewingInteraction, setViewingInteraction] = useState<LookupInteraction | null>(null);
  const [infoRevealed, setInfoRevealed] = useState(false);
  const [showCccdDialog, setShowCccdDialog] = useState(false);
  const [cccdInput, setCccdInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [tablePhaseFilter, setTablePhaseFilter] = useState("");
  const [designShowAll, setDesignShowAll] = useState(false);
  const [constructionShowAll, setConstructionShowAll] = useState(false);
  const { toast } = useToast();

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    document.body.style.overflow = "hidden";
  };
  const closeLightbox = () => {
    setLightboxImages([]);
    document.body.style.overflow = "";
  };

  useEffect(() => {
    if (lightboxImages.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
    };
    const preventScroll = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", handleKey);
    document.addEventListener("wheel", preventScroll, { passive: false });
    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("wheel", preventScroll);
      document.removeEventListener("touchmove", preventScroll);
      document.body.style.overflow = "";
    };
  }, [lightboxImages]);

  const placeholderText = isVi ? "Nhập số điện thoại của bạn..." : "Enter your phone number...";

  useEffect(() => {
    const text = placeholderText;
    let index = 0;
    setTypedPlaceholder('');
    const interval = setInterval(() => {
      if (index <= text.length) {
        setTypedPlaceholder(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [language]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 6) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);
    setInfoRevealed(false);
    setSupportSent(false);
    setSupportMessage("");
    try {
      const res = await fetch(`/api/lookup?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || (isVi ? "Không tìm thấy" : "Not found"));
      } else {
        setResult(data);
      }
    } catch {
      setError(isVi ? "Đã xảy ra lỗi. Vui lòng thử lại." : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCccd = async () => {
    if (!cccdInput.trim() || !phone.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/lookup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), identityCard: cccdInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setInfoRevealed(true);
        setShowCccdDialog(false);
        toast({ title: isVi ? "Xác minh thành công" : "Verification successful" });
      } else {
        const msg = res.status === 403
          ? (isVi ? "CCCD/CMND không khớp" : "ID card number does not match")
          : res.status === 400
          ? (isVi ? "Chưa có thông tin CCCD/CMND trong hệ thống" : "No ID card information in the system")
          : (isVi ? "Xác minh thất bại" : "Verification failed");
        toast({ title: msg, variant: "destructive" });
      }
    } catch {
      toast({ title: isVi ? "Đã xảy ra lỗi" : "An error occurred", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !supportMessage.trim()) return;
    setSubmittingSupport(true);
    try {
      const nameParts = `${result.client.lastName} ${result.client.firstName}`.trim().split(" ");
      const firstName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[0] : "";
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: result.client.email || "",
          phone: result.client.phone || phone.trim(),
          projectType: isVi ? "Yêu cầu hỗ trợ" : "Support Request",
          message: supportMessage.trim(),
        }),
      });
      if (res.ok) {
        setSupportMessage("");
        toast({ title: isVi ? "Đã gửi yêu cầu hỗ trợ" : "Support request sent" });
      } else {
        toast({ title: isVi ? "Gửi thất bại. Vui lòng thử lại." : "Failed to send. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: isVi ? "Đã xảy ra lỗi" : "An error occurred", variant: "destructive" });
    } finally {
      setSubmittingSupport(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isVi ? "vi-VN" : "en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  const designInteractions = result ? result.interactions.filter(i => i.type === "design") : [];
  const constructionInteractions = result ? result.interactions.filter(i => i.type !== "design") : [];
  const designPhases = result?.designPhases || [];
  const constructionPhases = result?.constructionPhases || [];
  const transactions = result?.transactions || [];

  const renderCircle = (
    item: { label: string; progress: number; type: string },
    phases: LookupPhase[],
    phaseTargets: Record<string, number>,
    circleInteractions: LookupInteraction[],
    hasTimeline = false
  ) => {
    const vb = 120;
    const sw = 6;
    const r = (vb - sw) / 2;
    const circ = 2 * Math.PI * r;
    const filled = (item.progress / 100) * circ;
    const gap = circ - filled;
    const paymentTx = item.type === "design_payment"
      ? transactions.filter(t => !t.category || t.category === "design")
      : item.type === "construction_payment"
      ? transactions.filter(t => t.category === "construction")
      : [];

    /* ── Payment: flat KPI-card style (no SVG circle) ── */
    if (item.type === "design_payment" || item.type === "construction_payment") {
      return (
        <div className="flex flex-col h-full">
          <div>
            <p className="text-5xl font-thin text-white tabular-nums leading-none">
              {item.progress}<span className="text-xl font-light">%</span>
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-white/55 mt-5">{item.label}</p>
            <div className="mt-4 w-full h-[2px] bg-white/10 rounded-full">
              <div className="h-full bg-white/55 rounded-full transition-all duration-700 ease-out" style={{ width: `${item.progress}%` }} />
            </div>
          </div>
          {paymentTx.length > 0 && (
            <div className="mt-6 space-y-3">
              {[...paymentTx].reverse().map((tx, idx) => (
                <div key={tx.id || idx} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-light text-white/55 truncate leading-relaxed">
                    {tx.title || tx.description || `${isVi ? "Đợt" : "Stage"} ${idx + 1}`}
                  </span>
                  <span className={`text-sm font-light shrink-0 ${tx.status === "completed" ? "text-white/75" : "text-white/25"}`}>
                    {tx.status === "completed" ? "✓" : "○"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        {/* Circle */}
        <div className="relative w-full aspect-square max-w-[200px]">
          <svg viewBox={`0 0 ${vb} ${vb}`} className="w-full h-full -rotate-90">
            <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
            <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw + 8} />
            {item.progress > 0 && (
              <circle
                cx={60} cy={60} r={r} fill="none"
                stroke="rgba(255,255,255,0.85)" strokeWidth={sw}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${gap}`}
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-thin text-white tabular-nums leading-none">{item.progress}</span>
            <span className="text-sm font-light text-white/50 mt-0.5">%</span>
          </div>
        </div>
        <p className="text-xs font-light text-white/45 mt-4 tracking-[0.14em] text-center uppercase">{item.label}</p>
        {/* Phase breakdown bars */}
        {phases.length > 0 && (
          <div className="w-full mt-6 space-y-4">
            {phases.map((phase) => {
              const target = phaseTargets[phase.value] || 0;
              const logged = circleInteractions.filter(i => i.phase === phase.value).length;
              const p = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : (hasTimeline ? 0 : 100);
              return (
                <div key={phase.id}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm font-light text-white/45 truncate max-w-[68%]">{isVi ? phase.labelVi : phase.labelEn}</span>
                    <span className="text-sm font-light text-white/45 tabular-nums">{p}%</span>
                  </div>
                  <div className="w-full h-[2px] bg-white/10 rounded-full">
                    <div className="h-full bg-white/60 rounded-full transition-all duration-700 ease-out" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderInteractionTable = (
    interactions: LookupInteraction[],
    phases: LookupPhase[],
    search: string,
    phaseFilter: string,
    showAll: boolean,
    onToggleShowAll: () => void
  ) => {
    const PAGE_SIZE = 10;

    // Build flat numbered list (phase-ordered)
    type FlatRow = { interaction: LookupInteraction; num: number; phaseLabel: string; phaseValue: string };
    const allRows: FlatRow[] = [];
    let num = 0;
    for (const phase of phases) {
      const pRows = interactions.filter(i => i.phase === phase.value).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      for (const interaction of pRows) allRows.push({ interaction, num: ++num, phaseLabel: isVi ? phase.labelVi : phase.labelEn, phaseValue: phase.value });
    }
    const orphaned = interactions.filter(i => !i.phase || !phases.some(p => p.value === i.phase)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const interaction of orphaned) allRows.push({ interaction, num: ++num, phaseLabel: isVi ? "Khác" : "Other", phaseValue: "__other__" });

    // Apply filters
    const q = search.trim().toLowerCase();
    const filtered = allRows.filter(r => {
      const matchSearch = !q || r.interaction.title.toLowerCase().includes(q) || (r.interaction.description || "").toLowerCase().includes(q);
      const matchPhase = !phaseFilter || r.phaseValue === phaseFilter;
      return matchSearch && matchPhase;
    });

    const total = filtered.length;
    const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);

    // Group visible rows by phase (preserving order)
    const grouped: Array<{ phaseLabel: string; phaseValue: string; rows: FlatRow[] }> = [];
    for (const row of visible) {
      const last = grouped[grouped.length - 1];
      if (last && last.phaseValue === row.phaseValue) last.rows.push(row);
      else grouped.push({ phaseLabel: row.phaseLabel, phaseValue: row.phaseValue, rows: [row] });
    }

    const showPhaseHeaders = phases.length > 0;

    return (
      <div className="space-y-0">
        {visible.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm font-light text-white/30">{isVi ? "Không tìm thấy kết quả" : "No results found"}</p>
          </div>
        )}
        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-white/8">
          {grouped.map((group, gi) => (
            <div key={group.phaseValue + gi}>
              {showPhaseHeaders && (
                <div className="py-2.5 px-2">
                  <span className="text-xs font-light text-white/40 uppercase tracking-[0.14em]">{group.phaseLabel}</span>
                </div>
              )}
              {group.rows.map((row) => (
                <div key={row.interaction.id} className="flex items-start gap-3 px-2 py-3 border-t border-white/8">
                  <span className="text-xs font-light text-white/30 tabular-nums w-6 shrink-0 pt-0.5">{row.num}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-white/80 leading-snug">{row.interaction.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs font-light text-white/40 tabular-nums">{formatDate(row.interaction.date)}</span>
                      {row.interaction.assignedTo && <span className="text-xs font-light text-white/35">{row.interaction.assignedTo}</span>}
                    </div>
                    {Array.isArray(row.interaction.attachments) && row.interaction.attachments.length > 0 && (
                      <div className="flex gap-1 mt-2 cursor-pointer" onClick={() => openLightbox(row.interaction.attachments as string[], 0)}>
                        {(row.interaction.attachments as string[]).slice(0, 3).map((url, idx) => (
                          <img key={idx} src={url} alt="" className="w-10 h-10 object-cover border border-white/10" />
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setViewingInteraction(row.interaction)} className="h-7 w-7 text-white/35 hover:text-white shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* Desktop table view */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-[40px_120px_1fr_100px_160px_50px] gap-2 px-4 py-2 border-b border-white/10">
            <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "STT" : "No"}</span>
            <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "Ngày" : "Date"}</span>
            <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "Tiêu đề" : "Title"}</span>
            <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "Phụ trách" : "Assigned"}</span>
            <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "Hình ảnh" : "Images"}</span>
            <span></span>
          </div>
          {grouped.map((group, gi) => (
            <div key={group.phaseValue + gi}>
              {showPhaseHeaders && (
                <>
                  {gi > 0 && <div className="border-t border-white/15" />}
                  <div className="py-3 px-2">
                    <span className="text-xs font-light text-white/40 uppercase tracking-[0.14em]">{group.phaseLabel}</span>
                  </div>
                </>
              )}
              {group.rows.map((row) => (
                <div key={row.interaction.id} className="grid grid-cols-[40px_120px_1fr_100px_160px_50px] gap-2 px-4 py-2 border-b border-white/10 items-center">
                  <span className="text-sm font-light text-white/35 tabular-nums">{row.num}</span>
                  <span className="text-sm font-light text-white/50">{formatDate(row.interaction.date)}</span>
                  <span className="text-sm font-light text-white/80">{row.interaction.title}</span>
                  <span className="text-sm font-light text-white/45">{row.interaction.assignedTo || "—"}</span>
                  <span>
                    {Array.isArray(row.interaction.attachments) && row.interaction.attachments.length > 0 ? (
                      <div className="flex gap-1 cursor-pointer" onClick={() => openLightbox(row.interaction.attachments as string[], 0)}>
                        {(row.interaction.attachments as string[]).slice(0, 3).map((url, idx) => (
                          <img key={idx} src={url} alt="" className="w-10 h-10 object-cover border border-white/10 hover:border-white/40 transition-colors" />
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </span>
                  <span>
                    <Button variant="ghost" size="icon" onClick={() => setViewingInteraction(row.interaction)} className="h-8 w-8 text-white/40 hover:text-white">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
            <span className="text-xs text-white/35 tabular-nums">{showAll ? total : Math.min(PAGE_SIZE, total)} / {total} {isVi ? "mục" : "items"}</span>
            <button onClick={onToggleShowAll} className="text-xs font-light text-white/55 hover:text-white transition-colors">
              {showAll ? (isVi ? "↑ Thu gọn" : "↑ Collapse") : (isVi ? `Xem thêm ${total - PAGE_SIZE} mục →` : `Show ${total - PAGE_SIZE} more →`)}
            </button>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-black pt-32 pb-20">
      <div className="px-4 sm:px-6 lg:px-8 mb-12">
        {/* Editorial header */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-[11px] uppercase tracking-widest font-light text-white/30">
              <Link href={language === 'vi' ? '/' : '/en'} className="hover:text-white/60 transition-colors duration-200">
                {isVi ? 'Trang Chủ' : 'Home'}
              </Link>
              <span>›</span>
              <span className="text-white/50">{isVi ? 'Tra Cứu' : 'Lookup'}</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-sans font-light tracking-tight leading-none">
              {isVi ? 'TRA CỨU' : 'LOOKUP'}
            </h1>
          </div>
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex-shrink-0 sm:pb-1 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <Input
                ref={inputRef}
                type="tel"
                placeholder={typedPlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent text-white placeholder-white/30 px-0 py-0 text-sm font-light rounded-none focus-visible:ring-0 border-0 flex-1 sm:w-72"
              />
              <button
                type="submit"
                disabled={loading || phone.trim().length < 6}
                className="text-white/40 hover:text-white transition-colors disabled:opacity-30"
              >
                {loading ? (
                  <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
        <p className="text-sm text-white/40 font-light leading-relaxed mt-5 max-w-lg">
          {isVi
            ? 'Nhập số điện thoại để tra cứu tiến độ dự án, nhật ký công trình và thông tin bảo hành.'
            : 'Enter your phone number to check project progress, construction log and warranty information.'}
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">

        {error && searched && (
          <div className="max-w-3xl mx-auto">
            <div className="border border-white/10 p-8 text-center">
              <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 font-light">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-500">
            {/* Client info card */}
            {(() => {
              const stageLabel = result.crmStages.find(s => s.value === result.client.stage);
              const tierLabel = result.crmTiers.find(t => t.value === result.client.tier);
              const statusLabel = result.crmStatuses.find(s => s.value === result.client.status);
              const warrantyMap: Record<string, { vi: string; en: string }> = {
                active: { vi: "Còn bảo hành", en: "Active" },
                expired: { vi: "Hết bảo hành", en: "Expired" },
                none: { vi: "Không áp dụng", en: "Not applicable" },
              };
              const warrantyLabel = warrantyMap[result.client.warrantyStatus || "none"] || warrantyMap["none"];
              return (
                <div className="border border-white/10 bg-black">
                  {/* Header row: name + verify button */}
                  <div className="px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] font-light text-white/35 mb-3">
                        {isVi ? "Khách hàng" : "Client"}
                      </p>
                      <h3 className="text-3xl font-light text-white leading-tight">
                        {infoRevealed
                          ? `${result.client.lastName} ${result.client.firstName}`
                          : (() => {
                              const nameParts = `${result.client.lastName || ""} ${result.client.firstName || ""}`.trim().split(" ");
                              return nameParts.map((p, i) => i === 0 ? p : "*".repeat(p.length)).join(" ");
                            })()}
                      </h3>
                      {/* Status badges row */}
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {stageLabel && (
                          <span className="text-xs uppercase tracking-[0.14em] font-light px-2.5 py-1 border border-white/15 text-white/55">
                            {isVi ? stageLabel.labelVi : stageLabel.labelEn}
                          </span>
                        )}
                        {tierLabel && (
                          <span className="text-xs uppercase tracking-[0.14em] font-light px-2.5 py-1 border border-white/15 text-white/55">
                            {isVi ? tierLabel.labelVi : tierLabel.labelEn}
                          </span>
                        )}
                        {statusLabel && (
                          <span className="text-xs uppercase tracking-[0.14em] font-light px-2.5 py-1 border border-white/15 text-white/55">
                            {isVi ? statusLabel.labelVi : statusLabel.labelEn}
                          </span>
                        )}
                        {result.client.warrantyStatus && result.client.warrantyStatus !== "none" && (
                          <span className={`text-xs uppercase tracking-[0.14em] font-light px-2.5 py-1 border ${result.client.warrantyStatus === "active" ? "border-white/25 text-white/75" : "border-white/10 text-white/30"}`}>
                            {isVi ? warrantyLabel.vi : warrantyLabel.en}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (infoRevealed) {
                          setInfoRevealed(false);
                        } else {
                          setShowCccdDialog(true);
                          setCccdInput("");
                        }
                      }}
                      className="flex items-center gap-2 text-xs font-light text-white/40 hover:text-white/80 transition-colors border border-white/15 hover:border-white/35 px-4 py-2 shrink-0 mt-7"
                    >
                      {infoRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{infoRevealed ? (isVi ? "Ẩn" : "Hide") : (isVi ? "Xác minh" : "Verify")}</span>
                    </button>
                  </div>

                  {/* Contact details grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/8">
                    {[
                      { label: isVi ? "Điện thoại" : "Phone", value: result.client.phone, hidden: result.client.phone ? result.client.phone.slice(0, 3) + "*".repeat(Math.max(0, result.client.phone.length - 3)) : null },
                      { label: "Email", value: result.client.email, hidden: result.client.email ? (() => { const i = result.client.email!.indexOf("@"); const local = result.client.email!.slice(0, i); return local.slice(0, 3) + "*".repeat(Math.max(0, local.length - 3)) + result.client.email!.slice(i); })() : null },
                      { label: isVi ? "Công ty" : "Company", value: result.client.company, hidden: result.client.company ? "*".repeat(Math.min(16, result.client.company.length)) : null },
                      { label: isVi ? "Địa chỉ" : "Address", value: result.client.address, hidden: result.client.address ? "*".repeat(Math.min(16, result.client.address.length)) : null },
                    ].map(({ label, value, hidden }, i) => value ? (
                      <div key={i} className="bg-black px-4 py-4 sm:px-6 sm:py-5">
                        <p className="text-xs uppercase tracking-[0.14em] font-light text-white/30 mb-2">{label}</p>
                        <p className="text-sm font-light text-white/75 truncate">{infoRevealed ? value : hidden}</p>
                      </div>
                    ) : null)}
                  </div>

                  {/* Extra info row: intake date + warranty expiry */}
                  {(result.client.intakeDate || result.client.warrantyExpiry) && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/8 border-t border-white/8">
                      {result.client.intakeDate && (
                        <div className="bg-black px-6 py-5">
                          <p className="text-xs uppercase tracking-[0.14em] font-light text-white/30 mb-2">{isVi ? "Ngày tiếp nhận" : "Intake Date"}</p>
                          <p className="text-sm font-light text-white/75">{formatDate(result.client.intakeDate)}</p>
                        </div>
                      )}
                      {result.client.warrantyExpiry && (
                        <div className="bg-black px-6 py-5">
                          <p className="text-xs uppercase tracking-[0.14em] font-light text-white/30 mb-2">{isVi ? "Hết hạn bảo hành" : "Warranty Expiry"}</p>
                          <p className={`text-sm font-light ${result.client.warrantyStatus === "expired" ? "text-white/35" : "text-white/75"}`}>{formatDate(result.client.warrantyExpiry)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── KPI Summary Row ── */}
            {(() => {
              const dPt = (result.client.designPhaseTargets || {}) as Record<string, number>;
              const cPt = (result.client.constructionPhaseTargets || {}) as Record<string, number>;
              const dProgress = result.client.designTimeline
                ? Math.min(100, Math.round((designInteractions.length / result.client.designTimeline) * 100))
                : designPhases.length > 0
                  ? Math.round(designPhases.reduce((acc, ph) => { const t = dPt[ph.value] || 0; const l = designInteractions.filter(i => i.phase === ph.value).length; return acc + (t > 0 ? Math.min(100, Math.round((l / t) * 100)) : 100); }, 0) / designPhases.length)
                  : 100;
              const cProgress = result.client.constructionTimeline
                ? Math.min(100, Math.round((constructionInteractions.length / result.client.constructionTimeline) * 100))
                : constructionPhases.length > 0
                  ? Math.round(constructionPhases.reduce((acc, ph) => { const t = cPt[ph.value] || 0; const l = constructionInteractions.filter(i => i.phase === ph.value).length; return acc + (t > 0 ? Math.min(100, Math.round((l / t) * 100)) : 100); }, 0) / constructionPhases.length)
                  : 100;
              const dTx = transactions.filter(t => !t.category || t.category === "design");
              const cTx = transactions.filter(t => t.category === "construction");
              const dPayPct = dTx.length > 0 ? Math.round((dTx.filter(t => t.status === "completed").length / dTx.length) * 100) : 0;
              const cPayPct = cTx.length > 0 ? Math.round((cTx.filter(t => t.status === "completed").length / cTx.length) * 100) : 0;
              const kpis = [
                { label: isVi ? "Tiến độ Thiết kế" : "Design Progress", pct: dProgress },
                { label: isVi ? "Thanh toán Thiết kế" : "Design Payment", pct: dPayPct },
                { label: isVi ? "Tiến độ Thi công" : "Construction Progress", pct: cProgress },
                { label: isVi ? "Thanh toán Thi công" : "Construction Payment", pct: cPayPct },
              ];
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/8">
                  {kpis.map(({ label, pct }, i) => (
                    <div key={i} className="bg-black px-5 py-6 sm:px-8 sm:py-8">
                      <p className="text-4xl sm:text-5xl lg:text-6xl font-thin text-white tabular-nums leading-none">
                        {pct}<span className="text-xl sm:text-2xl font-light">%</span>
                      </p>
                      <p className="text-xs uppercase tracking-[0.14em] font-light text-white/45 mt-4">{label}</p>
                      <div className="mt-3 w-full h-[2px] bg-white/10 rounded-full">
                        <div className="h-full bg-white/55 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Progress — 2 col (Design | Construction), mỗi cột 2 vòng tròn (Tiến độ | Thanh toán) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/8">
              {/* ── Thiết kế ── */}
              <div className="py-6 sm:py-10 lg:pr-10">
                <p className="text-xs font-light text-white/45 mb-6 sm:mb-8 uppercase tracking-[0.14em]">
                  {isVi ? "Thiết kế" : "Design"}
                </p>
                <div className="grid grid-cols-2 gap-6 items-stretch">
                  {renderCircle(
                    { label: isVi ? "Tiến Độ" : "Progress", progress: (() => {
                      if (result.client.designTimeline) return Math.min(100, Math.round((designInteractions.length / result.client.designTimeline) * 100));
                      const pt = (result.client.designPhaseTargets || {}) as Record<string, number>;
                      if (designPhases.length > 0) {
                        const sum = designPhases.reduce((acc, ph) => {
                          const t = pt[ph.value] || 0;
                          const l = designInteractions.filter(i => i.phase === ph.value).length;
                          return acc + (t > 0 ? Math.min(100, Math.round((l / t) * 100)) : 100);
                        }, 0);
                        return Math.round(sum / designPhases.length);
                      }
                      return 100;
                    })(), type: "design_progress" },
                    designPhases, (result.client.designPhaseTargets || {}) as Record<string, number>,
                    designInteractions, !!result.client.designTimeline
                  )}
                  {renderCircle(
                    { label: isVi ? "Thanh Toán" : "Payment", progress: (() => {
                      const tx = transactions.filter(t => !t.category || t.category === "design");
                      return tx.length > 0 ? Math.round((tx.filter(t => t.status === "completed").length / tx.length) * 100) : 0;
                    })(), type: "design_payment" },
                    [], {}, []
                  )}
                </div>
              </div>
              {/* ── Thi công ── */}
              <div className="py-6 sm:py-10 lg:pl-10">
                <p className="text-xs font-light text-white/45 mb-6 sm:mb-8 uppercase tracking-[0.14em]">
                  {isVi ? "Thi công" : "Construction"}
                </p>
                <div className="grid grid-cols-2 gap-6 items-stretch">
                  {renderCircle(
                    { label: isVi ? "Tiến Độ" : "Progress", progress: (() => {
                      if (result.client.constructionTimeline) return Math.min(100, Math.round((constructionInteractions.length / result.client.constructionTimeline) * 100));
                      const pt = (result.client.constructionPhaseTargets || {}) as Record<string, number>;
                      if (constructionPhases.length > 0) {
                        const sum = constructionPhases.reduce((acc, ph) => {
                          const t = pt[ph.value] || 0;
                          const l = constructionInteractions.filter(i => i.phase === ph.value).length;
                          return acc + (t > 0 ? Math.min(100, Math.round((l / t) * 100)) : 100);
                        }, 0);
                        return Math.round(sum / constructionPhases.length);
                      }
                      return 100;
                    })(), type: "construction_progress" },
                    constructionPhases, (result.client.constructionPhaseTargets || {}) as Record<string, number>,
                    constructionInteractions, !!result.client.constructionTimeline
                  )}
                  {renderCircle(
                    { label: isVi ? "Thanh Toán" : "Payment", progress: (() => {
                      const tx = transactions.filter(t => t.category === "construction");
                      return tx.length > 0 ? Math.round((tx.filter(t => t.status === "completed").length / tx.length) * 100) : 0;
                    })(), type: "construction_payment" },
                    [], {}, []
                  )}
                </div>
              </div>
            </div>

            {/* ── Phase Overview ── */}
            {(designPhases.length > 0 || constructionPhases.length > 0) && (
              <div className="border border-white/10 p-5 sm:p-8">
                <p className="text-xs font-light text-white/45 mb-6 sm:mb-8 uppercase tracking-[0.14em]">
                  {isVi ? "Tổng quan giai đoạn" : "Phase Overview"}
                </p>
                <div className="space-y-8">
                  {designPhases.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] font-light text-white/35 mb-5">{isVi ? "Thiết kế" : "Design"}</p>
                      <div className="space-y-5">
                        {designPhases.map((phase) => {
                          const pt = (result.client.designPhaseTargets || {}) as Record<string, number>;
                          const target = pt[phase.value] || 0;
                          const logged = designInteractions.filter(i => i.phase === phase.value).length;
                          const p = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : (result.client.designTimeline ? 0 : 100);
                          return (
                            <div key={phase.id} className="flex items-center gap-6">
                              <span className="text-sm font-light text-white/65 w-28 sm:w-40 md:w-52 shrink-0 truncate">{isVi ? phase.labelVi : phase.labelEn}</span>
                              <div className="flex-1 h-[2px] bg-white/10 rounded-full">
                                <div className="h-full bg-white/65 rounded-full transition-all duration-700 ease-out" style={{ width: `${p}%` }} />
                              </div>
                              <span className="text-sm font-light text-white/45 w-12 text-right tabular-nums shrink-0">{p}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {constructionPhases.length > 0 && (
                    <div className={designPhases.length > 0 ? "pt-6 border-t border-white/10" : ""}>
                      <p className="text-xs uppercase tracking-[0.14em] font-light text-white/35 mb-5">{isVi ? "Thi công" : "Construction"}</p>
                      <div className="space-y-5">
                        {constructionPhases.map((phase) => {
                          const pt = (result.client.constructionPhaseTargets || {}) as Record<string, number>;
                          const target = pt[phase.value] || 0;
                          const logged = constructionInteractions.filter(i => i.phase === phase.value).length;
                          const p = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : (result.client.constructionTimeline ? 0 : 100);
                          return (
                            <div key={phase.id} className="flex items-center gap-6">
                              <span className="text-sm font-light text-white/65 w-28 sm:w-40 md:w-52 shrink-0 truncate">{isVi ? phase.labelVi : phase.labelEn}</span>
                              <div className="flex-1 h-[2px] bg-white/10 rounded-full">
                                <div className="h-full bg-white/65 rounded-full transition-all duration-700 ease-out" style={{ width: `${p}%` }} />
                              </div>
                              <span className="text-sm font-light text-white/45 w-12 text-right tabular-nums shrink-0">{p}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Recent Activity ── */}
            {(() => {
              const allActivity = [
                ...designInteractions.map(i => ({ ...i, _type: "design" as const })),
                ...constructionInteractions.map(i => ({ ...i, _type: "construction" as const })),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
              if (allActivity.length === 0) return null;
              return (
                <div className="border border-white/10">
                  <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-white/10">
                    <p className="text-xs font-light text-white/45 uppercase tracking-[0.14em]">{isVi ? "Hoạt động gần đây" : "Recent Activity"}</p>
                  </div>
                  <div className="divide-y divide-white/8">
                    {allActivity.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center gap-3 sm:gap-5 px-4 sm:px-8 py-4 sm:py-5">
                        <span className="text-sm font-light text-white/45 w-20 sm:w-24 shrink-0 tabular-nums">{formatDate(item.date)}</span>
                        <span className={`text-xs uppercase tracking-[0.14em] font-light shrink-0 hidden sm:inline ${item._type === "design" ? "text-white/50" : "text-white/30"}`}>
                          {item._type === "design" ? (isVi ? "Thiết kế" : "Design") : (isVi ? "Thi công" : "Const.")}
                        </span>
                        <span className="text-sm font-light text-white/75 truncate flex-1">{item.title}</span>
                        {item.assignedTo && <span className="text-sm font-light text-white/40 shrink-0 hidden md:block">{item.assignedTo}</span>}
                        <Button variant="ghost" size="icon" onClick={() => setViewingInteraction(item)} className="h-7 w-7 text-white/40 hover:text-white shrink-0">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="border border-white/10 bg-black">
              {/* Tab headers */}
              <div className="flex flex-wrap border-b border-white/10">
                {([
                  { key: "design" as const, vi: "Tiến độ thiết kế", en: "Design Progress" },
                  { key: "construction" as const, vi: "Tiến độ thi công", en: "Construction Progress" },
                  { key: "warranty" as const, vi: "Nhật ký bảo hành", en: "Warranty Log" },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setTableSearch("");
                      setTablePhaseFilter("");
                      setDesignShowAll(false);
                      setConstructionShowAll(false);
                    }}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-light tracking-wide whitespace-nowrap transition-colors ${activeTab === tab.key ? "text-white border-b border-white/60 -mb-px" : "text-white/35 hover:text-white/65"}`}
                  >
                    {isVi ? tab.vi : tab.en}
                  </button>
                ))}
              </div>

              {/* Filter bar — chỉ hiện cho design & construction tabs */}
              {(activeTab === "design" || activeTab === "construction") && (() => {
                const currentPhases = activeTab === "design" ? designPhases : constructionPhases;
                return (
                  <div className="px-4 pt-4 pb-2 space-y-3">
                    {/* Search input */}
                    <div className="flex items-center gap-3">
                      <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => { setTableSearch(e.target.value); setDesignShowAll(false); setConstructionShowAll(false); }}
                        placeholder={isVi ? "Tìm theo tiêu đề..." : "Search by title..."}
                        className="flex-1 bg-transparent text-sm font-light text-white placeholder-white/25 outline-none"
                      />
                      {tableSearch && (
                        <button onClick={() => setTableSearch("")} className="text-white/30 hover:text-white transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {/* Phase filter chips */}
                    {currentPhases.length > 0 && (
                      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <button
                          onClick={() => { setTablePhaseFilter(""); setDesignShowAll(false); setConstructionShowAll(false); }}
                          className={`text-xs uppercase tracking-[0.12em] font-light transition-colors whitespace-nowrap shrink-0 ${!tablePhaseFilter ? "text-white" : "text-white/35 hover:text-white/65"}`}
                        >
                          {isVi ? "Tất cả" : "All"}
                        </button>
                        {currentPhases.map((phase) => (
                          <button
                            key={phase.id}
                            onClick={() => { setTablePhaseFilter(phase.value === tablePhaseFilter ? "" : phase.value); setDesignShowAll(false); setConstructionShowAll(false); }}
                            className={`text-xs uppercase tracking-[0.12em] font-light transition-colors whitespace-nowrap shrink-0 ${tablePhaseFilter === phase.value ? "text-white" : "text-white/35 hover:text-white/65"}`}
                          >
                            {isVi ? phase.labelVi : phase.labelEn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="p-4">
                {activeTab === "design" && renderInteractionTable(designInteractions, designPhases, tableSearch, tablePhaseFilter, designShowAll, () => setDesignShowAll(v => !v))}
                {activeTab === "construction" && renderInteractionTable(constructionInteractions, constructionPhases, tableSearch, tablePhaseFilter, constructionShowAll, () => setConstructionShowAll(v => !v))}
                {activeTab === "warranty" && (
                  <div className="space-y-0 overflow-x-auto">
                    {(result.warrantyLogs || []).length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-white/30 font-light">{isVi ? "Chưa có nhật ký bảo hành" : "No warranty logs yet"}</p>
                      </div>
                    ) : (
                      <div className="min-w-[700px]">
                        <div className="grid grid-cols-[40px_100px_1fr_1fr_100px_120px_50px] gap-2 px-4 py-2 border-b border-white/10">
                          <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "STT" : "No"}</span>
                          <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "Ngày" : "Date"}</span>
                          <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "Tiêu đề" : "Title"}</span>
                          <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "Mô tả" : "Description"}</span>
                          <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "Phụ trách" : "Assigned"}</span>
                          <span className="text-xs font-light text-white/30 uppercase tracking-[0.12em]">{isVi ? "Hình ảnh" : "Images"}</span>
                          <span></span>
                        </div>
                        {result.warrantyLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((log, index) => (
                          <div key={log.id} className="grid grid-cols-[40px_100px_1fr_1fr_100px_120px_50px] gap-2 px-4 py-2 border-b border-white/10 items-center">
                            <span className="text-sm font-light text-white/35">{index + 1}</span>
                            <span className="text-sm font-light text-white/50">{formatDate(log.date)}</span>
                            <span className="text-sm font-light text-white/80">{log.title}</span>
                            <span className="text-sm font-light text-white/45">{log.description ? (log.description.length > 50 ? log.description.substring(0, 50) + "..." : log.description) : "—"}</span>
                            <span className="text-sm font-light text-white/45">{log.assignedTo || "—"}</span>
                            <span>
                              {Array.isArray(log.attachments) && log.attachments.length > 0 ? (
                                <div className="flex gap-1 cursor-pointer" onClick={() => openLightbox(log.attachments as string[], 0)}>
                                  {(log.attachments as string[]).slice(0, 3).map((url, idx) => (
                                    <img key={idx} src={url} alt="" className="w-10 h-10 object-cover border border-white/10 hover:border-white/40 transition-colors" />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-white/30">—</span>
                              )}
                            </span>
                            <span>
                              <Button variant="ghost" size="icon" onClick={() => setViewingLog(log)} className="h-8 w-8 text-white/40 hover:text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border border-white/10 bg-black">
              <div className="px-5 py-5 sm:px-8 sm:py-6 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-light text-white/45 uppercase tracking-[0.14em]">{isVi ? "Yêu cầu hỗ trợ" : "Support Request"}</p>
                  <p className="text-xs font-light text-white/35 mt-2">
                    {isVi ? "Gửi câu hỏi hoặc yêu cầu hỗ trợ tới đội ngũ IEVRA" : "Send a question or request to the IEVRA team"}
                  </p>
                </div>
              </div>
              <form onSubmit={handleSupportSubmit}>
                <div className="px-5 pt-5 pb-6 sm:px-8 sm:pt-6 sm:pb-8">
                  <textarea
                    placeholder={isVi ? "Nhập yêu cầu hoặc ghi chú của bạn..." : "Type your request or notes here..."}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    rows={5}
                    className="w-full bg-transparent border-b border-white/15 py-4 text-sm font-light text-white placeholder-white/25 focus:outline-none focus:border-white/40 resize-none transition-colors leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-xs font-light text-white/25 tabular-nums">
                      {supportMessage.length > 0 ? `${supportMessage.length} ${isVi ? "ký tự" : "chars"}` : ""}
                    </span>
                    <button
                      type="submit"
                      disabled={submittingSupport || !supportMessage.trim()}
                      className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] font-light text-white/60 hover:text-white disabled:text-white/20 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingSupport ? (
                        <span>{isVi ? "Đang gửi..." : "Sending..."}</span>
                      ) : (
                        <>
                          <span>{isVi ? "Gửi yêu cầu" : "Send request"}</span>
                          <span className="text-white/30">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showCccdDialog} onOpenChange={setShowCccdDialog}>
        <DialogContent className="max-w-sm bg-black border border-white/20 rounded-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-light">{isVi ? "Xác minh danh tính" : "Verify Identity"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-white/60">{isVi ? "Nhập số CCCD/CMND/MST trên hợp đồng để xem toàn bộ thông tin" : "Enter ID card number from your contract to view full information"}</p>
            <Input
              value={cccdInput}
              onChange={(e) => setCccdInput(e.target.value)}
              placeholder={isVi ? "Nhập số CCCD/CMND/MST" : "Enter ID card number"}
              className="bg-transparent border-white/30 rounded-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && cccdInput.trim()) {
                  e.preventDefault();
                  handleVerifyCccd();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCccdDialog(false)} className="rounded-none border-white/30">
                {isVi ? "Hủy" : "Cancel"}
              </Button>
              <Button
                onClick={handleVerifyCccd}
                disabled={verifying || !cccdInput.trim()}
                className="rounded-none"
              >
                {verifying ? (isVi ? "Đang xác minh..." : "Verifying...") : (isVi ? "Xác minh" : "Verify")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingLog} onOpenChange={() => setViewingLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-light">{viewingLog?.title}</DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40">{isVi ? "Ngày" : "Date"}</span><p className="text-white">{formatDate(viewingLog.date)}</p></div>
                <div><span className="text-white/40">{isVi ? "Phụ trách" : "Assigned To"}</span><p className="text-white">{viewingLog.assignedTo || "—"}</p></div>
                {viewingLog.status && <div><span className="text-white/40">{isVi ? "Trạng thái" : "Status"}</span><p className="text-white">{viewingLog.status}</p></div>}
              </div>
              {viewingLog.description && (
                <div><span className="text-white/40 text-sm">{isVi ? "Mô tả" : "Description"}</span><p className="text-white text-sm mt-1 whitespace-pre-wrap">{viewingLog.description}</p></div>
              )}
              {Array.isArray(viewingLog.attachments) && viewingLog.attachments.length > 0 && (
                <div>
                  <span className="text-white/40 text-sm">{isVi ? "Tệp đính kèm" : "Attachments"}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(viewingLog.attachments as string[]).map((url, idx) => (
                      <div key={idx} onClick={() => openLightbox(viewingLog.attachments as string[], idx)} className="cursor-pointer">
                        <img src={url} alt="" className="w-32 h-32 object-cover border border-white/10 hover:border-white/40 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingInteraction} onOpenChange={() => setViewingInteraction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 rounded-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-light">{viewingInteraction?.title}</DialogTitle>
          </DialogHeader>
          {viewingInteraction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40">{isVi ? "Ngày" : "Date"}</span><p className="text-white">{formatDate(viewingInteraction.date)}</p></div>
                <div><span className="text-white/40">{isVi ? "Phụ trách" : "Assigned To"}</span><p className="text-white">{viewingInteraction.assignedTo || "—"}</p></div>
              </div>
              {viewingInteraction.description && (
                <div><span className="text-white/40 text-sm">{isVi ? "Mô tả" : "Description"}</span><p className="text-white text-sm mt-1 whitespace-pre-wrap">{viewingInteraction.description}</p></div>
              )}
              {viewingInteraction.nextAction && (
                <div><span className="text-white/40 text-sm">{isVi ? "Đề xuất" : "Suggestion"}</span><p className="text-white text-sm mt-1 whitespace-pre-wrap">{viewingInteraction.nextAction}</p></div>
              )}
              {viewingInteraction.outcome && (
                <div><span className="text-white/40 text-sm">{isVi ? "Kết quả" : "Outcome"}</span><p className="text-white text-sm mt-1 whitespace-pre-wrap">{viewingInteraction.outcome}</p></div>
              )}
              {Array.isArray(viewingInteraction.attachments) && viewingInteraction.attachments.length > 0 && (
                <div>
                  <span className="text-white/40 text-sm">{isVi ? "Tệp đính kèm" : "Attachments"}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(viewingInteraction.attachments as string[]).map((url, idx) => (
                      <div key={idx} onClick={() => openLightbox(viewingInteraction.attachments as string[], idx)} className="cursor-pointer">
                        <img src={url} alt="" className="w-32 h-32 object-cover border border-white/10 hover:border-white/40 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {lightboxImages.length > 0 && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center overflow-hidden" onClick={closeLightbox} onWheel={(e) => e.preventDefault()} onTouchMove={(e) => e.preventDefault()}>
          <button type="button" onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="absolute top-4 right-4 text-white/60 hover:text-white z-10 p-2">
            <X className="w-6 h-6" />
          </button>
          {lightboxImages.length > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length); }} className="absolute left-4 text-white/60 hover:text-white z-10 p-2">
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          <img src={lightboxImages[lightboxIndex]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          {lightboxImages.length > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % lightboxImages.length); }} className="absolute right-4 text-white/60 hover:text-white z-10 p-2">
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          <div className="absolute bottom-4 text-white/50 text-sm">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
