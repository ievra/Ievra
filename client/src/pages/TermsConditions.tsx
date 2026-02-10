import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TermsConditions() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "TERMS & CONDITIONS",
      lastUpdated: "Last updated: September 26, 2025",
      sections: [
        {
          title: "Introduction",
          content: `Welcome to IEVRA Design & Build. These Terms and Conditions ("Terms") govern your use of our website and services. By accessing our website or using our interior design services, you agree to be bound by these Terms.

IEVRA Design & Build is an interior design and architecture firm located in Ho Chi Minh City, Vietnam, specializing in residential, commercial, and architectural design projects.`
        },
        {
          title: "Services",
          content: `IEVRA Design & Build provides the following services:

**Interior Design:** Complete interior design solutions for residential and commercial spaces
**Architecture:** Architectural design and planning services
**Consultation:** Design consultation and project management
**Project Management:** Full-service project coordination and execution

All services are subject to separate agreements and contracts that will specify the scope, timeline, and pricing for each project.`
        },
        {
          title: "Website Use",
          content: `When using our website, you agree to:

• Use the website for lawful purposes only
• Not interfere with the website's functionality
• Not attempt to gain unauthorized access to any part of the website
• Not transmit any harmful or malicious content
• Respect intellectual property rights
• Provide accurate information when submitting inquiries

We reserve the right to suspend or terminate access to our website if these terms are violated.`
        },
        {
          title: "Intellectual Property",
          content: `All content on this website, including but not limited to:

• Design images and project photographs
• Text content and descriptions
• Logo and branding materials
• Website design and layout
• Software and code

Are the exclusive property of IEVRA Design & Build or used with permission. You may not reproduce, distribute, or use any content without our written consent.`
        },
        {
          title: "Project Terms",
          content: `For design projects, the following terms apply:

**Contracts:** All projects require a signed contract detailing scope, timeline, and payment terms
**Deposits:** Projects typically require a deposit before commencement
**Revisions:** The number of revisions included will be specified in each contract
**Ownership:** Final designs become your property upon full payment
**Delays:** We are not responsible for delays caused by client-requested changes or external factors
**Cancellation:** Cancellation terms will be specified in individual contracts`
        },
        {
          title: "Privacy and Data Protection",
          content: `We take your privacy seriously. Our collection and use of personal information is governed by our Privacy Policy. By using our services, you consent to our privacy practices as outlined in our Privacy Policy.

Personal information may include contact details, project preferences, and communication records. We use this information solely for providing our services and improving your experience.`
        },
        {
          title: "Limitation of Liability",
          content: `IEVRA Design & Build's liability is limited to the maximum extent permitted by law. We are not liable for:

• Indirect, incidental, or consequential damages
• Loss of profits or revenue
• Delays caused by circumstances beyond our control
• Third-party services or products
• Force majeure events

Our total liability for any claim will not exceed the amount paid for the specific service giving rise to the claim.`
        },
        {
          title: "Contact Information",
          content: `For any questions regarding these Terms and Conditions, please contact us:

IEVRA Design & Build
1st Floor, Sabay Building
140B Nguyen Van Troi Street
Phu Nhuan District, Ho Chi Minh City, Vietnam
Phone: 094 367 9879
Email: info@moderno-interiors.com

These terms are governed by Vietnamese law and any disputes will be resolved in the courts of Ho Chi Minh City, Vietnam.`
        }
      ]
    },
    vi: {
      title: "ĐIỀU KHOẢN & ĐIỀU KIỆN",
      lastUpdated: "Cập nhật lần cuối: 26 tháng 9, 2025",
      sections: [
        {
          title: "Giới Thiệu",
          content: `Chào mừng bạn đến với IEVRA Design & Build. Các Điều khoản và Điều kiện này ("Điều khoản") điều chỉnh việc sử dụng trang web và dịch vụ của chúng tôi. Bằng cách truy cập trang web của chúng tôi hoặc sử dụng các dịch vụ thiết kế nội thất của chúng tôi, bạn đồng ý bị ràng buộc bởi các Điều khoản này.

IEVRA Design & Build là một công ty thiết kế nội thất và kiến trúc có trụ sở tại Thành phố Hồ Chí Minh, Việt Nam, chuyên về các dự án thiết kế dân cư, thương mại và kiến trúc.`
        },
        {
          title: "Dịch Vụ",
          content: `IEVRA Design & Build cung cấp các dịch vụ sau:

**Thiết Kế Nội Thất:** Giải pháp thiết kế nội thất hoàn chỉnh cho không gian dân cư và thương mại
**Kiến Trúc:** Dịch vụ thiết kế và quy hoạch kiến trúc
**Tư Vấn:** Tư vấn thiết kế và quản lý dự án
**Quản Lý Dự Án:** Dịch vụ điều phối và thực hiện dự án đầy đủ

Tất cả các dịch vụ đều phải tuân theo các thỏa thuận và hợp đồng riêng biệt sẽ chỉ định phạm vi, thời gian và giá cả cho từng dự án.`
        },
        {
          title: "Sử Dụng Trang Web",
          content: `Khi sử dụng trang web của chúng tôi, bạn đồng ý:

• Sử dụng trang web chỉ cho mục đích hợp pháp
• Không can thiệp vào chức năng của trang web
• Không cố gắng truy cập trái phép vào bất kỳ phần nào của trang web
• Không truyền tải bất kỳ nội dung có hại hoặc độc hại
• Tôn trọng quyền sở hữu trí tuệ
• Cung cấp thông tin chính xác khi gửi yêu cầu

Chúng tôi có quyền tạm dừng hoặc chấm dứt quyền truy cập vào trang web của chúng tôi nếu các điều khoản này bị vi phạm.`
        },
        {
          title: "Sở Hữu Trí Tuệ",
          content: `Tất cả nội dung trên trang web này, bao gồm nhưng không giới hạn:

• Hình ảnh thiết kế và ảnh dự án
• Nội dung văn bản và mô tả
• Logo và tài liệu thương hiệu
• Thiết kế và bố cục trang web
• Phần mềm và mã

Là tài sản độc quyền của IEVRA Design & Build hoặc được sử dụng với sự cho phép. Bạn không được sao chép, phân phối hoặc sử dụng bất kỳ nội dung nào mà không có sự đồng ý bằng văn bản của chúng tôi.`
        },
        {
          title: "Điều Khoản Dự Án",
          content: `Đối với các dự án thiết kế, các điều khoản sau được áp dụng:

**Hợp Đồng:** Tất cả các dự án đều yêu cầu hợp đồng đã ký chi tiết phạm vi, thời gian và điều khoản thanh toán
**Tiền Đặt Cọc:** Các dự án thường yêu cầu tiền đặt cọc trước khi bắt đầu
**Sửa Đổi:** Số lần sửa đổi được bao gồm sẽ được chỉ định trong mỗi hợp đồng
**Quyền Sở Hữu:** Thiết kế cuối cùng trở thành tài sản của bạn khi thanh toán đầy đủ
**Chậm Trễ:** Chúng tôi không chịu trách nhiệm về sự chậm trễ do khách hàng yêu cầu thay đổi hoặc các yếu tố bên ngoài
**Hủy Bỏ:** Điều khoản hủy bỏ sẽ được chỉ định trong các hợp đồng riêng lẻ`
        },
        {
          title: "Quyền Riêng Tư và Bảo Vệ Dữ Liệu",
          content: `Chúng tôi coi trọng quyền riêng tư của bạn. Việc thu thập và sử dụng thông tin cá nhân của chúng tôi được điều chỉnh bởi Chính sách Quyền riêng tư của chúng tôi. Bằng cách sử dụng dịch vụ của chúng tôi, bạn đồng ý với các thực hành quyền riêng tư của chúng tôi như được nêu trong Chính sách Quyền riêng tư của chúng tôi.

Thông tin cá nhân có thể bao gồm chi tiết liên hệ, sở thích dự án và hồ sơ giao tiếp. Chúng tôi sử dụng thông tin này chỉ để cung cấp dịch vụ và cải thiện trải nghiệm của bạn.`
        },
        {
          title: "Giới Hạn Trách Nhiệm",
          content: `Trách nhiệm của IEVRA Design & Build được giới hạn ở mức tối đa được pháp luật cho phép. Chúng tôi không chịu trách nhiệm về:

• Thiệt hại gián tiếp, ngẫu nhiên hoặc hậu quả
• Mất lợi nhuận hoặc doanh thu
• Chậm trễ do các tình huống nằm ngoài tầm kiểm soát của chúng tôi
• Dịch vụ hoặc sản phẩm của bên thứ ba
• Các sự kiện bất khả kháng

Tổng trách nhiệm của chúng tôi đối với bất kỳ khiếu nại nào sẽ không vượt quá số tiền đã trả cho dịch vụ cụ thể phát sinh khiếu nại.`
        },
        {
          title: "Thông Tin Liên Hệ",
          content: `Đối với bất kỳ câu hỏi nào liên quan đến các Điều khoản và Điều kiện này, vui lòng liên hệ với chúng tôi:

IEVRA Design & Build
Lầu 1, Tòa nhà Sabay
140B Nguyễn Văn Trỗi
Quận Phú Nhuận, TP. Hồ Chí Minh, Việt Nam
Điện thoại: 094 367 9879
Email: info@moderno-interiors.com

Các điều khoản này được điều chỉnh bởi luật pháp Việt Nam và mọi tranh chấp sẽ được giải quyết tại các tòa án của Thành phố Hồ Chí Minh, Việt Nam.`
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