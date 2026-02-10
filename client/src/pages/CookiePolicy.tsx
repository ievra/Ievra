import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CookiePolicy() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "COOKIE INFORMATION",
      lastUpdated: "Last updated: September 26, 2025",
      sections: [
        {
          title: "What Are Cookies?",
          content: `Cookies are small text files that are stored on your computer or mobile device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our website.

At IEVRA Design & Build, we use cookies to enhance your browsing experience, analyze website traffic, and provide personalized content related to our interior design services.`
        },
        {
          title: "Types of Cookies We Use",
          content: `We use several types of cookies on our website:

**Essential Cookies:** These are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.

**Performance Cookies:** These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.

**Functional Cookies:** These cookies allow the website to remember choices you make (such as your preferred language) to provide enhanced, more personal features.

**Targeting Cookies:** These cookies are used to deliver advertisements more relevant to you and your interests in interior design and architecture.`
        },
        {
          title: "How We Use Cookies",
          content: `We use cookies for the following purposes:

• To remember your language preference (English or Vietnamese)
• To analyze website traffic and user behavior
• To improve our website functionality and user experience
• To provide personalized content about our interior design projects
• To enable social media sharing features
• To measure the effectiveness of our marketing campaigns`
        },
        {
          title: "Managing Your Cookie Preferences",
          content: `You can control and manage cookies in various ways:

**Browser Settings:** Most web browsers allow you to control cookies through their settings preferences. You can set your browser to refuse cookies or alert you when cookies are being sent.

**Website Settings:** You can adjust your cookie preferences through our website's cookie consent banner that appears on your first visit.

**Third-Party Cookies:** Some cookies on our site are set by third-party services. You can manage these through the respective third-party websites.`
        },
        {
          title: "Contact Us",
          content: `If you have any questions about our use of cookies, please contact us:

IEVRA Design & Build
1st Floor, Sabay Building
140B Nguyen Van Troi Street
Phu Nhuan District, Ho Chi Minh City, Vietnam
Phone: 094 367 9879
Email: info@moderno-interiors.com`
        }
      ]
    },
    vi: {
      title: "THÔNG TIN COOKIE",
      lastUpdated: "Cập nhật lần cuối: 26 tháng 9, 2025",
      sections: [
        {
          title: "Cookie Là Gì?",
          content: `Cookie là các tệp văn bản nhỏ được lưu trữ trên máy tính hoặc thiết bị di động của bạn khi bạn truy cập trang web của chúng tôi. Chúng giúp chúng tôi cung cấp cho bạn trải nghiệm tốt hơn bằng cách ghi nhớ sở thích của bạn và hiểu cách bạn sử dụng trang web của chúng tôi.

Tại IEVRA Design & Build, chúng tôi sử dụng cookie để nâng cao trải nghiệm duyệt web của bạn, phân tích lưu lượng truy cập trang web và cung cấp nội dung được cá nhân hóa liên quan đến các dịch vụ thiết kế nội thất của chúng tôi.`
        },
        {
          title: "Các Loại Cookie Chúng Tôi Sử Dụng",
          content: `Chúng tôi sử dụng một số loại cookie trên trang web của mình:

**Cookie Thiết Yếu:** Những cookie này cần thiết để trang web hoạt động bình thường. Chúng cho phép các chức năng cốt lõi như bảo mật, quản lý mạng và khả năng truy cập.

**Cookie Hiệu Suất:** Những cookie này giúp chúng tôi hiểu cách khách truy cập tương tác với trang web của chúng tôi bằng cách thu thập và báo cáo thông tin một cách ẩn danh.

**Cookie Chức Năng:** Những cookie này cho phép trang web ghi nhớ các lựa chọn bạn thực hiện (chẳng hạn như ngôn ngữ ưa thích của bạn) để cung cấp các tính năng nâng cao, cá nhân hóa hơn.

**Cookie Nhắm Mục Tiêu:** Những cookie này được sử dụng để cung cấp quảng cáo phù hợp hơn với bạn và sở thích của bạn về thiết kế nội thất và kiến trúc.`
        },
        {
          title: "Cách Chúng Tôi Sử Dụng Cookie",
          content: `Chúng tôi sử dụng cookie cho các mục đích sau:

• Để ghi nhớ sở thích ngôn ngữ của bạn (tiếng Anh hoặc tiếng Việt)
• Để phân tích lưu lượng truy cập trang web và hành vi người dùng
• Để cải thiện chức năng trang web và trải nghiệm người dùng
• Để cung cấp nội dung được cá nhân hóa về các dự án thiết kế nội thất của chúng tôi
• Để kích hoạt các tính năng chia sẻ mạng xã hội
• Để đo lường hiệu quả của các chiến dịch tiếp thị của chúng tôi`
        },
        {
          title: "Quản Lý Tùy Chọn Cookie Của Bạn",
          content: `Bạn có thể kiểm soát và quản lý cookie theo nhiều cách khác nhau:

**Cài Đặt Trình Duyệt:** Hầu hết các trình duyệt web cho phép bạn kiểm soát cookie thông qua tùy chọn cài đặt của chúng. Bạn có thể đặt trình duyệt từ chối cookie hoặc cảnh báo khi cookie được gửi.

**Cài Đặt Trang Web:** Bạn có thể điều chỉnh tùy chọn cookie của mình thông qua biểu ngữ đồng ý cookie của trang web xuất hiện trong lần truy cập đầu tiên.

**Cookie Bên Thứ Ba:** Một số cookie trên trang web của chúng tôi được đặt bởi các dịch vụ bên thứ ba. Bạn có thể quản lý chúng thông qua các trang web bên thứ ba tương ứng.`
        },
        {
          title: "Liên Hệ Với Chúng Tôi",
          content: `Nếu bạn có bất kỳ câu hỏi nào về việc sử dụng cookie của chúng tôi, vui lòng liên hệ với chúng tôi:

IEVRA Design & Build
Lầu 1, Tòa nhà Sabay
140B Nguyễn Văn Trỗi
Quận Phú Nhuận, TP. Hồ Chí Minh, Việt Nam
Điện thoại: 094 367 9879
Email: info@moderno-interiors.com`
        }
      ]
    }
  };

  const currentContent = content[language as keyof typeof content];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide">
            {currentContent.title}
          </h1>
          <p className="text-white/60 font-light">
            {currentContent.lastUpdated}
          </p>
        </div>

        <div className="space-y-12">
          {currentContent.sections.map((section, index) => (
            <section key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-8">
              <h2 className="text-2xl font-light text-white mb-6 tracking-wide">
                {section.title}
              </h2>
              <div className="text-white/80 font-light leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <div className="text-center mt-16">
          <a 
            href="/"
            className="inline-block text-white hover:text-white/80 transition-colors duration-300 font-light tracking-wide text-sm"
            data-testid="back-to-home"
          >
            {language === 'vi' ? 'QUAY LẠI TRANG CHỦ' : 'BACK TO HOME'}
          </a>
        </div>
      </div>
    </Layout>
  );
}