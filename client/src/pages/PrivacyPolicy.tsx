import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "PRIVACY POLICY",
      lastUpdated: "Last updated: September 26, 2025",
      sections: [
        {
          title: "Introduction",
          content: `At IEVRA Design & Build, we are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website or use our interior design services.

We take data protection seriously and comply with applicable privacy laws and regulations in Vietnam and internationally.`
        },
        {
          title: "Information We Collect",
          content: `We collect several types of information to provide and improve our services:

**Personal Information You Provide:**
• Name and contact information (email, phone number, address)
• Project details and design preferences
• Communication records and correspondence
• Payment information for services rendered

**Information Collected Automatically:**
• Website usage data and analytics
• IP addresses and browser information
• Cookies and similar tracking technologies
• Page views and interaction patterns

**Information from Third Parties:**
• References from previous clients or partners
• Public information from professional networks
• Vendor and supplier recommendations`
        },
        {
          title: "How We Use Your Information",
          content: `We use your personal information for the following purposes:

**Service Delivery:**
• Providing interior design and architectural services
• Project management and coordination
• Client communication and updates
• Scheduling consultations and site visits

**Business Operations:**
• Processing payments and invoicing
• Maintaining client records and project files
• Improving our services and processes
• Marketing our services (with your consent)

**Legal Compliance:**
• Meeting regulatory requirements
• Protecting our legal rights and interests
• Responding to legal requests or court orders`
        },
        {
          title: "Information Sharing",
          content: `We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:

**Service Providers:**
• Trusted contractors and suppliers working on your project
• Payment processors and financial institutions
• Professional consultants (engineers, architects, etc.)
• IT service providers and website hosting

**Legal Requirements:**
• When required by law or legal process
• To protect our rights, property, or safety
• To prevent fraud or illegal activities
• With your explicit consent

All third parties are bound by confidentiality agreements and are required to protect your information.`
        },
        {
          title: "Data Security",
          content: `We implement comprehensive security measures to protect your personal information:

**Technical Safeguards:**
• Secure SSL encryption for data transmission
• Regular security updates and patches
• Access controls and authentication systems
• Secure backup and storage systems

**Physical Safeguards:**
• Secure office facilities with restricted access
• Locked filing cabinets for physical documents
• Secure disposal of sensitive documents
• Employee access controls and monitoring

**Administrative Safeguards:**
• Employee privacy training and awareness
• Regular security audits and assessments
• Incident response procedures
• Data retention and disposal policies`
        },
        {
          title: "Your Rights",
          content: `You have certain rights regarding your personal information:

**Access and Correction:**
• Request copies of your personal information
• Correct inaccurate or incomplete information
• Update your contact preferences

**Data Control:**
• Withdraw consent for marketing communications
• Request deletion of your personal information
• Object to certain processing activities
• Request data portability where applicable

**Communication Preferences:**
• Opt-out of marketing emails
• Choose your preferred communication methods
• Update your language preferences

To exercise these rights, please contact us using the information provided below.`
        },
        {
          title: "Data Retention",
          content: `We retain your personal information only as long as necessary to:

• Fulfill the purposes for which it was collected
• Comply with legal and regulatory requirements
• Resolve disputes and enforce agreements
• Provide ongoing services and support

**Retention Periods:**
• Active client records: Duration of project plus 7 years
• Marketing communications: Until you unsubscribe
• Website analytics: 26 months
• Financial records: As required by Vietnamese law

When information is no longer needed, we securely delete or anonymize it.`
        },
        {
          title: "Contact Us",
          content: `If you have questions about this Privacy Policy or want to exercise your privacy rights, please contact us:

**Privacy Officer**
IEVRA Design & Build
1st Floor, Sabay Building
140B Nguyen Van Troi Street
Phu Nhuan District, Ho Chi Minh City, Vietnam

**Contact Information:**
Phone: 094 367 9879
Email: privacy@moderno-interiors.com
General Email: info@moderno-interiors.com

We will respond to your privacy inquiries within 30 days. This Privacy Policy may be updated periodically, and we will notify you of any significant changes.`
        }
      ]
    },
    vi: {
      title: "CHÍNH SÁCH BẢO MẬT",
      lastUpdated: "Cập nhật lần cuối: 26 tháng 9, 2025",
      sections: [
        {
          title: "Giới Thiệu",
          content: `Tại IEVRA Design & Build, chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. Chính sách Bảo mật này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi bạn truy cập trang web của chúng tôi hoặc sử dụng các dịch vụ thiết kế nội thất của chúng tôi.

Chúng tôi coi trọng việc bảo vệ dữ liệu và tuân thủ các luật và quy định về quyền riêng tư hiện hành tại Việt Nam và quốc tế.`
        },
        {
          title: "Thông Tin Chúng Tôi Thu Thập",
          content: `Chúng tôi thu thập một số loại thông tin để cung cấp và cải thiện dịch vụ của mình:

**Thông Tin Cá Nhân Bạn Cung Cấp:**
• Tên và thông tin liên hệ (email, số điện thoại, địa chỉ)
• Chi tiết dự án và sở thích thiết kế
• Hồ sơ giao tiếp và thư từ
• Thông tin thanh toán cho các dịch vụ được cung cấp

**Thông Tin Thu Thập Tự Động:**
• Dữ liệu sử dụng trang web và phân tích
• Địa chỉ IP và thông tin trình duyệt
• Cookie và công nghệ theo dõi tương tự
• Lượt xem trang và mẫu tương tác

**Thông Tin Từ Bên Thứ Ba:**
• Giới thiệu từ khách hàng hoặc đối tác trước đây
• Thông tin công khai từ mạng lưới chuyên nghiệp
• Khuyến nghị của nhà cung cấp và nhà cung ứng`
        },
        {
          title: "Cách Chúng Tôi Sử Dụng Thông Tin Của Bạn",
          content: `Chúng tôi sử dụng thông tin cá nhân của bạn cho các mục đích sau:

**Cung Cấp Dịch Vụ:**
• Cung cấp dịch vụ thiết kế nội thất và kiến trúc
• Quản lý và điều phối dự án
• Giao tiếp và cập nhật với khách hàng
• Lập lịch tư vấn và thăm công trình

**Hoạt Động Kinh Doanh:**
• Xử lý thanh toán và lập hóa đơn
• Duy trì hồ sơ khách hàng và tệp dự án
• Cải thiện dịch vụ và quy trình của chúng tôi
• Tiếp thị dịch vụ của chúng tôi (với sự đồng ý của bạn)

**Tuân Thủ Pháp Luật:**
• Đáp ứng các yêu cầu quy định
• Bảo vệ quyền và lợi ích hợp pháp của chúng tôi
• Phản hồi các yêu cầu pháp lý hoặc lệnh của tòa án`
        },
        {
          title: "Chia Sẻ Thông Tin",
          content: `Chúng tôi không bán, trao đổi hoặc chuyển giao thông tin cá nhân của bạn cho bên thứ ba, trừ trong các trường hợp sau:

**Nhà Cung Cấp Dịch Vụ:**
• Các nhà thầu và nhà cung ứng đáng tin cậy làm việc trong dự án của bạn
• Bộ xử lý thanh toán và tổ chức tài chính
• Các chuyên gia tư vấn chuyên nghiệp (kỹ sư, kiến trúc sư, v.v.)
• Các nhà cung cấp dịch vụ CNTT và lưu trữ trang web

**Yêu Cầu Pháp Lý:**
• Khi được yêu cầu bởi pháp luật hoặc quy trình pháp lý
• Để bảo vệ quyền, tài sản hoặc an toàn của chúng tôi
• Để ngăn chặn gian lận hoặc hoạt động bất hợp pháp
• Với sự đồng ý rõ ràng của bạn

Tất cả các bên thứ ba đều bị ràng buộc bởi các thỏa thuận bảo mật và được yêu cầu bảo vệ thông tin của bạn.`
        },
        {
          title: "Bảo Mật Dữ Liệu",
          content: `Chúng tôi thực hiện các biện pháp bảo mật toàn diện để bảo vệ thông tin cá nhân của bạn:

**Biện Pháp Bảo Vệ Kỹ Thuật:**
• Mã hóa SSL an toàn cho việc truyền dữ liệu
• Cập nhật và vá lỗi bảo mật thường xuyên
• Hệ thống kiểm soát truy cập và xác thực
• Hệ thống sao lưu và lưu trữ an toàn

**Biện Pháp Bảo Vệ Vật Lý:**
• Cơ sở văn phòng an toàn với quyền truy cập hạn chế
• Tủ hồ sơ có khóa cho tài liệu vật lý
• Hủy bỏ an toàn các tài liệu nhạy cảm
• Kiểm soát và giám sát truy cập của nhân viên

**Biện Pháp Bảo Vệ Hành Chính:**
• Đào tạo và nâng cao nhận thức về quyền riêng tư cho nhân viên
• Kiểm toán và đánh giá bảo mật thường xuyên
• Quy trình ứng phó sự cố
• Chính sách lưu giữ và hủy bỏ dữ liệu`
        },
        {
          title: "Quyền Của Bạn",
          content: `Bạn có một số quyền nhất định liên quan đến thông tin cá nhân của mình:

**Truy Cập và Sửa Đổi:**
• Yêu cầu bản sao thông tin cá nhân của bạn
• Sửa chữa thông tin không chính xác hoặc không đầy đủ
• Cập nhật tùy chọn liên hệ của bạn

**Kiểm Soát Dữ Liệu:**
• Rút lại sự đồng ý cho việc giao tiếp tiếp thị
• Yêu cầu xóa thông tin cá nhân của bạn
• Phản đối các hoạt động xử lý nhất định
• Yêu cầu tính di động dữ liệu khi có thể

**Tùy Chọn Giao Tiếp:**
• Từ chối email tiếp thị
• Chọn phương thức giao tiếp ưa thích của bạn
• Cập nhật tùy chọn ngôn ngữ của bạn

Để thực hiện các quyền này, vui lòng liên hệ với chúng tôi bằng thông tin được cung cấp bên dưới.`
        },
        {
          title: "Lưu Giữ Dữ Liệu",
          content: `Chúng tôi chỉ giữ lại thông tin cá nhân của bạn miễn là cần thiết để:

• Hoàn thành các mục đích mà nó được thu thập
• Tuân thủ các yêu cầu pháp lý và quy định
• Giải quyết tranh chấp và thực thi thỏa thuận
• Cung cấp dịch vụ và hỗ trợ liên tục

**Thời Gian Lưu Giữ:**
• Hồ sơ khách hàng đang hoạt động: Thời gian dự án cộng 7 năm
• Giao tiếp tiếp thị: Cho đến khi bạn hủy đăng ký
• Phân tích trang web: 26 tháng
• Hồ sơ tài chính: Theo yêu cầu của luật pháp Việt Nam

Khi thông tin không còn cần thiết, chúng tôi sẽ xóa hoặc ẩn danh nó một cách an toàn.`
        },
        {
          title: "Liên Hệ Với Chúng Tôi",
          content: `Nếu bạn có câu hỏi về Chính sách Bảo mật này hoặc muốn thực hiện quyền riêng tư của mình, vui lòng liên hệ với chúng tôi:

**Nhân Viên Bảo Mật**
IEVRA Design & Build
Lầu 1, Tòa nhà Sabay
140B Nguyễn Văn Trỗi
Quận Phú Nhuận, TP. Hồ Chí Minh, Việt Nam

**Thông Tin Liên Hệ:**
Điện thoại: 094 367 9879
Email: privacy@moderno-interiors.com
Email chung: info@moderno-interiors.com

Chúng tôi sẽ phản hồi các yêu cầu về quyền riêng tư của bạn trong vòng 30 ngày. Chính sách Bảo mật này có thể được cập nhật định kỳ và chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi đáng kể nào.`
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