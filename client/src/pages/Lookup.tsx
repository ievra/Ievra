import { useState, useEffect, useRef } from "react";
import { Search, Phone, User, Shield, Calendar, FileText, ArrowRight, Clock, CheckCircle, AlertCircle, XCircle, Briefcase, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface LookupResult {
  client: {
    firstName: string;
    lastName: string;
    stage: string;
    tier: string;
    warrantyStatus: string | null;
    warrantyExpiry: string | null;
  };
  deals: Array<{
    title: string;
    stage: string;
    value: string;
    expectedCloseDate: string | null;
    actualCloseDate: string | null;
    description: string | null;
    createdAt: string;
  }>;
  interactions: Array<{
    type: string;
    title: string;
    description: string | null;
    date: string;
    outcome: string | null;
    nextAction: string | null;
    nextActionDate: string | null;
  }>;
  transactions: Array<{
    title: string;
    description: string | null;
    amount: string;
    type: string;
    status: string;
    paymentDate: string;
  }>;
}

const stageLabels: Record<string, { vi: string; en: string }> = {
  lead: { vi: "Tiềm năng", en: "Lead" },
  prospect: { vi: "Quan tâm", en: "Prospect" },
  contract: { vi: "Hợp đồng", en: "Contract" },
  delivery: { vi: "Thi công", en: "Delivery" },
  aftercare: { vi: "Hậu mãi", en: "Aftercare" },
};

const dealStageLabels: Record<string, { vi: string; en: string }> = {
  proposal: { vi: "Đề xuất", en: "Proposal" },
  negotiation: { vi: "Đàm phán", en: "Negotiation" },
  contract: { vi: "Hợp đồng", en: "Contract" },
  delivery: { vi: "Thi công", en: "Delivery" },
  completed: { vi: "Hoàn thành", en: "Completed" },
  lost: { vi: "Thất bại", en: "Lost" },
};

const interactionTypeLabels: Record<string, { vi: string; en: string }> = {
  visit: { vi: "Khảo sát", en: "Site Visit" },
  meeting: { vi: "Họp", en: "Meeting" },
  site_survey: { vi: "Khảo sát hiện trạng", en: "Site Survey" },
  design: { vi: "Thiết kế", en: "Design" },
  acceptance: { vi: "Nghiệm thu", en: "Acceptance" },
  call: { vi: "Gọi điện", en: "Phone Call" },
  email: { vi: "Email", en: "Email" },
};

const tierLabels: Record<string, { vi: string; en: string }> = {
  silver: { vi: "Bạc", en: "Silver" },
  gold: { vi: "Vàng", en: "Gold" },
  platinum: { vi: "Bạch Kim", en: "Platinum" },
  vip: { vi: "VIP", en: "VIP" },
};

export default function Lookup() {
  const { language } = useLanguage();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "deals" | "transactions">("timeline");
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholderText = language === "vi" ? "Nhập số điện thoại của bạn..." : "Enter your phone number...";

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

    try {
      const res = await fetch(`/api/lookup?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || (language === "vi" ? "Không tìm thấy" : "Not found"));
      } else {
        setResult(data);
      }
    } catch {
      setError(language === "vi" ? "Đã xảy ra lỗi. Vui lòng thử lại." : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toLocaleString("vi-VN") + " đ";
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "lost": return <XCircle className="w-4 h-4 text-red-400" />;
      case "delivery": return <Clock className="w-4 h-4 text-blue-400" />;
      default: return <AlertCircle className="w-4 h-4 text-white/40" />;
    }
  };

  const getWarrantyColor = (status: string | null) => {
    switch (status) {
      case "active": return "text-green-400 border-green-400/30";
      case "expired": return "text-red-400 border-red-400/30";
      default: return "text-white/40 border-white/10";
    }
  };

  return (
    <div className="min-h-screen bg-black pt-52 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide text-center">
            {language === "vi" ? "TRA CỨU" : "LOOKUP"}
          </h1>
          <p className="text-white/60 font-light text-lg mb-10 text-center">
            {language === "vi"
              ? "Nhập số điện thoại để tra cứu tiến độ dự án, nhật ký hoạt động và thông tin bảo hành."
              : "Enter your phone number to check project progress, activity log and warranty information."}
          </p>

          <form onSubmit={handleSearch}>
            <div className="flex items-end gap-8 pb-4">
              <Input
                ref={inputRef}
                type="tel"
                placeholder={typedPlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent text-white placeholder-white/60 px-0 py-0 text-lg font-light rounded-none focus-visible:ring-0 flex-1"
              />
              <button
                type="submit"
                disabled={loading || phone.trim().length < 6}
                className="text-white/40 hover:text-white transition-colors disabled:opacity-30 pb-0.5"
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
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-5 h-5 text-white/40" />
                  <span className="text-white/40 text-xs uppercase tracking-widest">
                    {language === "vi" ? "Khách hàng" : "Customer"}
                  </span>
                </div>
                <h2 className="text-2xl font-light text-white mb-2">
                  {result.client.lastName} {result.client.firstName}
                </h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs uppercase tracking-wider border border-white/20 px-3 py-1 text-white/60">
                    {tierLabels[result.client.tier]?.[language] || result.client.tier}
                  </span>
                  <span className="text-xs uppercase tracking-wider border border-white/20 px-3 py-1 text-white/60">
                    {stageLabels[result.client.stage]?.[language] || result.client.stage}
                  </span>
                </div>
              </div>

              <div className="border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-white/40" />
                  <span className="text-white/40 text-xs uppercase tracking-widest">
                    {language === "vi" ? "Bảo hành" : "Warranty"}
                  </span>
                </div>
                <div className={`text-lg font-light mb-1 ${getWarrantyColor(result.client.warrantyStatus).split(' ')[0]}`}>
                  {result.client.warrantyStatus === "active"
                    ? (language === "vi" ? "Đang hiệu lực" : "Active")
                    : result.client.warrantyStatus === "expired"
                    ? (language === "vi" ? "Đã hết hạn" : "Expired")
                    : (language === "vi" ? "Chưa có" : "None")}
                </div>
                {result.client.warrantyExpiry && (
                  <p className="text-white/40 text-sm font-light">
                    {language === "vi" ? "Hết hạn: " : "Expires: "}
                    {formatDate(result.client.warrantyExpiry)}
                  </p>
                )}
              </div>

              <div className="border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-white/40" />
                  <span className="text-white/40 text-xs uppercase tracking-widest">
                    {language === "vi" ? "Tổng quan" : "Overview"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-light text-white">{result.deals.length}</p>
                    <p className="text-white/40 text-xs uppercase tracking-wider">
                      {language === "vi" ? "Hợp đồng" : "Deals"}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-light text-white">{result.interactions.length}</p>
                    <p className="text-white/40 text-xs uppercase tracking-wider">
                      {language === "vi" ? "Hoạt động" : "Activities"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-white/10">
              <div className="flex border-b border-white/10">
                {([
                  { key: "timeline" as const, vi: "Nhật ký", en: "Timeline", icon: Clock },
                  { key: "deals" as const, vi: "Hợp đồng", en: "Deals", icon: Briefcase },
                  { key: "transactions" as const, vi: "Giao dịch", en: "Transactions", icon: CreditCard },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-light tracking-wider uppercase transition-colors ${
                      activeTab === tab.key
                        ? "text-white border-b-2 border-white -mb-[1px]"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {language === "vi" ? tab.vi : tab.en}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "timeline" && (
                  <div>
                    {result.interactions.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-white/30 font-light">
                          {language === "vi" ? "Chưa có hoạt động nào" : "No activities yet"}
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-[7px] top-3 bottom-3 w-[1px] bg-white/10" />
                        <div className="space-y-6">
                          {result.interactions.map((interaction, idx) => (
                            <div key={idx} className="flex gap-6 relative">
                              <div className="relative z-10 mt-1.5">
                                <div className="w-[15px] h-[15px] rounded-full border-2 border-white/30 bg-black" />
                              </div>
                              <div className="flex-1 pb-6">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-xs uppercase tracking-wider text-white/30">
                                    {interactionTypeLabels[interaction.type]?.[language] || interaction.type}
                                  </span>
                                  <span className="text-white/20">·</span>
                                  <span className="text-xs text-white/30">{formatDate(interaction.date)}</span>
                                </div>
                                <h4 className="text-white font-light text-base mb-1">{interaction.title}</h4>
                                {interaction.description && (
                                  <p className="text-white/50 text-sm font-light">{interaction.description}</p>
                                )}
                                {interaction.outcome && (
                                  <div className="mt-2 flex items-start gap-2">
                                    <ArrowRight className="w-3 h-3 text-white/30 mt-1 flex-shrink-0" />
                                    <span className="text-white/40 text-sm font-light">{interaction.outcome}</span>
                                  </div>
                                )}
                                {interaction.nextAction && (
                                  <div className="mt-2 border-l-2 border-white/10 pl-3">
                                    <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">
                                      {language === "vi" ? "Bước tiếp theo" : "Next step"}
                                    </p>
                                    <p className="text-white/50 text-sm font-light">{interaction.nextAction}</p>
                                    {interaction.nextActionDate && (
                                      <p className="text-white/30 text-xs mt-0.5">{formatDate(interaction.nextActionDate)}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "deals" && (
                  <div>
                    {result.deals.length === 0 ? (
                      <div className="text-center py-12">
                        <Briefcase className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-white/30 font-light">
                          {language === "vi" ? "Chưa có hợp đồng nào" : "No deals yet"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {result.deals.map((deal, idx) => (
                          <div key={idx} className="border border-white/10 p-5 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-white font-light text-lg">{deal.title}</h4>
                                {deal.description && (
                                  <p className="text-white/40 text-sm font-light mt-1">{deal.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {getStageIcon(deal.stage)}
                                <span className="text-xs uppercase tracking-wider border border-white/20 px-3 py-1 text-white/60">
                                  {dealStageLabels[deal.stage]?.[language] || deal.stage}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-white/30 text-xs uppercase tracking-wider">
                                  {language === "vi" ? "Giá trị" : "Value"}
                                </span>
                                <p className="text-white font-light">{formatCurrency(deal.value)}</p>
                              </div>
                              {deal.expectedCloseDate && (
                                <div>
                                  <span className="text-white/30 text-xs uppercase tracking-wider">
                                    {language === "vi" ? "Dự kiến" : "Expected"}
                                  </span>
                                  <p className="text-white/60 font-light">{formatDate(deal.expectedCloseDate)}</p>
                                </div>
                              )}
                              {deal.actualCloseDate && (
                                <div>
                                  <span className="text-white/30 text-xs uppercase tracking-wider">
                                    {language === "vi" ? "Hoàn thành" : "Completed"}
                                  </span>
                                  <p className="text-white/60 font-light">{formatDate(deal.actualCloseDate)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "transactions" && (
                  <div>
                    {result.transactions.length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-white/30 font-light">
                          {language === "vi" ? "Chưa có giao dịch nào" : "No transactions yet"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {result.transactions.map((tx, idx) => (
                          <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0">
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                tx.type === "refund" ? "bg-red-500/10" : tx.type === "commission" ? "bg-yellow-500/10" : "bg-green-500/10"
                              }`}>
                                <CreditCard className={`w-4 h-4 ${
                                  tx.type === "refund" ? "text-red-400" : tx.type === "commission" ? "text-yellow-400" : "text-green-400"
                                }`} />
                              </div>
                              <div>
                                <p className="text-white font-light text-sm">{tx.title}</p>
                                {tx.description && <p className="text-white/30 text-xs font-light">{tx.description}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-light ${
                                tx.type === "refund" ? "text-red-400" : "text-white"
                              }`}>
                                {tx.type === "refund" ? "-" : "+"}{formatCurrency(tx.amount)}
                              </p>
                              <p className="text-white/30 text-xs">{formatDate(tx.paymentDate)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!searched && (
          <div className="max-w-3xl mx-auto text-center pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Clock,
                  title: language === "vi" ? "Tiến độ dự án" : "Project Progress",
                  desc: language === "vi" ? "Theo dõi trạng thái và các mốc quan trọng" : "Track status and key milestones",
                },
                {
                  icon: FileText,
                  title: language === "vi" ? "Nhật ký hoạt động" : "Activity Log",
                  desc: language === "vi" ? "Xem lịch sử tương tác và ghi chú" : "View interaction history and notes",
                },
                {
                  icon: Shield,
                  title: language === "vi" ? "Thông tin bảo hành" : "Warranty Info",
                  desc: language === "vi" ? "Kiểm tra trạng thái bảo hành" : "Check warranty status",
                },
              ].map((item, idx) => (
                <div key={idx} className="border border-white/10 p-6">
                  <item.icon className="w-8 h-8 text-white/20 mx-auto mb-4" />
                  <h3 className="text-white font-light text-base mb-2">{item.title}</h3>
                  <p className="text-white/40 font-light text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
