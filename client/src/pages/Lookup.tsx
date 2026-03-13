import { useState, useEffect, useRef } from "react";
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
    warrantyStatus: string | null;
    warrantyExpiry: string | null;
    designTimeline: number | null;
    constructionTimeline: number | null;
    designPhaseTargets: Record<string, number> | null;
    constructionPhaseTargets: Record<string, number> | null;
  };
  interactions: LookupInteraction[];
  transactions: LookupTransaction[];
  warrantyLogs: LookupWarrantyLog[];
  designPhases: LookupPhase[];
  constructionPhases: LookupPhase[];
}

export default function Lookup() {
  const { language } = useLanguage();
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

  const renderCircle = (item: { label: string; progress: number; type: string }, phases: LookupPhase[], phaseTargets: Record<string, number>, circleInteractions: LookupInteraction[]) => {
    const vb = 100;
    const sw = 10;
    const r = (vb - sw) / 2;
    const circ = 2 * Math.PI * r;
    const filled = (item.progress / 100) * circ;
    const gap = circ - filled;
    return (
      <div className="flex flex-col items-center p-4">
        <div className="relative w-full aspect-square max-w-[240px]">
          <svg viewBox={`0 0 ${vb} ${vb}`} className="w-full h-full transform -rotate-90">
            <circle cx={vb/2} cy={vb/2} r={r} fill="none" stroke="#555" strokeWidth={sw} />
            {item.progress > 0 && (
              <circle cx={vb/2} cy={vb/2} r={r} fill="none" stroke="#bbb" strokeWidth={sw} strokeDasharray={`${filled} ${gap}`} className="transition-all duration-700 ease-out" />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-medium text-white/70">{item.progress}%</span>
          </div>
        </div>
        <p className="text-sm text-white/50 font-light mt-3">{item.label}</p>
        {phases.length > 0 && (
          <div className="w-full mt-4 space-y-2">
            {phases.map((phase) => {
              const target = phaseTargets[phase.value] || 0;
              const logged = circleInteractions.filter((int) => int.phase === phase.value).length;
              const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 100;
              return (
                <div key={phase.id} className="space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-white/50 truncate max-w-[70%]">{isVi ? phase.labelVi : phase.labelEn}</span>
                    <span className="text-[11px] text-white/40">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 overflow-hidden">
                    <div className="h-full bg-white/50 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {(item.type === "design_payment" || item.type === "construction_payment") && (() => {
          const paymentTx = item.type === "design_payment"
            ? transactions.filter((t) => !t.category || t.category === "design")
            : transactions.filter((t) => t.category === "construction");
          if (paymentTx.length === 0) return null;
          return (
            <div className="w-full mt-4 space-y-2">
              {[...paymentTx].reverse().map((tx, txIdx) => {
                const pct = tx.status === "completed" ? 100 : 0;
                return (
                  <div key={tx.id || txIdx} className="space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-white/50 truncate max-w-[70%]">{tx.title || tx.description || `${isVi ? "Giao dịch" : "Transaction"} ${txIdx + 1}`}</span>
                      <span className="text-[11px] text-white/40">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 overflow-hidden">
                      <div className="h-full bg-white/50 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  };

  const renderInteractionTable = (interactions: LookupInteraction[], phases: LookupPhase[]) => {
    return (
      <div className="space-y-0 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[40px_120px_1fr_100px_160px_50px] gap-2 px-4 py-2 border-b border-white/10">
            <span className="text-sm text-white/30">{isVi ? "STT" : "No"}</span>
            <span className="text-sm text-white/30">{isVi ? "Ngày" : "Date"}</span>
            <span className="text-sm text-white/30">{isVi ? "Tiêu đề" : "Title"}</span>
            <span className="text-sm text-white/30">{isVi ? "Phụ trách" : "Assigned"}</span>
            <span className="text-sm text-white/30">{isVi ? "Hình ảnh" : "Images"}</span>
            <span className="text-sm text-white/30"></span>
          </div>
          {phases.map((phase, phaseIdx) => {
            const phaseInteractions = interactions.filter(i => i.phase === phase.value).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return (
              <div key={phase.id}>
                {phaseIdx > 0 && <div className="border-t border-white/20 my-0" />}
                <div className="py-3 px-2">
                  <span className="text-sm font-medium text-white/70">{isVi ? phase.labelVi : phase.labelEn}</span>
                </div>
                {phaseInteractions.length > 0 && phaseInteractions.map((interaction, index) => (
                  <div key={interaction.id} className="grid grid-cols-[40px_120px_1fr_100px_160px_50px] gap-2 px-4 py-2 border-b border-white/10 items-center">
                    <span className="text-white/40 text-sm">{index + 1}</span>
                    <span className="text-white/70 text-sm">{formatDate(interaction.date)}</span>
                    <span className="text-white text-sm">{interaction.title}</span>
                    <span className="text-white/60 text-sm">{interaction.assignedTo || "—"}</span>
                    <span>
                      {Array.isArray(interaction.attachments) && interaction.attachments.length > 0 ? (
                        <div className="flex gap-1 cursor-pointer" onClick={() => openLightbox(interaction.attachments as string[], 0)}>
                          {(interaction.attachments as string[]).slice(0, 3).map((url, idx) => (
                            <img key={idx} src={url} alt="" className="w-10 h-10 object-cover border border-white/10 hover:border-white/40 transition-colors" />
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </span>
                    <span>
                      <Button variant="ghost" size="icon" onClick={() => setViewingInteraction(interaction)} className="h-8 w-8 text-white/40 hover:text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
          {(() => {
            const orphaned = interactions.filter(i => !i.phase || !phases.some(p => p.value === i.phase));
            if (orphaned.length === 0) return null;
            return (
              <div>
                <div className="border-t border-white/20 my-0" />
                <div className="py-3 px-2">
                  <span className="text-sm font-medium text-white/40">{isVi ? "Khác" : "Other"}</span>
                </div>
                {orphaned.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((interaction, index) => (
                  <div key={interaction.id} className="grid grid-cols-[40px_120px_1fr_100px_160px_50px] gap-2 px-4 py-2 border-b border-white/10 items-center">
                    <span className="text-white/40 text-sm">{index + 1}</span>
                    <span className="text-white/70 text-sm">{formatDate(interaction.date)}</span>
                    <span className="text-white text-sm">{interaction.title}</span>
                    <span className="text-white/60 text-sm">{interaction.assignedTo || "—"}</span>
                    <span>
                      {Array.isArray(interaction.attachments) && interaction.attachments.length > 0 ? (
                        <div className="flex gap-1 cursor-pointer" onClick={() => openLightbox(interaction.attachments as string[], 0)}>{(interaction.attachments as string[]).slice(0, 3).map((url, idx) => (<img key={idx} src={url} alt="" className="w-10 h-10 object-cover border border-white/10 hover:border-white/40 transition-colors" />))}</div>
                      ) : (<span className="text-white/30">—</span>)}
                    </span>
                    <span>
                      <Button variant="ghost" size="icon" onClick={() => setViewingInteraction(interaction)} className="h-8 w-8 text-white/40 hover:text-white"><Eye className="w-3.5 h-3.5" /></Button>
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
          {interactions.length === 0 && phases.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/30 font-light">{isVi ? "Chưa có nhật ký" : "No logs yet"}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide text-center">
            {isVi ? "TRA CỨU" : "LOOKUP"}
          </h1>
          <p className="text-white/60 font-light text-lg mb-10 text-center">
            {isVi
              ? "Nhập số điện thoại để tra cứu tiến độ dự án, nhật ký công trình và thông tin bảo hành."
              : "Enter your phone number to check project progress, construction log and warranty information."}
          </p>

          <form onSubmit={handleSearch}>
            <div className="flex items-end gap-2 pb-4">
              <Input
                ref={inputRef}
                type="tel"
                placeholder={typedPlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent text-white placeholder-white/60 px-0 py-0 text-lg font-light rounded-none focus-visible:ring-0 flex-1 border-0 border-b border-white/30"
              />
              <button
                type="submit"
                disabled={loading || phone.trim().length < 6}
                className="text-white/40 hover:text-white transition-colors disabled:opacity-30 pb-0.5 -ml-1"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>

        {error && searched && (
          <div className="max-w-3xl mx-auto">
            <div className="border border-white/10 p-8 text-center">
              <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 font-light">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="border border-white/20 p-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-light text-white">
                    {infoRevealed ? `${result.client.lastName} ${result.client.firstName}` : (() => {
                      const last = result.client.lastName || "";
                      const first = result.client.firstName || "";
                      const nameParts = `${last} ${first}`.trim().split(" ");
                      return nameParts.map((p, i) => i === 0 ? p : "*".repeat(p.length)).join(" ");
                    })()}
                  </h3>
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
                    className="text-white/40 hover:text-white transition-colors p-1"
                    title={infoRevealed ? (isVi ? "Ẩn thông tin" : "Hide info") : (isVi ? "Hiển thị thông tin" : "Show info")}
                  >
                    {infoRevealed ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 pl-0.5">
                  {result.client.phone && <span>{infoRevealed ? result.client.phone : result.client.phone.slice(0, 3) + "*".repeat(Math.max(0, result.client.phone.length - 3))}</span>}
                  {result.client.phone && result.client.email && <span className="text-white/20">-</span>}
                  {result.client.email && <span>{infoRevealed ? result.client.email : (() => {
                    const atIdx = result.client.email.indexOf("@");
                    if (atIdx <= 0) return "*".repeat(result.client.email.length);
                    const local = result.client.email.slice(0, atIdx);
                    const domain = result.client.email.slice(atIdx);
                    return local.slice(0, 3) + "*".repeat(Math.max(0, local.length - 3)) + domain;
                  })()}</span>}
                </div>
                {(result.client.company || result.client.address) && (
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/40 pl-0.5">
                    {result.client.company && <span>{infoRevealed ? result.client.company : "*".repeat(16)}</span>}
                    {result.client.company && result.client.address && <span className="text-white/20">-</span>}
                    {result.client.address && <span>{infoRevealed ? result.client.address : "*".repeat(16)}</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="border border-white/20 p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-white/70 tracking-wider uppercase mb-4 pb-2 border-b border-white/10">{isVi ? "Tiến Độ Thiết Kế" : "Design Progress"}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderCircle(
                      { label: isVi ? "Tiến Độ" : "Progress", progress: (() => { const has = !!result.client.designTimeline; return has ? Math.min(100, Math.round((designInteractions.length / result.client.designTimeline!) * 100)) : 0; })(), type: "design_progress" },
                      designPhases, (result.client.designPhaseTargets || {}), designInteractions
                    )}
                    {renderCircle(
                      { label: isVi ? "Thanh Toán" : "Payment", progress: (() => { const tx = transactions.filter(t => !t.category || t.category === "design"); const done = tx.filter(t => t.status === "completed").length; return tx.length > 0 ? Math.round((done / tx.length) * 100) : 0; })(), type: "design_payment" },
                      [], {}, []
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/70 tracking-wider uppercase mb-4 pb-2 border-b border-white/10">{isVi ? "Tiến Độ Thi Công" : "Construction Progress"}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderCircle(
                      { label: isVi ? "Tiến Độ" : "Progress", progress: (() => { const has = !!result.client.constructionTimeline; return has ? Math.min(100, Math.round((constructionInteractions.length / result.client.constructionTimeline!) * 100)) : 0; })(), type: "construction_progress" },
                      constructionPhases, (result.client.constructionPhaseTargets || {}), constructionInteractions
                    )}
                    {renderCircle(
                      { label: isVi ? "Thanh Toán" : "Payment", progress: (() => { const tx = transactions.filter(t => t.category === "construction"); const done = tx.filter(t => t.status === "completed").length; return tx.length > 0 ? Math.round((done / tx.length) * 100) : 0; })(), type: "construction_payment" },
                      [], {}, []
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-white/20">
              <div className="flex flex-wrap border-b border-white/20">
                {([
                  { key: "design" as const, vi: "Tiến độ thiết kế", en: "Design Progress" },
                  { key: "construction" as const, vi: "Tiến độ thi công", en: "Construction Progress" },
                  { key: "warranty" as const, vi: "Nhật ký bảo hành", en: "Warranty Log" },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-light tracking-wider whitespace-nowrap transition-colors ${activeTab === tab.key ? "text-white border-b-2 border-white -mb-[1px]" : "text-white/40 hover:text-white/70"}`}
                  >
                    {isVi ? tab.vi : tab.en}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === "design" && renderInteractionTable(designInteractions, designPhases)}
                {activeTab === "construction" && renderInteractionTable(constructionInteractions, constructionPhases)}
                {activeTab === "warranty" && (
                  <div className="space-y-0 overflow-x-auto">
                    {(result.warrantyLogs || []).length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-white/30 font-light">{isVi ? "Chưa có nhật ký bảo hành" : "No warranty logs yet"}</p>
                      </div>
                    ) : (
                      <div className="min-w-[700px]">
                        <div className="grid grid-cols-[40px_100px_1fr_1fr_100px_120px_50px] gap-2 px-4 py-2 border-b border-white/10">
                          <span className="text-sm text-white/30">{isVi ? "STT" : "No"}</span>
                          <span className="text-sm text-white/30">{isVi ? "Ngày" : "Date"}</span>
                          <span className="text-sm text-white/30">{isVi ? "Tiêu đề" : "Title"}</span>
                          <span className="text-sm text-white/30">{isVi ? "Mô tả" : "Description"}</span>
                          <span className="text-sm text-white/30">{isVi ? "Phụ trách" : "Assigned"}</span>
                          <span className="text-sm text-white/30">{isVi ? "Hình ảnh" : "Images"}</span>
                          <span className="text-sm text-white/30"></span>
                        </div>
                        {result.warrantyLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, index) => (
                          <div key={log.id} className="grid grid-cols-[40px_100px_1fr_1fr_100px_120px_50px] gap-2 px-4 py-2 border-b border-white/10 items-center">
                            <span className="text-white/40 text-sm">{index + 1}</span>
                            <span className="text-white/70 text-sm">{formatDate(log.date)}</span>
                            <span className="text-white text-sm">{log.title}</span>
                            <span className="text-white/50 text-sm">{log.description ? (log.description.length > 50 ? log.description.substring(0, 50) + "..." : log.description) : "—"}</span>
                            <span className="text-white/60 text-sm">{log.assignedTo || "—"}</span>
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

            <div className="border border-white/20 p-6">
              <h3 className="text-sm font-medium text-white/70 tracking-wider uppercase mb-6 pb-2 border-b border-white/10">
                {isVi ? "Yêu Cầu Hỗ Trợ" : "Support Request"}
              </h3>
              <form onSubmit={handleSupportSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      value={infoRevealed
                        ? `${result.client.lastName} ${result.client.firstName}`.trim()
                        : (() => {
                            const nameParts = `${result.client.lastName || ""} ${result.client.firstName || ""}`.trim().split(" ");
                            return nameParts.map((p, i) => i === 0 ? p : "*".repeat(p.length)).join(" ");
                          })()}
                      readOnly
                      className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 py-4 text-white/50 focus-visible:ring-0 cursor-default"
                    />
                    <Input
                      type="text"
                      value={infoRevealed
                        ? (result.client.email || "")
                        : (() => {
                            const em = result.client.email || "";
                            if (!em) return "";
                            const atIdx = em.indexOf("@");
                            if (atIdx <= 0) return "*".repeat(em.length);
                            const local = em.slice(0, atIdx);
                            const domain = em.slice(atIdx);
                            return local.slice(0, 3) + "*".repeat(Math.max(0, local.length - 3)) + domain;
                          })()}
                      readOnly
                      placeholder={isVi ? "Email" : "Email"}
                      className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 py-4 text-white/50 placeholder-white/30 focus-visible:ring-0 cursor-default"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      value={infoRevealed
                        ? (result.client.phone || phone.trim())
                        : (() => {
                            const ph = result.client.phone || phone.trim();
                            if (!ph) return "";
                            return ph.slice(0, 3) + "*".repeat(Math.max(0, ph.length - 3));
                          })()}
                      readOnly
                      className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 py-4 text-white/50 focus-visible:ring-0 cursor-default"
                    />
                    <Input
                      type="text"
                      value={infoRevealed
                        ? (result.client.address || "")
                        : (result.client.address ? "*".repeat(16) : "")}
                      readOnly
                      placeholder={isVi ? "Địa chỉ dự án" : "Project address"}
                      className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 py-4 text-white/50 placeholder-white/30 focus-visible:ring-0 cursor-default"
                    />
                  </div>
                  <Textarea
                    placeholder={isVi ? "Nhập yêu cầu hoặc ghi chú..." : "Enter your request or notes..."}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="bg-transparent border border-white/20 rounded-none px-0 py-4 text-white placeholder-white/40 focus:border-white/50 focus-visible:ring-0 min-h-[120px] resize-none"
                  />
                  <div className="flex justify-center pt-2">
                    <Button
                      type="submit"
                      disabled={submittingSupport || !supportMessage.trim()}
                      className="bg-transparent border border-white/30 text-white hover:border-white hover:bg-white/10 px-8 py-3 font-light tracking-widest uppercase transition-all duration-300 rounded-none"
                    >
                      {submittingSupport ? (isVi ? "Đang gửi..." : "Sending...") : (isVi ? "GỬI YÊU CẦU" : "SEND REQUEST")}
                    </Button>
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
        <DialogContent className="max-w-lg bg-black border border-white/20 rounded-none">
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
                <div><span className="text-white/40 text-sm">{isVi ? "Mô tả" : "Description"}</span><p className="text-white text-sm mt-1">{viewingLog.description}</p></div>
              )}
              {Array.isArray(viewingLog.attachments) && viewingLog.attachments.length > 0 && (
                <div>
                  <span className="text-white/40 text-sm">{isVi ? "Tệp đính kèm" : "Attachments"}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(viewingLog.attachments as string[]).map((url, idx) => (
                      <div key={idx} onClick={() => openLightbox(viewingLog.attachments as string[], idx)} className="cursor-pointer">
                        <img src={url} alt="" className="w-20 h-20 object-cover border border-white/10 hover:border-white/40 transition-colors" />
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
        <DialogContent className="max-w-lg bg-black border border-white/20 rounded-none">
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
                <div><span className="text-white/40 text-sm">{isVi ? "Mô tả" : "Description"}</span><p className="text-white text-sm mt-1">{viewingInteraction.description}</p></div>
              )}
              {viewingInteraction.nextAction && (
                <div><span className="text-white/40 text-sm">{isVi ? "Đề xuất" : "Suggestion"}</span><p className="text-white text-sm mt-1">{viewingInteraction.nextAction}</p></div>
              )}
              {viewingInteraction.outcome && (
                <div><span className="text-white/40 text-sm">{isVi ? "Kết quả" : "Outcome"}</span><p className="text-white text-sm mt-1">{viewingInteraction.outcome}</p></div>
              )}
              {Array.isArray(viewingInteraction.attachments) && viewingInteraction.attachments.length > 0 && (
                <div>
                  <span className="text-white/40 text-sm">{isVi ? "Tệp đính kèm" : "Attachments"}</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(viewingInteraction.attachments as string[]).map((url, idx) => (
                      <div key={idx} onClick={() => openLightbox(viewingInteraction.attachments as string[], idx)} className="cursor-pointer">
                        <img src={url} alt="" className="w-20 h-20 object-cover border border-white/10 hover:border-white/40 transition-colors" />
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
